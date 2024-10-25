/**
 * @class
 * @anthor 蒋雪雪（email: jiangxx@geoscene.cn）
 * @param options {Object} 参数集
 * @param options.externalRenderers {Object} externalRenderers类
 *  @param options.position {String} 柱体位置
 *  @param options.radius = {Number} 柱体半径
 *  @param options.scale = {Number} 扩散比例
 *  @param options.height = {Array} 柱体高度
 *  @param options.texture = {Object} 渐变贴图
 * 
 */
class CylinderLayer {
    constructor(options) {
        this.opts = {
            externalRenderers: null,
        }
        this.opts.externalRenderers = options.externalRenderers;
        this.view = options.view;
        this.position = options.position || [0, 0, 0];
        this.radius = options.radius || 7000;
        this.scale = options.scale || 2;
        this.height = options.height || 5000;
        this.texture = options.texture || null;
        this.renderObject = null;
    }
    /**
     * 渲染器初始化
     * @memberof CylinderLayer
     * @method setup
     * @param {Object} context 已有渲染器信息，无需传值
     */
    setup(context) {
        const THREE = window.THREE;
        this.renderer = new THREE.WebGLRenderer({
            context: context.gl, // 可用于将渲染器附加到已有的渲染环境(RenderingContext)中
            premultipliedAlpha: false, // renderer是否假设颜色有 premultiplied alpha. 默认为true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio); // 设置设备像素比。通常用于避免HiDPI设备上绘图模糊
        this.renderer.setViewport(0, 0, this.view.width, this.view.height); // 视口大小设置
        // this.renderer.setSize(context.camera.fullWidth, context.camera.fullHeight);

        // Make sure it does not clear anything before rendering
        this.renderer.autoClear = false;
        this.renderer.autoClearDepth = false;
        this.renderer.autoClearColor = false;
        // this.renderer.autoClearStencil = false;

        // The ArcGIS JS API renders to custom offscreen buffers, and not to the default framebuffers.
        // We have to inject this bit of code into the three.js runtime in order for it to bind those
        // buffers instead of the default ones.
        let originalSetRenderTarget = this.renderer.setRenderTarget.bind(this.renderer);
        this.renderer.setRenderTarget = function (target) {
            originalSetRenderTarget(target);
            if (target == null) {
                context.bindRenderTarget();
            }
        };

        this.scene = new THREE.Scene();
        // setup the camera
        let cam = context.camera;
        this.camera = new THREE.PerspectiveCamera(cam.fovY, cam.aspect, cam.near, cam.far);


        // 添加坐标轴辅助工具
        const axesHelper = new THREE.AxesHelper(1);
        axesHelper.position.copy(1000000, 100000, 100000);
        this.scene.add(axesHelper);

        // setup scene lighting
        this.ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambient);
        this.sun = new THREE.DirectionalLight(0xffffff, 0.5);
        this.sun.position.set(-600, 300, 60000);
        this.scene.add(this.sun);

        this.getGeometry(context);
        context.resetWebGLState();
    }
    /**
     * 渲染器更新渲染
     * @memberof CylinderLayer
     * @method render
     * @param {Object} context 已有渲染器信息，无需传值
     */
    render(context) {
        const THREE = window.THREE;
        let cam = context.camera;
        //需要调整相机的视角
        this.camera.position.set(cam.eye[0], cam.eye[1], cam.eye[2]);
        this.camera.up.set(cam.up[0], cam.up[1], cam.up[2]);
        this.camera.lookAt(new THREE.Vector3(cam.center[0], cam.center[1], cam.center[2]));
        // Projection matrix can be copied directly
        this.camera.projectionMatrix.fromArray(cam.projectionMatrix);
        // update lighting
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        // view.environment.lighting.date = Date.now();
        let l = context.sunLight;
        this.sun.position.set(
            l.direction[0],
            l.direction[1],
            l.direction[2]
        );
        this.sun.intensity = l.diffuse.intensity;
        this.sun.color = new THREE.Color(l.diffuse.color[0], l.diffuse.color[1], l.diffuse.color[2]);
        this.ambient.intensity = l.ambient.intensity;
        this.ambient.color = new THREE.Color(l.ambient.color[0], l.ambient.color[1], l.ambient.color[2]);

        //动画效果
        if (this.renderObject) {
            this.renderObject.scale.x += 0.12
            this.renderObject.scale.z += 0.12
            if (this.renderObject.scale.x > this.scale) {
                this.renderObject.scale.x = 1
                this.renderObject.scale.z = 1
            }
        }
        // draw the scene
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        this.renderer.state.reset();
        this.renderer.render(this.scene, this.camera);
        // as we want to smoothly animate the ISS movement, immediately request a re-render
        this.opts.externalRenderers.requestRender(this.view);
        // cleanup
        context.resetWebGLState();
    }
    /**
     * 创建几何
     * @memberof CylinderLayer
     * @method getGeometry
     */
    getGeometry() {
        let THREE = window.THREE;
        var _self = this;
        var geo = new THREE.CylinderGeometry(this.radius, this.radius, this.height, 100, 1, true);
        var material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            transparent: true, // 必须设置为true,alphaMap才有效果
            depthWrite: true, // 渲染此材质是否对深度缓冲区有任何影响
            map: new THREE.TextureLoader().load(this.texture),
            depthTest: false,
            blending: THREE.AdditiveBlending,
        });
        console.log('vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv')
        this.renderObject = this.transparentObject(geo, material);
        this.renderObject.rotateX(Math.PI / 2);
        var cenP = [];
        this.opts.externalRenderers.toRenderCoordinates(this.view, this.position, 0, this.view.spatialReference, cenP, 0, 1);
        this.renderObject.position.set(cenP[0], cenP[1], cenP[2]);
        this.scene.add(this.renderObject);
    }
    /**
      * 构建Object3D
      * @memberof CylinderLayer
      * @param {Object} geometry
      * @param {Object} material
      * @method transparentObject
    * 示例
     * const geometry = THREE.Geometry();
     * const material = THREE.material();
     * CylinderLayer.transparentObject(geometry, material);
     */
    transparentObject(geometry, material) {
        let THREE = window.THREE;
        let obj = new THREE.Object3D();
        var mesh = new THREE.Mesh(geometry, material);
        mesh.material.side = THREE.BackSide; // back faces
        mesh.renderOrder = 0;
        obj.add(mesh);

        var mesh1 = new THREE.Mesh(geometry, material.clone());
        mesh1.material.side = THREE.FrontSide; // front faces
        mesh1.renderOrder = 1;
        obj.add(mesh1);
        return obj
    }

}

export default CylinderLayer;