/**
 * @class
 * @anthor 蒋雪雪（email: jiangxx@geoscene.cn）
 * @param options {Object} 参数集
 * @param options.externalRenderers {Object} externalRenderers类
 *  @param options.color_pyr {String} rgb颜色值
 @param options.width_pyr = {Number} 锥体标注宽度
 @param options.height_pyr = {Number} 锥体标注高度
 @param options.size_spr = {Array} 精灵图标xyz放大比例
 @param options.texture_pyr = {Object} 锥体贴图
 @param options.texture_spr = {Object} 精灵图标
 *
 */
class LabelPoint {
  constructor(options) {
    this.opts = {
      externalRenderers: null
    }
    this.opts.externalRenderers = options.externalRenderers
    this.view = options.view
    this.points = options.points || [[0, 0, 0, 1]]
    this.color = options.color_pyr || '#5588aa'
    this.width_pyr = options.width_pyr || 1000
    this.height_pyr = options.height_pyr || 1500
    this.size_spr = options.size_spr || [2000, 2000, 2000]
    this.texture_pyr = options.texture_pyr || null
    this.texture_spr = options.texture_spr || null
    this.renderObjects = []
    this.isUp = true
    this.distance = 0
  }

  /**
   * 渲染器初始化
   * @memberof LabelPoint
   * @method setup
   * @param {Object} context 已有渲染器信息，无需传值
   */
  setup(context) {
    const THREE = window.THREE
    this.renderer = new THREE.WebGLRenderer({
      context: context.gl, // 可用于将渲染器附加到已有的渲染环境(RenderingContext)中
      premultipliedAlpha: false // renderer是否假设颜色有 premultiplied alpha. 默认为true
    })
    this.renderer.setPixelRatio(window.devicePixelRatio) // 设置设备像素比。通常用于避免HiDPI设备上绘图模糊
    this.renderer.setViewport(0, 0, this.view.width, this.view.height) // 视口大小设置
    // this.renderer.setSize(context.camera.fullWidth, context.camera.fullHeight);

    // Make sure it does not clear anything before rendering
    this.renderer.autoClear = false
    this.renderer.autoClearDepth = false
    this.renderer.autoClearColor = false
    // this.renderer.autoClearStencil = false;

    // The ArcGIS JS API renders to custom offscreen buffers, and not to the default framebuffers.
    // We have to inject this bit of code into the three.js runtime in order for it to bind those
    // buffers instead of the default ones.
    let originalSetRenderTarget = this.renderer.setRenderTarget.bind(this.renderer)
    this.renderer.setRenderTarget = function(target) {
      originalSetRenderTarget(target)
      if (target == null) {
        context.bindRenderTarget()
      }
    }

    this.scene = new THREE.Scene()
    // setup the camera
    let cam = context.camera
    this.camera = new THREE.PerspectiveCamera(cam.fovY, cam.aspect, cam.near, cam.far)


    // 添加坐标轴辅助工具
    const axesHelper = new THREE.AxesHelper(1)
    axesHelper.position.copy(1000000, 100000, 100000)
    this.scene.add(axesHelper)

    // setup scene lighting
    this.ambient = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(this.ambient)
    this.sun = new THREE.DirectionalLight(0xffffff, 0.5)
    this.sun.position.set(-600, 300, 60000)
    this.scene.add(this.sun)

    this.getGeometry(context)
    context.resetWebGLState()
  }

  /**
   * 渲染器更新渲染
   * @memberof LabelPoint
   * @method render
   * @param {Object} context 已有渲染器信息，无需传值
   */
  render(context) {
    const THREE = window.THREE
    let cam = context.camera
    //需要调整相机的视角
    this.camera.position.set(cam.eye[0], cam.eye[1], cam.eye[2])
    this.camera.up.set(cam.up[0], cam.up[1], cam.up[2])
    this.camera.lookAt(new THREE.Vector3(cam.center[0], cam.center[1], cam.center[2]))
    // Projection matrix can be copied directly
    this.camera.projectionMatrix.fromArray(cam.projectionMatrix)
    // update lighting
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // view.environment.lighting.date = Date.now();
    let l = context.sunLight
    this.sun.position.set(l.direction[0], l.direction[1], l.direction[2])
    this.sun.intensity = l.diffuse.intensity
    this.sun.color = new THREE.Color(l.diffuse.color[0], l.diffuse.color[1], l.diffuse.color[2])
    this.ambient.intensity = l.ambient.intensity
    this.ambient.color = new THREE.Color(l.ambient.color[0], l.ambient.color[1], l.ambient.color[2])

    //动画效果
    if (this._uniforms) {
      this._uniforms.time.value = this._uniforms.time.value + 0.005
    }
    if (this.renderObjects) {
      for (let i = 0; i < this.renderObjects.length; i++) {
        let object3D = this.renderObjects[i]
        let vec = new THREE.Vector3(0, 0, 1)
        let vec2 = new THREE.Vector3(0, 0, -1)
        object3D.rotateOnAxis(vec, Math.PI / 300)
        if (this.isUp) {
          object3D.translateOnAxis(vec, 10)
          this.distance += 100
          if (this.distance > 3000) {
            this.isUp = false
          }
        } else {
          object3D.translateOnAxis(vec2, 10)
          this.distance -= 100
          if (this.distance < this.height_pyr / 2) {
            this.isUp = true
          }
        }
      }
    }

    // draw the scene
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    this.renderer.state.reset()
    this.renderer.render(this.scene, this.camera)
    // as we want to smoothly animate the ISS movement, immediately request a re-render
    this.opts.externalRenderers.requestRender(this.view)
    // cleanup
    context.resetWebGLState()
  }

  /**
   * 创建几何点
   * @memberof LabelPoint
   * @method getGeometry
   */
  getGeometry() {
    const THREE = window.THREE
    let _self = this
    this.points.forEach(function(position) {
      let cenP = []
      _self.opts.externalRenderers.toRenderCoordinates(_self.view, [position[0], position[1], position[2]], 0, _self.view.spatialReference, cenP, 0, 1)
      if (position[3] && position[3] === 1) {
        let geometry = new THREE.CylinderBufferGeometry(_self.width_pyr, 0, _self.height_pyr, 4)
        geometry.rotateX(Math.PI / 2)
        geometry.computeBoundingSphere()
        let object3D = new THREE.Object3D()
        let mesh = new THREE.Mesh(geometry, _self.getMaterial_pyr())
        object3D.add(mesh)
        object3D.position.set(cenP[0], cenP[1], cenP[2] + _self.height_pyr / 2)
        _self.scene.add(object3D)
        _self.renderObjects.push(object3D)
      } else if (position[3] && position[3] === 2) {
        let spriteMap = new THREE.TextureLoader().load(_self.texture_spr)
        let spriteMaterial = new THREE.SpriteMaterial({ map: spriteMap })
        let sprite = new THREE.Sprite(spriteMaterial)
        sprite.position.set(cenP[0], cenP[1], cenP[2] + _self.size_spr[2] / 2)
        sprite.scale.set(_self.size_spr[0], _self.size_spr[1], _self.size_spr[2])
        _self.scene.add(sprite)
      }
    })
  }

  /**
   * 构建渲染材质
   * @memberof LabelPoint
   * @method getMaterial_pyr
   */
  getMaterial_pyr() {
    const THREE = window.THREE
    this._uniforms = {
      dtPyramidTexture: {
        value: new THREE.TextureLoader().load(this.texture_pyr)
      }, time: {
        value: 0.0
      }, uColor: {
        value: new THREE.Color(this.color_pyr)
      }
    }
    let shader = this.getShaderStr_pyr()
    let material = new THREE.ShaderMaterial({
      uniforms: this._uniforms,
      vertexShader: shader.vs,
      fragmentShader: shader.fs,
      transparent: true,
      side: THREE.DoubleSide
    })
    return material
  }

  /**
   * 构建渲染Shader
   * @memberof LabelPoint
   * @method getShaderStr_pyr
   */
  getShaderStr_pyr() {
    const THREE = window.THREE
    let shader = { vs: '', fs: '' }

    shader.vs = 'varying vec2 vUv;\n' + 'void main(){\n' + 'vUv = uv;\n' + 'gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4( position, 1.0 );\n' + '}\n'

    shader.fs = 'uniform float time;\n' + 'varying vec2 vUv;\n' + 'uniform sampler2D dtPyramidTexture;\n' + 'uniform vec3 uColor;\n' + 'void main() {\n' + ' vec2 st = vUv;\n' + ' vec4 colorImage = texture2D(dtPyramidTexture, vec2(vUv.x,fract(vUv.y-time)));\n' + //'float alpha=mix(0.1,1.0,clamp((1.0-vUv.y) * uColor.a,0.0,1.0)) +(1.0-sign(vUv.y-time*0.001))*0.2*(1.0-colorImage.r);\n'+
      'vec3 diffuse =(1.0-colorImage.a)*vec3(0.8,1.0,0.0)+colorImage.rgb*vec3(0.8,1.0,0);\n' + 'gl_FragColor = vec4(diffuse,0.7);\n' + '}\n'
    return shader
  }
}

export default LabelPoint