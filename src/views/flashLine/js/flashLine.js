/**
 * @class
 * @anthor 蒋雪雪（email: jiangxx@geoscene.cn）
 * @param options {Object} 参数集
 * @param options.view {Object} new SceneView的对象
 * @param options.QueryTask {Object} new QueryTask的对象
 * @param options.Query {Object} new Query的对象
 * @param options.queryUrl {String} 线条要素服务地址
 * @param options.parColor {String} 线的颜色rgb颜色值
 * @param options.parLength {Number} 长度比例 <1
 * @param options.parSpeed {Number}  粒子运动速度 <1
 * @param options.parSize {Number}  宽度或大小
 * @param options.isShow {Bool}  是否显示线条
 */
import * as THREE from "three";
import * as webMercatorUtils from "@geoscene/core/geometry/support/webMercatorUtils";
let FlashLine ={
	constructor(options) {
		this.opts = {
			QueryTask: null,
			Query: null,
		};
		this.opts.elevationSampler = options.elevationSampler;
		this.opts.QueryTask = options.QueryTask;
		this.opts.Query = options.Query;
		this.view = options.view;
		this.queryUrl = options.queryUrl || "";
		this.parColor = options.color || [255, 255, 255];
		this.parLength = options.length || 0.3;
		this.parSpeed = options.speed || 0.5;
		this.parSize = options.size || 4;
		this.isShow = options.isShow || true;

		this.commonUniforms = {
			time: {
				value: 0,
			},
			number: {
				value: 1,
			},
			speed: {
				value: this.parSpeed,
			},
			length: {
				value: this.parLength,
			},
			size: {
				value: this.parSize,
			},
			isshow: {
				value: this.isShow,
			},
		};
		this.groupDots = null;
		this.groupLines = null;
		this.groupAnimDots = null;
		this._camera = null
		this.webgl = options.webgl
	},
	/**
	 * 渲染器初始化
	 * @memberof ODLine
	 * @method setup
	 */
	initialize() {
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

		//创建粒子用到
		this.groupDots = new THREE.Group();
		this.groupLines = new THREE.Group();
		this.groupAnimDots = new THREE.Group();
		this.scene.add(this.groupDots, this.groupLines, this.groupAnimDots);
		this.getCoords();
		this.resetWebGLState();
	},
	/**
	 * 渲染器更新渲染
	 * @memberof ODLine
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
		this.sun.position.set(l.direction[0], l.direction[1], l.direction[2]);
		this.sun.intensity = l.diffuse.intensity;
		this.sun.color = new THREE.Color(l.diffuse.color[0], l.diffuse.color[1], l.diffuse.color[2]);
		this.ambient.intensity = l.ambient.intensity;
		this.ambient.color = new THREE.Color(
			l.ambient.color[0],
			l.ambient.color[1],
			l.ambient.color[2]
		);
		// 更新
		this.commonUniforms.time.value += 0.01;

		// draw the scene
		/////////////////////////////////////////////////////////////////////////////////////////////////////
		// this.renderer.resetGLState();
		this.renderer.state.reset();
		this.bindRenderTarget();
		this.renderer.render(this.scene, this._camera);
		// as we want to smoothly animate the ISS movement, immediately request a re-render
		this.requestRender(this.view);
		// cleanup
		this.resetWebGLState();
	},
	/**
	 * 获取底面几何坐标
	 * @memberof ODLine
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
			console.log("==============results", results);
			for (let k = 0; k < results.features.length; k++) {
				const polyline = that.opts.elevationSampler.queryElevation(results.features[k].geometry);
				const tranformedPolyline = webMercatorUtils.geographicToWebMercator(polyline);
				let paths = tranformedPolyline.paths[0];
				//将点转成成对坐标点
				let linePointsArray = [];
				for (let i = 0; i < paths.length - 1; i++) {
					linePointsArray.push([paths[i], paths[i + 1]]);
				}
				that.addPathPoints(linePointsArray);
			}
		});
	},
	/**
	 * 创建缓冲几何
	 * @memberof ODLine
	 * @method addPathPoints
	 * @param {Array} linePoints 线坐标对
	 * @example
	 * 示例
	 * const linePoints = [[[13546596.67, 3640096.83, 300，13546596.67], [3640096.83, 300，13546596.67, 3640096.83, 300]]];
	 * ODLine.addPathPoints(linePoints);
	 */
	addPathPoints(linePoints) {
		let initnum = 3000;
		var totalLen = 0;
		var totalPaths = [];
		//计算线段总长度
		for (let k = 0; k < linePoints.length; k++) {
			let startPoint = new Array(3);
			let endPoint = new Array(3);
			// TODO: 高度
			this.webgl.toRenderCoordinates(
				this.view,
				[linePoints[k][0][0], linePoints[k][0][1], linePoints[k][0][2]],
				0,
				this.view.spatialReference,
				startPoint,
				0,
				1
			);
			this.webgl.toRenderCoordinates(
				this.view,
				[linePoints[k][1][0], linePoints[k][1][1], linePoints[k][1][2]],
				0,
				this.view.spatialReference,
				endPoint,
				0,
				1
			);
			let startPos = new THREE.Vector3(startPoint[0], startPoint[1], startPoint[2]);
			let endPos = new THREE.Vector3(endPoint[0], endPoint[1], endPoint[2]);
			totalLen = totalLen + endPos.clone().sub(startPos).length();
		}
		for (let i = 0; i < linePoints.length; i++) {
			let point1 = linePoints[i][0];
			let point2 = linePoints[i][1];
			let xyz1 = new Array(3);
			let xyz2 = new Array(3);
			// TODO: 高度
			this.webgl.toRenderCoordinates(
				this.view,
				[point1[0], point1[1], point1[2]],
				0,
				this.view.spatialReference,
				xyz1,
				0,
				1
			);
			this.webgl.toRenderCoordinates(
				this.view,
				[point2[0], point2[1], point2[2]],
				0,
				this.view.spatialReference,
				xyz2,
				0,
				1
			);

			let vec0 = new THREE.Vector3(xyz1[0], xyz1[1], xyz1[2]);
			let vec3 = new THREE.Vector3(xyz2[0], xyz2[1], xyz2[2]);
			//根据线段长度计算，每段取点数量
			let dir = vec3.clone().sub(vec0);
			let len = dir.length();
			let num = parseInt((len / totalLen) * initnum) + 1;
			totalPaths = totalPaths.concat(this.getLinePoints(vec0, vec3, num));
		}
		let geometry = new THREE.BufferGeometry().setFromPoints(totalPaths);
		let length = totalPaths.length;
		let percents = new Float32Array(length);
		for (let i = 0; i < length; i += 1) {
			percents[i] = i / length;
		}
		geometry.setAttribute("percent", new THREE.BufferAttribute(percents, 1));

		let material = this.createLineMaterial();
		let flyLine = new THREE.Points(geometry, material);
		this.groupLines.add(flyLine);
	},
	/**
	 * 取首尾两点连线之间的部分点
	 * @memberof ODLine
	 * @method getLinePoints
	 * @param {Vector3} v0 起点
	 * @param {Vector3} v3 终点
	 * @param {Number} num 取点数量
	 * @example
	 * 示例
	 * const v0 = new THREE.Vector3(1000,500,100);
	 * const v3 = new THREE.Vector3(100,300,400);
	 * const num=100;
	 * ODLine.getLinePoints(v0, v3, num);
	 */
	getLinePoints(v0, v3, num) {
		//根据两点坐标，计算取两点连线上的坐标点
		let paths = [];
		for (let k = 0; k < num; k++) {
			let dir = v3.clone().sub(v0);
			let len = dir.length();
			dir = dir.normalize().multiplyScalar((len * k) / num);
			let newVec = v0.clone().add(dir);
			paths.push(new THREE.Vector3(newVec.x, newVec.y, newVec.z));
		}
		return paths;
	},
	/**
	 * 获取材质
	 * @memberof ODLine
	 * @method createLineMaterial
	 */
	createLineMaterial(color) {
		let uniforms = {
			time: this.commonUniforms.time,
			number: this.commonUniforms.number,
			speed: this.commonUniforms.speed,
			length: this.commonUniforms.length,
			size: this.commonUniforms.size,
			color: {
				value: new THREE.Color(this.parColor),
			},
			isshow: this.commonUniforms.isshow,
		};
		let shader = this.getShaderStr();
		let material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: shader.vs,
			fragmentShader: shader.fs,
			transparent: false, // TODO
			depthWrite: false,
			depthTest: false,
			alphaTest: false,
		});

		return material;
	},
	/**
	 * 获取ShaderStr
	 * @memberof ODLine
	 * @method getShaderStr
	 */
	getShaderStr() {
		let shader = {};
		let vertexShader = `
        attribute float percent;
        uniform float time;
        uniform float number;
        uniform float speed;
        uniform float length;
        varying float opacity;
        uniform float size;
        void main()
        {
          float l = clamp(1.0-length, 0.0, 1.0);
          gl_PointSize = clamp(fract(percent*number + l - time*number*speed)-l, 0.0, 1.) * size * (1./length);
          opacity = gl_PointSize/size;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `;
		let fragmentShader = `
        varying float opacity;
        uniform vec3 color;
        uniform bool isshow;
        void main(){
            if (opacity <=0.1){
              if(isshow){
                gl_FragColor = vec4(color, 0.1);
              }else{
                discard;
              }
            }else{
              gl_FragColor = vec4(color, 1.0);
            }
        }
        `;
		shader.vs = vertexShader;
		shader.fs = fragmentShader;
		return shader;
	}
}
export default FlashLine;
