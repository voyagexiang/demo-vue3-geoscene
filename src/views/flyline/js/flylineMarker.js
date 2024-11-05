
/**
 * @class
 * @anthor jason
 * @param options {Object} 参数集
 * @param options.view {Object} new SceneView的对象
 * @param options.QueryTask {Object} new QueryTask的对象
 * @param options.Query {Object} new Query的对象
 * @param options.externalRenderers {Object} new externalRenderers的对象
 * @param options.queryUrl {String} 建筑底面要素服务地址
 * @param options.height {Number} 拉伸高度
 * @param options.texture0 {Object} 动态纹理图片
 * @param options.texture1 {Object} 渐变纹理图片
 */

import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import * as webMercatorUtils from "@geoscene/core/geometry/support/webMercatorUtils.js";
let FlylineMarker = {
  constructor(options) {
    this.webgl = options.webgl;
    this.view = options.view;
    this.size = options.size || null;
    this.height = options.height || null;
    this.minHeight = options.minHeight || null;
    this.maxHeight = options.maxHeight || null;
    this.positionConfig = options.positionConfig || [];
    this.speed = options.speed || 10;
    this.lineWidth = options.lineWidth || 100;
    this.container = options.container || null;
    this.cones = [];
    this._uniforms = null;
    this.lineUniforms = null;
    this.mixer = null;
    this.clock = null;
    this._camera = null;
  },
  /**
   * 渲染器初始化
   * @memberof BuildingEffect
   * @method setup
   * @param {Object} context 已有渲染器信息，无需传值
   */
  initialize() {
    this.mixer = new THREE.AnimationMixer();
    this.clock = new THREE.Clock();
    this.mixer = THREE.AnimationMixer;

    this.renderer = new THREE.WebGLRenderer({
      context: this.gl, // 可用于将渲染器附加到已有的渲染环境(RenderingContext)中
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

    // CSS2D renderer
    let labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    //不妨碍界面上点击冲突
    labelRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(labelRenderer.domElement);
    this.labelRenderer = labelRenderer;

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
      //随时间变化
      uTime: { value: 0 },
      //高度
      uHeight: { value: this.height },
      //颜色
      uColor: { value: new THREE.Color(this.color) }
    };

    this.lineUniforms = {
      //随时间变化
      uTime: { value: 0.0 },
      //飞线长度
      uLen: { value: 0.6 },
      //飞线宽度
      uSize: { value: this.lineWidth },
      //飞线颜色
      uColor: { value: new THREE.Color(this.color) }
    }
    for(let i = 0; i < this.positionConfig.length; i++) {
      const { longitude, latitude, color, textColor, text } = this.positionConfig[i] || {};
      this.createMountainGeometry(color, longitude, latitude);
      this.createPyramidGeometry(color, longitude, latitude);
      this.addALabel(color, textColor, text, longitude, latitude);
      if (i > 0) {
        this.createFlyLine(this.positionConfig[i-1], this.positionConfig[i]);
      }
    }
    this.resetWebGLState();
  },
  /**
   * 渲染器更新渲染
   * @memberof BuildingEffect
   * @method render
   * @param {Object} context 已有渲染器信息，无需传值
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
    if (this._uniforms && this._uniforms.uTime.value < 1) {
      console.log('============this._uniforms.uTime.value', )
      this._uniforms.uTime.value += 0.05;
    }

    // 设置垂直高度坐标，让四棱锥上下浮动：遇到最大或最小高度时改变速度speed方向
    if (this.cones.length) {
      this.cones.forEach((c) => {
        //高低浮动
        if (c.obj.position.z >= this.maxHeight) {//最大高度
          c.step = -this.speed;
        } else if (c.obj.position.z <= this.minHeight) {//最小高度
          c.step = this.speed;
        }

        c.obj.position.z += c.step;
      });
    }

    // 飞线
    if (this.lineUniforms) {
      this.lineUniforms.uTime.value += 0.02;
    }

    // draw the scene
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // this.renderer.resetGLState();
    this.renderer.state.reset();
    this.bindRenderTarget();
    this.renderer.render(this.scene, this._camera);
    this.labelRenderer.render(this.scene, this._camera);
    // as we want to smoothly animate the ISS movement, immediately request a re-render
    this.requestRender();
    // cleanup
    this.resetWebGLState();
  },
  /**
   * 创建高山marker
   * @memberof BuildingEffect
   * @param {Array} coordsArray 底面渲染坐标数组
   * @method createLightGeometry
   * @example
   * 示例
   * const coordsArray = [13546596.67, 3640096.83, 300，13546596.67, 3640096.83, 300，13546596.67, 3640096.83, 300];
   * BuildingEffect.createGeometry(coordsArray);
   */
  createMountainGeometry(color, lon, lat) {
    const material = this.getMaterial(color);
    //平面形状，方便复用
    if (!this.ageometry) {
      //平面的面数一定要足够才能形成山峰
      const geometry = new THREE.PlaneGeometry(this.size, this.size, 500, 500);
      this.ageometry = geometry;
    }
    const plane = new THREE.Mesh(this.ageometry, material);
    //转换经纬度作为px
    const d = webMercatorUtils.lngLatToXY(lon, lat);
    plane.position.set(d[0], d[1], 0);
    this.scene.add(plane);
  },
  /**
   * 创建四棱锥marker
   * @memberof BuildingEffect
   * @param {Array} coordsArray 底面渲染坐标数组
   * @method createLightGeometry
   * @example
   * 示例
   * const coordsArray = [13546596.67, 3640096.83, 300，13546596.67, 3640096.83, 300，13546596.67, 3640096.83, 300];
   * BuildingEffect.createGeometry(coordsArray);
   */
  createPyramidGeometry(color, lon, lat) {
    //转换经纬度坐标
    const d = webMercatorUtils.lngLatToXY(lon, lat);
    const r = this.size * 0.1;
    //四棱锥图形，方便复用
    if (!this.cgeometry) {
      const geometry = new THREE.ConeGeometry(r, r * 2, 4, 1);
      this.cgeometry = geometry;
    }

    const material = new THREE.MeshLambertMaterial({ color: new THREE.Color(color) });
    //创建四棱锥网格
    const cone = new THREE.Mesh(this.cgeometry, material);
    //旋转90度，让四棱锥倒立
    cone.rotateX(-Math.PI * 0.5);
    //设置位置
    cone.position.set(d[0], d[1], this.size * 1.1);

    this.scene.add(cone);
    //收集四棱锥
    this.cones.push({ obj: cone, step: this.speed });
  },
  createFlyLine(start, end) {
    //经纬度坐标点统一转换
    const startPosition = webMercatorUtils.lngLatToXY(start.longitude, start.latitude);
    const endPosition = webMercatorUtils.lngLatToXY(end.longitude, end.latitude);
    const d = [startPosition, endPosition];
    //贝塞尔曲线形成弯曲
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(d[0][0], d[0][1], 0),
      //取中间点
      new THREE.Vector3((d[0][0] + d[1][0]) * 0.5, (d[0][1] + d[1][1]) * 0.5, this.height),
      new THREE.Vector3(d[1][0], d[1][1], 0)
    );
    console.log('=======curve', curve)
    const geometry = new THREE.TubeGeometry(curve, 32, 10, 8, false);
    const material = this.getFlyLineMaterial(start.color);

    const line = new THREE.Mesh(geometry, material);
    this.scene.add(line);
  },
  /**
   * 构建渲染材质
   * @memberof BuildingEffect
   * @method getMaterial
   */
  getMaterial(color) {
    let shader = this.getShaderStr();
    // let material = new THREE.ShaderMaterial({
    //   uniforms: this._uniforms,
    //   vertexShader: shader.vs,
    //   fragmentShader: shader.fs,
    //   blending: THREE.AdditiveBlending,
    //   transparent: true,
    //   depthTest: false,
    //   side: THREE.DoubleSide,
    // });
    const material = new THREE.ShaderMaterial({
      uniforms: { ...this._uniforms, uColor: { value: new THREE.Color(color) } },
      //开启透明度
      transparent: true,
      vertexShader: shader.vs,
      fragmentShader: shader.fs,
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
      precision mediump float;\n
      uniform float uTime;\n
      uniform float uHeight;\n
      varying float vD;\n
      float PI = acos(-1.0);\n
      vec2 center = vec2(0.5);\n
      void main(void) {\n
          //离中线的距离\n
          float d = length(uv - center) * 2.0;\n
          //沿中心点往外减少\n
          vD = pow(1.0 - d, 3.0);\n
          //山峰高度，随着uTime变化\n
          float h = vD * uHeight * uTime;\n
          vec3 pos = vec3(position.x * 0.5, position.y * 0.5, h); \n
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);\n
      }\n
      `;

    shader.fs = `
      precision mediump float;\n
      uniform vec3 uColor;\n
      varying float vD;\n
      void main(void) {\n
          if(vD < 0.01)//透明度太小则不渲染颜色\n
              discard;\n
          else//透明度随着距离中心点的变化\n
              gl_FragColor = vec4(uColor, vD * 2.0);\n
      }\n
    `;
    return shader;
  },
  /**
   * 构建渲染材质
   * @memberof BuildingEffect
   * @method getMaterial
   */
  getFlyLineMaterial(color) {
    let shader = this.getFlyLineShaderStr();
    const material = new THREE.ShaderMaterial({
      uniforms: { ...this.lineUniforms, uColor: { value: new THREE.Color(color) } },
      //开启透明度
      transparent: true,
      vertexShader: shader.vs,
      fragmentShader: shader.fs,
    });
    return material;
  },
  /**
   * 构建渲染Shader
   * @memberof BuildingEffect
   * @method getShaderStr
   */
  getFlyLineShaderStr() {
    let shader = { vs: '', fs: '' };

    shader.vs = `
      float PI = acos(-1.0);\n
      varying float vT;\n
      varying float vS;\n
      uniform float uTime;\n
      uniform float uSize;\n
      uniform float uLen;\n
      void main(void) {\n
          //取模循环\n
          float d = mod(uv.x - uTime, 1.0);\n
          //截取uLen长度\n
          vS = smoothstep(0.0, uLen, d);\n
          //不在范围内不渲染\n
          if(vS < 0.01 || d > uLen)\n
              return;\n
          //头大尾小的飞线坐标点\n
          vec3 pos = position + normal * sin(PI * 0.5 * (vS - 0.6)) * uSize;\n
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);\n
      }\n
      `;

    shader.fs = `
      varying float vS;\n
      uniform vec3 uColor;\n
      void main(void) {\n
      //透明度随着飞线头尾变小\n
          gl_FragColor = vec4(uColor, vS);\n
      }\n
    `;
    return shader;
  },
  addLabel(dom, pos) {
    //label的dom可以触发事件
    dom.style.pointerEvents = 'auto';
    const label = new CSS2DObject(dom);
    label.position.set(...pos);
    this.scene.add(label);
    return label;
  },
  addALabel(color, textColor, text, lon, lat) {
    const div = document.createElement('div');
    div.innerHTML = `<div class="tip-box" style="background:${textColor};--base-color:${color}"><span class="circle" ></span><span class="text">${text}</span></div>`;
    //坐标转换
    const d = webMercatorUtils.lngLatToXY(lon, lat);
    const label = this.addLabel(div, [d[0], d[1], this.size * 1.5]);
  },
}
export default FlylineMarker;
