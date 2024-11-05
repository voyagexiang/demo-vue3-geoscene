
const shaderProgram = 'shaderProgram';
// 初始化地图
function initMap(esri, container = "viewDiv", center) {

    const {Map, SceneView, Home} = esri;

    /*********************
     * Create a map
     *********************/
    const map = new Map({
        basemap: "hybrid",
        // ground: "world-elevation"
    });

    center = {
        x: 120,
        y: 35,
        z: 3480000.61,
        ...center
    }

    /*********************
     * Create a scene view
     *********************/
    const view = new SceneView({
        container: "viewDiv",
        map: map,
        viewingMode: "global",
        // spatialReference: {wkid: 4326},
        camera: {
            position: {
                x: center.x,
                y: center.y,
                z: center.viewH || center.z,
                spatialReference: {wkid: 4326}
            },
            heading: 0,
            tilt: 0
        }
    });

    const homeBtn = new Home({
        view: view
    });

    // Add the home button to the top left corner of the view
    view.ui.add(homeBtn, "top-left");

    return {map, view}
}

// 检测着色器是否编译成功
function checkShaderCompilation(gl, shader) {
    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    console.log("Shader compiled successfully: " + compiled);
    var compilationLog = gl.getShaderInfoLog(shader);
    console.log("Shader compiler log: " + compilationLog);
}

/**
 * 初始化webgl2
 * @param gl
 * @param vertCode
 * @param fragCode
 * @return {*}
 */
function initWebgl2Shaders(gl, vertCode, fragCode) {
    // Create a vertex shader object
    var vertShader = gl.createShader(gl.VERTEX_SHADER);

    // Attach vertex shader source code
    gl.shaderSource(vertShader, vertCode);

    // Compile the vertex shader
    gl.compileShader(vertShader);

    checkShaderCompilation(gl, vertShader);

    // Create fragment shader object
    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

    // Attach fragment shader source code
    gl.shaderSource(fragShader, fragCode);

    // Compile the fragment shader
    gl.compileShader(fragShader);

    checkShaderCompilation(gl, fragShader);

    // Create a shader program object to store
    // the combined shader program
    var shaderProgram = gl.createProgram();

    // Attach a vertex shader
    gl.attachShader(shaderProgram, vertShader);

    // Attach a fragment shader
    gl.attachShader(shaderProgram, fragShader);

    // Link both the programs
    gl.linkProgram(shaderProgram);

    // Use the combined shader program object
    gl.useProgram(shaderProgram);

    return shaderProgram;
}

// 开启透明
function activeOpacity(gl) {
    // 开启透明 start ===============================================================
    gl.enable(gl.BLEND); // 开启混合
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // 设置混合函数
    // 开启透明 end ===============================================================
}


function activeNearFar(this_, nearFarName = "nearFar") {

    const gl = this_.gl;

    let nearFar = gl.getUniformLocation(this_[this_.programName || shaderProgram], "nearFar");

    gl.uniform2fv(nearFar, [this_.camera.near, this_.camera.far]);

    return nearFar;
}

function activeCameraMatrix(this_, matrixName) {

    const gl = this_.gl;
    // project 矩阵
    // 投影矩阵
    let programUniformMatrix = gl.getUniformLocation(
        this_[this_.programName || shaderProgram],
        matrixName
    );
    gl.uniformMatrix4fv(
        programUniformMatrix,
        false,
        this_.camera[matrixName.replace('u_', '')]
    );

    return programUniformMatrix;
}


function activeProjectionMatrix(this_,
                                projectionMatrix = 'u_projectionMatrix') {
    activeCameraMatrix(this_, projectionMatrix);
}

function activeViewMatrix(this_,
                          viewMatrix = 'u_viewMatrix') {
    activeCameraMatrix(this_, viewMatrix);
}

function activeInverseProjectionMatrix(this_,
                                       inverseProjectionMatrix = 'u_inverseProjectionMatrix') {
    activeCameraMatrix(this_, inverseProjectionMatrix);
}

function activeInverseTransposeMatrix(this_,
                                      viewInverseTransposeMatrix = 'u_viewInverseTransposeMatrix') {
    activeCameraMatrix(this_, viewInverseTransposeMatrix);
}

// 视图逆矩阵
function activeInverseViewMatrix(this_,
                                 inverseViewMatrix = 'u_inverseViewMatrix',
                                 matTool) {

    const gl = this_.gl;

    const {mat4, mat4f64} = matTool;

    if (!mat4 || !mat4f64) {
        return;
    }
    // 投影矩阵
    let programUniformInverseViewMatrix = gl.getUniformLocation(
        this_[this_.programName || shaderProgram],
        inverseViewMatrix
    );

    // 计算矩阵的逆矩阵
    let inverseMatrix = mat4f64.create();
    mat4.translate(inverseMatrix, this_.camera.viewMatrix, this_.camera.center);
    // let inverseMatrix2 = mat4f64.create();
    mat4.invert(inverseMatrix, inverseMatrix);
    // mat4.invert(inverseMatrix2, this.camera.projectionMatrix);
    // console.log(this.camera.inverseProjectionMatrix)
    // console.log(inverseMatrix2)

    gl.uniformMatrix4fv(
        programUniformInverseViewMatrix,
        false,
        // this.camera.projectionMatrix
        inverseMatrix
    );
    return programUniformInverseViewMatrix;
}

// 开启默认 uniform 矩阵参数
// 包括相机视图、投影、投影逆矩阵、视图逆转置矩阵
function activeMatrix(this_, matrixName) {

    matrixName = {
        viewMatrix: 'u_viewMatrix',
        projectionMatrix: 'u_projectionMatrix',

        inverseProjectionMatrix: 'u_inverseProjectionMatrix',
        viewInverseTransposeMatrix: 'u_viewInverseTransposeMatrix',

        ...matrixName
    }

    const {
        viewMatrix,
        projectionMatrix,
        inverseProjectionMatrix,
        viewInverseTransposeMatrix
    } = matrixName;

    activeViewMatrix(this_, viewMatrix);

    activeProjectionMatrix(this_, projectionMatrix);

    activeInverseProjectionMatrix(this_, inverseProjectionMatrix);

    activeInverseTransposeMatrix(this_, viewInverseTransposeMatrix);
}

// 载入视频 start ==================================================================
let copyVideo = false;

// 载入视频
function setupVideo(url) {

    const video = document.createElement("video");

    let playing = false;
    let timeupdate = false;

    video.playsInline = true;
    video.muted = true;
    video.loop = true;

    // 等待以下两个事件
    // 确保 video 中已有数据

    video.addEventListener(
        "playing",
        () => {
            playing = true;
            checkReady();
        },
        true,
    );

    video.addEventListener(
        "timeupdate",
        () => {
            timeupdate = true;
            checkReady();
        },
        true,
    );

    video.src = url;
    video.play();

    function checkReady() {
        if (playing && timeupdate) {
            copyVideo = true;
        }
    }

    return video;
}

// 初始化纹理
function initTexture(gl, color = [0, 0, 255, 255]) {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 因为视频必须通过互联网下载
    // 可能需要一些时间才能准备好
    // 因此在纹理中放置一个像素，以便我们
    // 可以立即使用它。
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array(color); // 不透明的蓝色
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        width,
        height,
        border,
        srcFormat,
        srcType,
        pixel,
    );

    // 关闭 mips 并将包裹（wrapping）设置为边缘分割（clamp to edge）
    // 这样无论视频的尺寸如何，都可以正常工作。
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    return texture;
}

// 更新纹理
function updateTexture(gl, texture, video) {
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    // 翻转纹理图像的 y 轴
    // 必须设置，否则会颠倒闪烁
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        srcFormat,
        srcType,
        video,
    );
}

// 载入视频 end ==================================================================

// 开启深度检测
function activeDepthTest(gl) {
    gl.enable(gl.DEPTH_TEST); // 开启深度检测
}

// 关闭面剔除
function deactiveCullFace(gl) {
    gl.disable(gl.CULL_FACE); // 禁用面剔除
}


//初始化帧缓冲区（FBO）
function initFramebufferObject(gl, width, height, activeDepth) {

    // 离屏渲染尺寸
    var OFFSCREEN_WIDTH = width || 1024;
    var OFFSCREEN_HEIGHT = height || 1024;

    var framebuffer, texture, depthBuffer

    //处理错误
    var error = function () {
        if (framebuffer) gl.deleteFramebuffer(framebuffer)
        if (texture) gl.deleteTexture(texture)
        if (depthBuffer) gl.deleteRenderbuffer(depthBuffer)
        return null
    }

    //创建帧缓冲区
    framebuffer = gl.createFramebuffer()
    if (!framebuffer) {
        console.log('创建帧缓冲区对象失败')
        return error()
    }

    //创建纹理对象并设置参数
    texture = gl.createTexture() //创建纹理对象
    if (!texture) {
        console.log('创建纹理对象失败')
        return error()
    }
    gl.bindTexture(gl.TEXTURE_2D, texture) //绑定纹理对象
    gl.texImage2D(gl.TEXTURE_2D, 0,
        gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT,
        0, gl.RGBA, gl.UNSIGNED_BYTE,
        null) //纹理图像分配给纹理对象
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR) //配置纹理对象参数
    framebuffer.texture = texture //将纹理对象关联到帧缓冲区的颜色关联对象

    if (activeDepth === true) {
        //创建渲染缓冲区对象并设置参数
        depthBuffer = gl.createRenderbuffer() //创建渲染缓冲区对象
        if (!depthBuffer) {
            console.log('创建渲染缓冲区对象失败')
            return error()
        }
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer) //绑定渲染缓冲区
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
            OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT) //设置渲染缓冲区尺寸
    }


    //将纹理对象和渲染缓冲区对象关联到帧缓冲区对象
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer) //绑定帧缓冲区对象
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if(activeDepth){
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer)
    }

    // activeDepth === true ? gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer) : '';

    //检查帧缓冲区的配置状态
    var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (gl.FRAMEBUFFER_COMPLETE !== e) { //gl.FRAMEBUFFER_COMPLETE 表示帧缓冲区对象已正确配置
        console.log('帧缓冲区配置不正确: ' + e.toString())
        return error()
    }

    //解绑帧缓冲区对象、纹理对象、渲染缓冲区对象
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindTexture(gl.TEXTURE_2D, null)
    // gl.bindRenderbuffer(gl.RENDERBUFFER, null)

    return framebuffer
}


// Create and compile WebGL shader objects
function createShader(gl, src, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return shader;
}

// Create and link WebGL program object
function createProgram(gl, vsSource, fsSource) {
    const program = gl.createProgram();
    if (!program) {
        console.error("Failed to create program");
    }
    const vertexShader = createShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(gl, fsSource, gl.FRAGMENT_SHADER);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        // covenience console output to help debugging shader code
        console.error(`Failed to link program:
                      error ${gl.getError()},
                      info log: ${gl.getProgramInfoLog(program)},
                      vertex: ${gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)},
                      fragment: ${gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)}
                      vertex info log: ${gl.getShaderInfoLog(vertexShader)},
                      fragment info log: ${gl.getShaderInfoLog(fragmentShader)}`);
    }
    return program;
}

export  { initMap, initWebgl2Shaders, activeMatrix, activeOpacity, initTexture }