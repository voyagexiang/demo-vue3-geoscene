import * as THREE from 'three'

/**
 * @class
 * @anthor 蒋雪雪（email: jiangxx@geoscene.cn）
 * @param options {Object} 参数集
 * @param options.view {Object} new SceneView的对象
 * @param options.QueryTask {Object} new QueryTask的对象
 * @param options.Query {Object} new Query的对象
 * @param options.externalRenderers {Object} new externalRenderers的对象
 * @param options.queryUrl {String} 查询的底面要素服务地址
 * @param options.extrudeField {String} 拉伸高度字段
 * @param options.interval {Number} 拉伸高度间隔（速度）
 * @param options.maxHeight {Number} 拉伸的最大高度
 * @param options.minHeight {Number} 拉伸的最小高度
 * @param options.rgbArray {Number} rgb颜色数组
 */
let ExtrudeLayer = {
  constructor(options) {
    this.opts = {
      QueryTask: null,
      Query: null
    }
    this.opts.QueryTask = options.QueryTask
    this.opts.Query = options.Query
    this.view = options.view
    this.queryUrl = options.queryUrl || null
    this.extrudeField = options.extrudeField || null
    this.interval = options.interval || 50//拉伸速度
    this.maxHeight = options.maxHeight || 2000//最大高度
    this.minHeight = options.minHeight || 200//最小高度
    this.rgbArray = options.rgbArray || [255, 0, 0]//整体颜色
    this.HsvColor = 0
    this.geometryArray = []
    this._camera = null
    this.webgl = options.webgl
  },
  /**
   * 渲染器初始化
   * @memberof ExtrudeLayer
   * @method setup
   */
  initialize() {
    this.renderer = new THREE.WebGLRenderer({
      context: this.gl, // 可用于将渲染器附加到已有的渲染环境中
      premultipliedAlpha: false // renderer是否假设颜色有 premultiplied alpha. 默认为true
    })
    this.renderer.setPixelRatio(window.devicePixelRatio) // 设置设备像素比。通常用于避免HiDPI设备上绘图模糊
    this.renderer.setViewport(0, 0, this.view.width, this.view.height) // 视口大小设置

    this.renderer.autoClear = false
    this.renderer.autoClearDepth = false
    this.renderer.autoClearColor = false

    let originalSetRenderTarget = this.renderer.setRenderTarget.bind(this.renderer)
    this.renderer.setRenderTarget = function(target) {
      originalSetRenderTarget(target)
      if (target === null) {
        this.bindRenderTarget()
      }
    }

    this.scene = new THREE.Scene()
    // setup the camera
    let cam = this.camera
    this._camera = new THREE.PerspectiveCamera(cam.fovY, cam.aspect, cam.near, cam.far)

    // 添加坐标轴辅助工具
    const axesHelper = new THREE.AxesHelper(1)
    axesHelper.position.copy(1000000, 100000, 100000)
    this.scene.add(axesHelper)

    let grid = new THREE.GridHelper(30, 10, 0xf0f0f0, 0xffffff)
    this.scene.add(grid)

    // setup scene lighting
    this.ambient = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(this.ambient)
    this.sun = new THREE.DirectionalLight(0xffffff, 0.5)
    this.sun.position.set(-600, 300, 60000)
    this.scene.add(this.sun)

    this.HsvColor = this.rgbToHsv()

    this.getCoords()
    this.resetWebGLState()
  },
  /**
   * 渲染器更新渲染
   * @memberof ExtrudeLayer
   * @method render
   */
  render() {
    let cam = this.camera
    //需要调整相机的视角
    this._camera.position.set(cam.eye[0], cam.eye[1], cam.eye[2])
    this._camera.up.set(cam.up[0], cam.up[1], cam.up[2])
    this._camera.lookAt(new THREE.Vector3(cam.center[0], cam.center[1], cam.center[2]))
    // Projection matrix can be copied directly
    this._camera.projectionMatrix.fromArray(cam.projectionMatrix)
    // update lighting
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // view.environment.lighting.date = Date.now();
    let l = this.sunLight
    this.sun.position.set(
      l.direction[0],
      l.direction[1],
      l.direction[2]
    )
    this.sun.intensity = l.diffuse.intensity
    this.sun.color = new THREE.Color(l.diffuse.color[0], l.diffuse.color[1], l.diffuse.color[2])
    this.ambient.intensity = l.ambient.intensity
    this.ambient.color = new THREE.Color(l.ambient.color[0], l.ambient.color[1], l.ambient.color[2])


    // draw the scene
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // this.renderer.resetGLState();
    this.renderer.state.reset()
    this.bindRenderTarget()

    this.renderer.render(this.scene, this._camera)
    // as we want to smoothly animate the ISS movement, immediately request a re-render
    this.requestRender(this.view)
    if (this.geometryArray.length > 0) {
      this.updateGeometry()
    }
    // cleanup
    this.resetWebGLState()
  },
  /**
   * 获取底面几何坐标
   * @memberof ExtrudeLayer
   * @method getCoords
   */
  getCoords() {
    let query = new this.opts.Query()
    query.returnGeometry = true
    query.outFields = ['*']
    query.where = '1=1'
    let that = this
    this.opts.QueryTask.executeQueryJSON(this.queryUrl, query).then(function(results) {
      for (let k = 0; k < results.features.length; k++) {
        let rings = results.features[k].geometry.rings[0]//默认一个环
        let coordsArray = new Array(rings.length * 3)
        let begin = new Array(rings.length * 3)
        for (let i = 0; i < rings.length; i++) {
          begin[i * 3] = rings[i][0]
          begin[i * 3 + 1] = rings[i][1]
          begin[i * 3 + 2] = 100
        }
        that.webgl.toRenderCoordinates(that.view, begin, 0, that.view.spatialReference, coordsArray, 0, rings.length)

        let height = that.getHeight(results.features, results.features[k].attributes[that.extrudeField])
        let color = that.getColorByValue(results.features, results.features[k].attributes[that.extrudeField])
        //创建几何
        that.createGeometry(coordsArray, height, color)
      }
      that.resetWebGLState()
    })
  },
  /**
   * 创建拉伸几何
   * @memberof ExtrudeLayer
   * @method createGeometry
   * @param {Array} coordsArray 底面渲染坐标数组
   * @param {Number} height 拉伸高度
   * @param {String} color 拉伸几何颜色
   * @example
   * 示例
   * const coordsArray = [13546596.67, 3640096.83, 300，13546596.67, 3640096.83, 300，13546596.67, 3640096.83, 300];
   * const height = 100;
   * const color = 'rgb(100,100,100)';
   * ExtrudeLayer.createGeometry(coordsArray, height, color);
   */
  createGeometry(coordsArray, height, color) {
    const shape = new THREE.Shape()//底面几何
    for (let j = 0; j < coordsArray.length; j = j + 3) {
      let x = coordsArray[j]
      let y = coordsArray[j + 1]
      if (j === 0) {
        shape.moveTo(x, y)
      }
      shape.lineTo(x, y)
    }
    const extrudeSettings = {
      depth: 10,
      bevelEnabled: false
    }
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    const material = new THREE.MeshPhongMaterial({ color: color, transparent: true, opacity: 0.8 })
    material.castShadow = true
    const mesh = new THREE.Mesh(geometry, material)
    this.geometryArray.push({ height: height, extrudeGeometry: shape, mesh: mesh, material: material })
    this.scene.add(mesh)
  },
  /**
   * 更新几何，实现拉伸效果
   * @memberof ExtrudeLayer
   * @method updateGeometry
   */
  updateGeometry() {
    if (this.geometryArray.length > 0) {
      for (let k = 0; k < this.geometryArray.length; k++) {
        let geo = this.geometryArray[k]
        if (geo.mesh.geometry.parameters.options.depth < geo.height) {
          let extrudeSettings = {
            depth: geo.mesh.geometry.parameters.options.depth + this.interval,
            bevelEnabled: false
          }
          const geometry = new THREE.ExtrudeGeometry(geo.extrudeGeometry, extrudeSettings)
          const newMesh = new THREE.Mesh(geometry, geo.material)
          this.scene.remove(geo.mesh)
          this.scene.add(newMesh)
          this.geometryArray[k].mesh = newMesh
        }
      }
    }
  },
  /**
   * 根据几何拉伸字段值，计算渲染器中的拉伸高度
   * @memberof ExtrudeLayer
   * @method getHeight
   * @param {Array} graphics 需要拉伸的所有底面几何
   * @param {Number} value 拉伸高度字段
   * @returns 计算后的高度
   * @example
   * 示例
   * const graphics = [{attributes:{},geometry:{}}];
   * const value = 500;
   * ExtrudeLayer.getHeight(graphics, value);
   */
  getHeight(graphics, value) {
    let height = this.minHeight
    const minH = this.minHeight
    const maxH = this.maxHeight
    if (this.extrudeField) {
      let min = parseFloat(graphics[0].attributes[this.extrudeField])
      let max = parseFloat(graphics[0].attributes[this.extrudeField])
      for (let k = 0; k < graphics.length; k++) {
        let num = parseFloat(graphics[k].attributes[this.extrudeField])
        if (min >= num) {
          min = num
        }
        if (max < num) {
          max = num
        }
      }
      if (max - min === 0)
        height = minH
      else
        height = minH + parseInt((value - min) / (max - min) * (maxH - minH))
    }
    return height
  },
  /**
   * 根据几何拉伸字段值，计算几何颜色深浅
   * @memberof ExtrudeLayer
   * @method getColorByValue
   * @param {Array} graphics 需要拉伸的所有底面几何
   * @param {Number} value 拉伸高度字段
   * @returns 计算后的颜色rgb
   * @example
   * 示例
   * const graphics = [{attributes:{},geometry:{}}];
   * const value = 500;
   * ExtrudeLayer.getColorByValue(graphics, value);
   */
  getColorByValue(graphics, value) {
    let color = 'rgb(' + this.rgbArray[0] + ',' + this.rgbArray[1] + ',' + this.rgbArray[2] + ')'
    let _self = this
    let valueArray = []
    if (this.extrudeField) {
      for (let k = 0; k < graphics.length; k++) {
        valueArray.push(graphics[k].attributes[this.extrudeField])
      }
      valueArray.sort(function(a, b) {
        return a - b
      })
      for (let l = 0; l < valueArray.length; l++) {
        let num = valueArray[l]
        if (num === value) {
          let rgbArr = _self.hsvToRgb([_self.HsvColor[0], (l + 1) * (1 / valueArray.length * 100), 100])
          color = 'rgb(' + rgbArr[0] + ',' + rgbArr[1] + ',' + rgbArr[2] + ')'
          break
        }
      }
    }
    return color
  },
  /**
   * rgb颜色转hsv
   * @memberof ExtrudeLayer
   * @method rgbToHsv
   * @returns 计算后的颜色hsv颜色数组
   * @example
   * 示例
   * const arr = [255,0,0];
   * ExtrudeLayer.rgbToHsv(graphics, value);
   */
  rgbToHsv() {
    let arr = this.rgbArray.concat()
    let h = 0, s = 0, v = 0
    let r = arr[0], g = arr[1], b = arr[2]
    arr.sort(function(a, b) {
      return a - b
    })
    let max = arr[2]
    let min = arr[0]
    v = max / 255
    if (max === 0) {
      s = 0
    } else {
      s = 1 - (min / max)
    }
    if (max === min) {
      h = 0
    } else if (max === r && g >= b) {
      h = 60 * ((g - b) / (max - min)) + 0
    } else if (max === r && g < b) {
      h = 60 * ((g - b) / (max - min)) + 360
    } else if (max === g) {
      h = 60 * ((b - r) / (max - min)) + 120
    } else if (max === b) {
      h = 60 * ((r - g) / (max - min)) + 240
    }
    h = parseInt(h)
    s = parseInt(s * 100)
    v = parseInt(v * 100)
    return [h, s, v]
  },
  /**
   * hsv颜色转rgb
   * @memberof ExtrudeLayer
   * @method hsvToRgb
   * @param {Array} arr hsv颜色数组
   * @returns 计算后的颜色rgb颜色数组
   * @example
   * 示例
   * const arr = [80,100,20];
   * ExtrudeLayer.hsvToRgb(graphics, value);
   */
  hsvToRgb(arr) {
    let h = arr[0], s = arr[1], v = arr[2]
    s = s / 100
    v = v / 100
    let r = 0, g = 0, b = 0
    let i = parseInt((h / 60) % 6)
    let f = h / 60 - i
    let p = v * (1 - s)
    let q = v * (1 - f * s)
    let t = v * (1 - (1 - f) * s)
    switch (i) {
      case 0:
        r = v
        g = t
        b = p
        break
      case 1:
        r = q
        g = v
        b = p
        break
      case 2:
        r = p
        g = v
        b = t
        break
      case 3:
        r = p
        g = q
        b = v
        break
      case 4:
        r = t
        g = p
        b = v
        break
      case 5:
        r = v
        g = p
        b = q
        break
      default:
        break
    }
    r = parseInt(r * 255.0)
    g = parseInt(g * 255.0)
    b = parseInt(b * 255.0)
    return [r, g, b]
  }
}
export default ExtrudeLayer
