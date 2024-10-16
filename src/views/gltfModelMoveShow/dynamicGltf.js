import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import gltfpath from '@/assets/datas/Flamingo.glb'
import horseGLTF from '@/assets/datas/Horse.glb'
import * as three from 'three'

class DynamicGLTFAPI {
  constructor(options) {
    this.opts = {
      externalRenderers: null
    }
    this.opts.externalRenderers = options.externalRenderers
    this.view = options.view
    this.mixer = null
    this.horseMixer = null
    this.clock = null
    this.horseClock = null
    this.gltfMesh = null
  }

  setParams() {
    this.isStop = !this.isStop
  }

  clearMesh() {
    this.scene.remove(this.gltfMesh.scene)
  }

  updatePosition() {
    // {
    // point,
    // height, // 设置的模型高度视觉变量的属性值
    // heading // 设置模型水平旋转视觉变量的属性值
    // angleCount
    // }

    let that = this
    return function(obj) {
      if (that.gltfMesh) {
        that.gltfMesh.scene.position.set(obj.carPoint.x, obj.carPoint.y, obj.height)

        if (obj.angleCount === 0) {
          that.gltfMesh.scene.rotation.y = obj.heading + Math.PI
        }

      }
    }

  }

  setup(context) {
    let THREE = three
    // this.mixer = new THREE.AnimationMixer();
    this.horseMixer = THREE.AnimationMixer
    this.clock = new THREE.Clock()
    this.horseClock = new THREE.Clock()
    this.mixer = THREE.AnimationMixer

    this.renderer = new THREE.WebGLRenderer({
      context: context.gl, // 可用于将渲染器附加到已有的渲染环境(RenderingContext)中
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

    let grid = new THREE.GridHelper(30, 10, 0xf0f0f0, 0xffffff)
    this.scene.add(grid)

    // setup scene lighting
    this.ambient = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(this.ambient)

    // const loader = new GLTFLoader().setPath('./');
    const loader = new GLTFLoader()
    let that = this
    // loader.load('Cesium_Man.glb', function (gltf) {
    loader.load(gltfpath, function(gltf) {
      console.log('gltf', gltf)
      that.gltfMesh = gltf
      gltf.scene.scale.set(10, 10, 10)
      that.scene.add(gltf.scene)
      gltf.scene.position.set(12948718.594467826, 4852521.989441685, 2500)
      gltf.scene.rotateX(Math.PI / 2)

      that.mixer = new THREE.AnimationMixer(gltf.scene)
      // obj.animations[0]：获得剪辑对象clip
      var AnimationAction = that.mixer.clipAction(gltf.animations[0])
      // AnimationAction.timeScale = 1; //默认1，可以调节播放速度
      // AnimationAction.loop = THREE.LoopOnce; //不循环播放
      // AnimationAction.clampWhenFinished = true;//暂停在最后一帧播放的状态
      AnimationAction.play()//播放动画
    })

    loader.load(horseGLTF, function(gltf) {
      console.log('gltf', gltf)
      gltf.scene.scale.set(5, 5, 5)
      that.scene.add(gltf.scene)
      gltf.scene.position.set(12948718.594467826, 4852521.989441685, 0)
      gltf.scene.rotateX(Math.PI / 2)

      that.horseMixer = new THREE.AnimationMixer(gltf.scene)
      // obj.animations[0]：获得剪辑对象clip
      var AnimationAction = that.horseMixer.clipAction(gltf.animations[0])
      // AnimationAction.timeScale = 1; //默认1，可以调节播放速度
      // AnimationAction.loop = THREE.LoopOnce; //不循环播放
      // AnimationAction.clampWhenFinished = true;//暂停在最后一帧播放的状态
      AnimationAction.play()//播放动画
    })


    // this.getCoords(context);
    context.resetWebGLState()
  }

  /**
   * 渲染器更新渲染
   * @memberof BuildingEffect
   * @method render
   * @param {Object} context 已有渲染器信息，无需传值
   */
  render(context) {
    let THREE = three
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


    if (this.mixer) {
      // 更新混合器相关的时间, clock.getDelta()方法获得两帧的时间间隔
      this.mixer.update(this.clock.getDelta())
    }

    if (this.horseMixer) {
      this.horseMixer.update(this.horseClock.getDelta())
    }

    // draw the scene
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // this.renderer.resetGLState();
    this.renderer.state.reset()

    this.renderer.render(this.scene, this.camera)
    // as we want to smoothly animate the ISS movement, immediately request a re-render
    this.opts.externalRenderers.requestRender(this.view)


    // cleanup
    context.resetWebGLState()
  }

}

export default DynamicGLTFAPI