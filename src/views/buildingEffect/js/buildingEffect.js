
/**
 * @class
 * @anthor 蒋雪雪（email: jiangxx@geoscene.cn）
 * @param options {Object} 参数集
 * @param options.view {Object} new SceneView的对象
 * @param options.QueryTask {Object} new QueryTask的对象
 * @param options.Query {Object} new Query的对象
 * @param options.queryUrl {String} 建筑底面要素服务地址
 * @param options.height {Number} 拉伸高度
 * @param options.texture0 {Object} 动态纹理图片
 * @param options.texture1 {Object} 渐变纹理图片
 */

import * as THREE from "three";
let BuildingEffect = {
  constructor(options) {
    this.opts = {
      QueryTask: null,
      Query: null,
    }
    this.opts.QueryTask = options.QueryTask;
    this.opts.Query = options.Query;
    this.webgl = options.webgl;
    this.view = options.view;
    this.queryUrl = options.queryUrl || null;
    this.height = options.height || null;
    this.texture0 = options.texture0;
    this.texture1 = options.texture1;
    this.texture = null;
    this.offset = 0;
    this._uniforms = null;
    this.mixer = null;
    this.clock = null;
    this._camera = null;
  },
  /**
   * 渲染器初始化
   * @memberof BuildingEffect
   * @method setup
   */
  initialize() {
    this.mixer = new THREE.AnimationMixer();
    this.clock = new THREE.Clock();
    this.mixer = THREE.AnimationMixer;

    this.renderer = new THREE.WebGLRenderer({
      context: this.gl, // 可用于将渲染器附加到已有的渲染环境中
      premultipliedAlpha: false, // renderer是否假设颜色有 premultiplied alpha. 默认为true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio); // 设置设备像素比。通常用于避免HiDPI设备上绘图模糊
    this.renderer.setViewport(0, 0, this.view.width, this.view.height); // 视口大小设置

    this.renderer.autoClear = false;
    this.renderer.autoClearDepth = false;
    this.renderer.autoClearColor = false;
    // this.renderer.autoClearStencil = false;

    let originalSetRenderTarget = this.renderer.setRenderTarget.bind(this.renderer);
    this.renderer.setRenderTarget = function (target) {
      originalSetRenderTarget(target);
      if (target == null) {
        this.bindRenderTarget();
      }
    };

    this.scene = new THREE.Scene();
    // setup the camera
    let cam = this.camera;
    this._camera = new THREE.PerspectiveCamera(cam.fovY, cam.aspect, cam.near, cam.far);

    // 添加坐标轴辅助工具
    const axesHelper = new THREE.AxesHelper(1);
    axesHelper.position.copy(1000000, 100000, 100000);
    this.scene.add(axesHelper);

    let grid = new THREE.GridHelper(30, 10, 0xf0f0f0, 0xffffff);
    this.scene.add(grid);

    // setup scene lighting
    this.ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambient);
    this.sun = new THREE.DirectionalLight(0xffffff, 0.5);
    this.sun.position.set(-600, 300, 60000);
    this.scene.add(this.sun);
    //建筑高亮
    this._uniforms = {
      time: { value: 0.0 },
      colorTexture: { value: new THREE.TextureLoader().load(this.texture0) },
      colorTexture1: { value: new THREE.TextureLoader().load(this.texture1) },
    };

    this.getCoords();
    this.resetWebGLState();
  },
  /**
   * 渲染器更新渲染
   * @memberof BuildingEffect
   * @method render
   */
  render() {
    let cam = this.camera;
    //需要调整相机的视角
    this._camera.position.set(cam.eye[0], cam.eye[1], cam.eye[2]);
    this._camera.up.set(cam.up[0], cam.up[1], cam.up[2]);
    this._camera.lookAt(new THREE.Vector3(cam.center[0], cam.center[1], cam.center[2]));
    // Projection matrix can be copied directly
    this._camera.projectionMatrix.fromArray(cam.projectionMatrix);
    // update lighting
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // view.environment.lighting.date = Date.now();
    let l = this.sunLight;
    this.sun.position.set(
      l.direction[0],
      l.direction[1],
      l.direction[2]
    );
    this.sun.intensity = l.diffuse.intensity;
    this.sun.color = new THREE.Color(l.diffuse.color[0], l.diffuse.color[1], l.diffuse.color[2]);
    this.ambient.intensity = l.ambient.intensity;
    this.ambient.color = new THREE.Color(l.ambient.color[0], l.ambient.color[1], l.ambient.color[2]);

    // 更新
    if (this._uniforms) {
      this._uniforms.time.value += 0.01;
    }

    // draw the scene
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // this.renderer.resetGLState();
    this.renderer.state.reset();
    this.bindRenderTarget();
    this.renderer.render(this.scene, this._camera);
    // as we want to smoothly animate the ISS movement, immediately request a re-render
    this.requestRender();
    // cleanup
    this.resetWebGLState();
  },
  /**
   * 获取底面几何坐标
   * @memberof BuildingEffect
   * @method getCoords
   */
  getCoords() {
    // let queryTask = new this.opts.QueryTask({
    //     url: this.queryUrl
    // });
    let query = new this.opts.Query();
    query.returnGeometry = true;
    query.outFields = ["*"];
    query.where = "1=1";
    let that = this;
    this.opts.QueryTask.executeQueryJSON(this.queryUrl, query).then(function (results) {
      // queryTask.execute(query).then(function (results) {
      for (let k = 0; k < results.features.length; k++) {
        let rings = results.features[k].geometry.rings[0];//默认一个环
        let coordsArray = new Array(rings.length * 3);
        let begin = new Array(rings.length * 3);
        for (let i = 0; i < rings.length; i++) {
          begin[i * 3] = rings[i][0];
          begin[i * 3 + 1] = rings[i][1];
          begin[i * 3 + 2] = 100;
        }
        that.webgl.toRenderCoordinates(that.view, begin, 0, that.view.spatialReference, coordsArray, 0, rings.length);

        //创建拉伸建筑
        that.createGeometry(coordsArray);

        //高亮围墙
        that.createLightGeometry(coordsArray);
      }
    });
  },
  /**
   * 创建拉伸几何
   * @memberof BuildingEffect
   * @method createGeometry
   * @param {Array} coordsArray 底面渲染坐标数组
   * @example
   * 示例
   * const coordsArray = [13546596.67, 3640096.83, 300，13546596.67, 3640096.83, 300，13546596.67, 3640096.83, 300];
   * BuildingEffect.createGeometry(coordsArray);
   */
  createGeometry(coordsArray) {
    const shape = new THREE.Shape();//底面几何
    for (let j = 0; j < coordsArray.length; j = j + 3) {
      let x = coordsArray[j];
      let y = coordsArray[j + 1];
      if (j === 0) {
        shape.moveTo(x, y);
      }
      shape.lineTo(x, y);
    }
    const extrudeSettings = {
      depth: this.height,
      bevelEnabled: false
    };
    let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    let material = new THREE.MeshPhongMaterial({ color: new THREE.Color('#4d4aea'), transparent: true, opacity: 0.7 });
    let mesh = new THREE.Mesh(geometry, material.clone())
    this.scene.add(mesh);
  },
  /**
   * 创建高亮围墙
   * @memberof BuildingEffect
   * @param {Array} coordsArray 底面渲染坐标数组
   * @method createLightGeometry
   * @example
   * 示例
   * const coordsArray = [13546596.67, 3640096.83, 300，13546596.67, 3640096.83, 300，13546596.67, 3640096.83, 300];
   * BuildingEffect.createGeometry(coordsArray);
   */
  createLightGeometry(coordsArray) {
    let points = [];
    for (let j = 0; j < coordsArray.length; j = j + 3) {
      let x = coordsArray[j];
      let y = coordsArray[j + 1];
      // let z = coordsArray[j + 2];
      points.push([x, y])
    }
    // 计算顶点
    let transform = new THREE.Matrix4(); // 变换矩阵
    const num = points.length;
    let transformation = new Array(4 * num);
    let vector3List = []; // 顶点数组
    let faceList = []; // 三角面数组
    let faceVertexUvs = []; // 面的 UV 层的队列，该队列用于将纹理和几何信息进行映射
    // 转换顶点坐标
    points.forEach((point) => {
      transform.fromArray(
        this.webgl.renderCoordinateTransformAt(
          this.view,
          [point[0], point[1], 0], // 坐标在地面上的点[x值, y值, 高度值]
          this.view.spatialReference,
          transformation
        )
      );
      vector3List.push(transform.elements[12], transform.elements[13], transform.elements[14]);
      // 再转换距离地面高度为height的点
      transform.fromArray(
        this.webgl.renderCoordinateTransformAt(
          this.view,
          [point[0], point[1], this.height], // 坐标在空中的点[x值, y值, 高度值]
          this.view.spatialReference,
          transformation
        )
      );
      vector3List.push(transform.elements[12], transform.elements[13], transform.elements[14]);
    });
    // 纹理坐标
    const uvMap = {
      0: [0, 0],
      1: [0, 1],
      2: [1, 0],
      3: [1, 1],
    }
    // 生成几何体三角面
    let ve=vector3List.length/3 - 2
    for (let i = 0; i < ve; i++) {
      if (i % 2 === 0) {
        faceList.push(i, i + 2, i + 1);
      } else {
        faceList.push(i, i + 1, i + 2);
      }
      faceVertexUvs.push(...uvMap[i % 4]);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(vector3List), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(faceList), 1));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(faceVertexUvs), 2));
    let mesh = new THREE.Mesh(geometry, this.getMaterial());
    this.scene.add(mesh);
  },
  /**
   * 构建渲染材质
   * @memberof BuildingEffect
   * @method getMaterial
   */
  getMaterial() {
    let shader = this.getShaderStr();
    let material = new THREE.ShaderMaterial({
      uniforms: this._uniforms,
      vertexShader: shader.vs,
      fragmentShader: shader.fs,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    return material;
  },
  /**
   * 构建渲染Shader
   * @memberof BuildingEffect
   * @method getShaderStr
   */
  getShaderStr() {
    let shader = { vs: '', fs: '' };

    shader.vs = `
        varying vec2 vUv;\n
        varying vec3 fNormal;\n
        varying vec3 vPosition;\n
        void main()\n
        {\n
            vUv = uv;\n
            fNormal=normal;\n
            vPosition=position;\n
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n
            gl_Position = projectionMatrix * mvPosition;\n
        }\n`;

    shader.fs = `
         uniform float time;\n
         varying vec2 vUv;\n
         uniform sampler2D colorTexture;\n
         uniform sampler2D colorTexture1;\n
         varying vec3 fNormal;\n
         varying vec3 vPosition;\n
         void main( void ) {\n
             vec2 position = vUv;\n
             vec3 tempNomal= normalize(fNormal);\n
             float power=step(0.95,abs(tempNomal.y));\n
             vec4 colorb=texture2D(colorTexture1,position.xy);\n
             vec4 colora = texture2D(colorTexture,vec2(vUv.x,fract(vUv.y-time))); \n
             if(power>0.95){\n
                 gl_FragColor =colorb;\n
             }else{\n
                 gl_FragColor =colorb+colorb*colora;\n
             }\n
         }\n`;
    return shader;
  },
}
export default BuildingEffect;
