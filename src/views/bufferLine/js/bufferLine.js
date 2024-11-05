import * as THREE from 'three'

/**
 * @class
 * @anthor 蒋雪雪（email: jiangxx@geoscene.cn）
 * @param options {Object} 参数集
 * @param options.view {Object} new SceneView的对象
 * @param options.QueryTask {Object} new QueryTask的对象
 * @param options.Query {Object} new Query的对象
 * @param options.queryUrl {String} 建筑底面要素服务地址
 * @param options.width {Number} 线宽
 * @param options.MeshLine {Object} threejs-meshline 类
 * @param options.MeshLineMaterial {Object} threejs-MeshLineMaterial 类
 */
let bufferLine = {

  constructor(options) {
    this.opts = {
      // QueryTask: null,
      query: null,
      Query: null,
      MeshLine: null,
      MeshLineMaterial: null,
      raycast: null,
      webgl: null
    }
    // this.opts.QueryTask = options.QueryTask;
    this.opts.QueryTask = options.query
    this.opts.Query = options.Query
    this.opts.MeshLine = options.MeshLine
    this.opts.MeshLineMaterial = options.MeshLineMaterial
    this.opts.raycast = options.raycast
    this.opts.webgl = options.webgl
    this.view = options.view
    this.queryUrl = options.queryUrl || null
    this.width = options.width || 2000
    this.texture = options.texture
    this._camera = null
  },


  /**
   * 渲染器初始化
   * @memberof bufferLine
   * @method setup
   */
  initialize() {
    let THREE = window.THREE

    this.renderer = new THREE.WebGLRenderer({
      context: this.gl, // 可用于将渲染器附加到已有的渲染环境(RenderingContext)中
      premultipliedAlpha: false // renderer是否假设颜色有 premultiplied alpha. 默认为true
    })
    this.renderer.setPixelRatio(window.devicePixelRatio) // 设置设备像素比。通常用于避免HiDPI设备上绘图模糊
    this.renderer.setViewport(0, 0, this.view.width, this.view.height) // 视口大小设置

    this.renderer.autoClear = false
    this.renderer.autoClearDepth = false
    this.renderer.autoClearColor = false
    // this.renderer.autoClearStencil = false;

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
    this.getCoords()
    this.resetWebGLState()
  },

  /**
   * 渲染器更新渲染
   * @memberof bufferLine
   * @method render
   */
  render() {
    let THREE = window.THREE

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

    // cleanup
    this.resetWebGLState()
  },

  /**
   * 获取底面几何坐标
   * @memberof BufferLine
   * @method getCoords
   */
  getCoords() {
    let THREE = window.THREE

    let query = new this.opts.Query()
    query.returnGeometry = true
    query.outFields = ['*']
    query.where = '1=1'
    query.num = 5
    let that = this
    this.opts.QueryTask.executeQueryJSON(this.queryUrl, query).then(function(results) {
      // queryTask.execute(query).then(function (results) {
      for (let k = 0; k < results.features.length; k++) {
        let rings = results.features[k].geometry.rings[0]//默认一个环
        let coordsArray = new Array(rings.length * 3)
        let begin = new Array(rings.length * 3)
        for (let i = 0; i < rings.length; i++) {
          begin[i * 3] = rings[i][0]
          begin[i * 3 + 1] = rings[i][1]
          begin[i * 3 + 2] = 300
        }
        that.opts.webgl.toRenderCoordinates(that.view, begin, 0, that.view.spatialReference, coordsArray, 0, rings.length)
        //创建缓冲区线
        that.createBufferGeo(begin)

      }
    })
  },


  /**
   * 创建缓冲几何
   * @memberof BufferLine
   * @method createBufferGeo
   * @param {Array} coordsArray 底面渲染坐标数组
   * @example
   * 示例
   * const coordsArray = [13546596.67, 3640096.83, 300，13546596.67, 3640096.83, 300，13546596.67, 3640096.83, 300];
   * BufferLine.createGeometry(coordsArray);
   */
  createBufferGeo(coordsArray) {
    let THREE = window.THREE

    let buffPoints = []
    for (let k = 0; k < coordsArray.length; k = k + 3) {
      let x = coordsArray[k]
      let y = coordsArray[k + 1]
      let z = coordsArray[k + 2]
      buffPoints.push({ x, y, z })
    }
    // 计算顶点
    let transform = new THREE.Matrix4() // 变换矩阵
    let transformation = new Array(16)

    let vector3List = [] // 顶点数组
    // 转换顶点坐标
    buffPoints.forEach((point) => {
      transform.fromArray(
        this.webgl.renderCoordinateTransformAt(
          this.view,
          [point.x, point.y, point.z], // 坐标在地面上的点[x值, y值, 高度值]
          this.view.spatialReference,
          transformation
        )
      )
      vector3List.push(transform.elements[12], transform.elements[13], transform.elements[14])

    })


    let line = new this.opts.MeshLine()
    line.setPoints(vector3List)

    let texture = new THREE.TextureLoader().load(
      this.texture
    )
    // texture.wrapS;
    // texture.wrapT;
    texture.repeat.set(8, 8) //贴图x,y平铺数量
    let materialline = new this.opts.MeshLineMaterial({
      lineWidth: this.width * 2,
      opacity: 1,
      transparent: true,
      map: texture,
      useMap: 1.0,
      depthWrite: false,
      depthTest: false,
      alphaTest: false
    })


    let meshline = new THREE.Mesh(line, materialline)
    meshline.raycast = this.opts.raycast
    this.scene.add(meshline)
  }
}

export default bufferLine
