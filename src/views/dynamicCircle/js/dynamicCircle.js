import {activeOpacity, activeMatrix, initWebgl2Shaders} from '@/utils/renderCommon.js';

// Derive a new subclass from RenderNode called LuminanceRenderNode
function initDynamicCircle(RenderNode) {
    return RenderNode.createSubclass({
        constructor: function (param) {
            param = {
                ...param
            }
            // consumes and produces define the location of the the render node in the render pipeline
            this.consumes = {required: ["composite-color"]};
            this.produces = "composite-color";
            this.test_float = 500;
            this.test_brightness = 2000;
            this.test_color = [0, 255, 255, 0.1];

            this._time = (new Date()).getTime();

            this.point = param.point;
        },
        // Ensure resources are cleaned up when render node is removed
        destroy() {
            this.shaderProgram && this.gl?.deleteProgram(this.shaderProgram);
            this.positionBuffer && this.gl?.deleteBuffer(this.positionBuffer);
            this.vao && this.gl?.deleteVertexArray(this.vao);
        },
        properties: {
            // Define getter and setter for class member enabled
            enabled: {
                get: function () {
                    return this.produces != null;
                },
                set: function (value) {
                    // Setting produces to null disables the render node
                    this.produces = value ? "composite-color" : null;
                    this.requestRender();
                }
            }
        },

        // 定义传递参数
        tempUniform() {

            const gl = this.gl;

            const maxRadius = this.test_float;

            const duration = this.test_brightness;

            gl.uniform1f(this.scanRadiusUniformLocation,
                maxRadius * (((new Date()).getTime() - this._time) % duration) / duration);

        },

        render(inputs) {
            // The field input contains all available framebuffer objects
            // We need color texture from the composite render target
            const input = inputs.find(({name}) => name === "composite-color");

            const color = input.getTexture();

            // this.resetWebGLState();
            // const output = this.bindRenderTarget();
            // Acquire the composite framebuffer object, and bind framebuffer as current target
            const output = this.acquireOutputFramebuffer();

            const gl = this.gl;

            const depth = input.getTexture(gl.DEPTH_STENCIL_ATTACHMENT);

            // Clear newly acquired framebuffer
            gl.clearColor(0, 0, 0, 0);
            gl.colorMask(true, true, true, true);
            gl.clear(gl.COLOR_BUFFER_BIT);
            // gl.disable(gl.CULL_FACE); // 禁用面剔除

            activeOpacity(gl);

            // Prepare custom shaders and geometry for screenspace rendering
            this.ensureShader(gl);
            this.ensureScreenSpacePass(gl);

            // Bind custom program
            gl.useProgram(this.shaderProgram);

            // Use composite-color render target to be modified in the shader
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, color.glName);
            gl.uniform1i(this.textureUniformLocation, 0);
            gl.uniform2fv(this.nearFarUniformLocation, [this.camera.near, this.camera.far]);
            gl.uniform4fv(this.viewportUniformLocation, this.camera.fullViewport);

            this.tempUniform();


            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, depth.glName);
            gl.uniform1i(this.depthTextureUniformLocation, 2);


            // 传递数据
            gl.uniform1f(this.textureUniformTestFloat, this.test_float);
            gl.uniform1f(this.textureUniformTestBrightness, this.test_brightness);
            gl.uniform4fv(this.textureUniformTestColor, this.test_color);

            gl.uniform3fv(this.textureUniformLightWorldPosition, this.point);

            activeMatrix(this);

            // Issue the render call for a screen space render pass
            gl.bindVertexArray(this.vao);

            gl.drawArrays(gl.TRIANGLES, 0, 3);

            // use depth from input on output framebuffer
            // 添加多个后处理必须设置
            output.attachDepth(input.getAttachment(gl.DEPTH_STENCIL_ATTACHMENT));

            this.requestRender();

            return output;
        },

        shaderProgram: null,
        textureUniformLocation: null,
        depthTextureUniformLocation: null,

        positionLocation: null,
        vao: null,
        positionBuffer: null,
        // used to avoid allocating objects in each frame.

        // Setup screen space filling triangle
        ensureScreenSpacePass(gl) {
            if (this.vao) {
                return;
            }

            this.vao = gl.createVertexArray();
            gl.bindVertexArray(this.vao);
            this.positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            const vertices = new Float32Array([-1.0, -1.0, 3.0, -1.0, -1.0, 3.0]);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.positionLocation);


            gl.bindVertexArray(null);
        },

        // Setup custom shader programs
        ensureShader(gl) {
            if (this.shaderProgram != null) {
                return;
            }
            // The vertex shader program
            // Sets position from 0..1 for fragment shader
            // Forwards texture coordinates to fragment shader
            const vshader = `#version 300 es

                    in vec2 position;

                    out vec2 uv;
                    void main() {
                       uv = position * 0.5 + vec2(0.5);
                       gl_Position = vec4(position, 0.0, 1.0);
                    }`;

            // The fragment shader program applying a greyscsale conversion
            const fshader = `#version 300 es

                    precision mediump float;
                    out mediump vec4 fragColor;

                    // 页面颜色纹理
                    uniform sampler2D colorTex;
                    // 深度纹理
                    uniform sampler2D depthTex;

                    // 相机视图矩阵
                    uniform mat4 u_viewMatrix;
                    // 相机投影矩阵
                    uniform mat4 u_projectionMatrix;
                    // 相机逆投影矩阵
                    uniform mat4 u_inverseProjectionMatrix;

                    // 相机远近截面
                    uniform vec2 nearFar;

                    // 动态半径
                    uniform float test_float;
                    // 动态速度
                    uniform float test_brightness;
                    // 动态颜色
                    uniform vec4 test_color;

                    in vec2 uv;

                    // 扫描半径
                    uniform float u_radius;

                    // 定义光线和观察者的世界位置
                    uniform vec3[2] u_lightWorldPosition;

                    // 线性化深度
                    float linearizeDepth(float depth) {
                        float depthNdc = depth * 2.0 - 1.0;
                        return (2.0 * nearFar[0] * nearFar[1]) / (depthNdc * (nearFar[1] - nearFar[0]) - (nearFar[1] + nearFar[0]));
                    }

                    // 获取深度值
                    float linearDepth(vec2 uv) {
                        ivec2 iuv = ivec2(uv * vec2(textureSize(depthTex, 0)));
                        return texelFetch(depthTex, iuv, 0).r;
                    }

                    // 深度值获取坐标
                    vec4 getPositionByDepth(vec2 uv) {

                        // 获取深度值
                        float depth = linearDepth(uv);

                        // 将深度值转换为视图空间中的Z值
                        // 这通常涉及到将非线性深度值转换为线性深度值
                        float viewZ = linearizeDepth(depth);

                        // 计算裁剪空间中的W值
                        // 这通常用于从NDC（标准化设备坐标）转换为裁剪坐标
                        float clipW = u_projectionMatrix[2][3] * viewZ + u_projectionMatrix[3][3];

                        // 将纹理坐标和深度值转换为NDC坐标
                        // NDC坐标范围是[-1, 1]
                        vec3 ndcPosition = vec3(uv, depth) * 2.0 - 1.0;

                        // 将NDC坐标转换为裁剪坐标
                        // 通过乘以裁剪空间中的W值来实现
                        vec4 clipPosition = vec4(ndcPosition, 1.0) * clipW;

                        // 将裁剪坐标变换回视图坐标
                        // 通过乘以投影矩阵的逆矩阵来实现
                        vec4 viewPos = u_inverseProjectionMatrix * clipPosition;

                        // 进行透视除法，将视图坐标转换为齐次坐标
                        viewPos /= viewPos.w;

                        // 返回视图空间中的位置
                        return viewPos;
                    }

                    // 这个函数的目的是将一个点投影到一个平面上。
                    // 它接受三个参数：平面的法线、平面的原点以及要投影的点。
                    vec3 pointProjectOnPlane(in vec3 planeNormal, in vec3 planeOrigin, in vec3 point) {
                        // 计算从平面原点到点的向量
                        vec3 v01 = point - planeOrigin;

                        // 计算该向量与平面法线的点积
                        // 这个点积代表了从平面原点到点的向量在平面法线方向上的投影长度
                        float d = dot(planeNormal, v01);

                        // 将点投影到平面上
                        // 通过从点向量中减去其在平面法线方向上的投影长度，得到投影点
                        // 这样可以确保投影点位于平面上
                        return (point - planeNormal * d);
                    }


                    void main() {
                        // 从颜色纹理中获取当前像素的颜色
                        vec4 color = texture(colorTex, uv);

                        // 将获取的颜色设置为片段颜色
                        fragColor = color;

                        // 转换坐标 start ========================================================================
                        // 下面的代码可以在 JavaScript 中执行，也可以在 GLSL 中执行
                        // 计算第一个光源位置在视图空间中的位置
                        vec4 center0 = u_viewMatrix * vec4(u_lightWorldPosition[0], 1.0);

                        // 进行透视除法，将齐次坐标转换为视图空间坐标
                        center0 /= center0.w;

                        // 计算第二个光源位置在视图空间中的位置
                        vec4 center500 = u_viewMatrix * vec4(u_lightWorldPosition[1], 1.0);

                        // 进行透视除法
                        center500 /= center500.w;

                        // 计算两个光源之间的法线，用于后续的投影计算
                        vec3 circleNormal = normalize(center500.xyz - center0.xyz);

                        // 转换坐标 end ========================================================================

                        // 获取当前像素在视图空间中的位置
                        vec4 viewPos = getPositionByDepth(uv);

                        // 将视图空间中的点投影到一个平面上
                        // 这个平面由扫描平面法线和扫描中心定义
                        vec3 prjOnPlane = pointProjectOnPlane(
                        circleNormal,center0.xyz,viewPos.xyz);

                        // 计算投影点到扫描中心的距离
                        float dis = length(prjOnPlane.xyz - center0.xyz);

                        // 如果距离小于指定的半径，应用混合效果
                        if (dis < u_radius) {
                            // 计算混合因子
                            float f = 1.0 - abs(u_radius - dis) / u_radius;
                            f = pow(f, 4.0);
                            // 根据混合因子混合当前颜色和测试颜色
                            fragColor.rgb = mix(color.rgb, test_color.rgb/255.0, f);
                        }
                    }


                   `;

            this.shaderProgram = initWebgl2Shaders(gl, vshader, fshader);
            this.nearFarUniformLocation = gl.getUniformLocation(this.shaderProgram, "nearFar");
            this.viewportUniformLocation = gl.getUniformLocation(this.shaderProgram, "viewport");
            this.textureUniformLocation = gl.getUniformLocation(this.shaderProgram, "colorTex");
            this.depthTextureUniformLocation = gl.getUniformLocation(this.shaderProgram, "depthTex");

            this.textureUniformTestFloat = gl.getUniformLocation(this.shaderProgram, "test_float");
            this.textureUniformTestBrightness = gl.getUniformLocation(this.shaderProgram, "test_brightness");
            this.textureUniformTestColor = gl.getUniformLocation(this.shaderProgram, "test_color");
            this.textureUniformLightWorldPosition =
                gl.getUniformLocation(this.shaderProgram, "u_lightWorldPosition");
            this.scanRadiusUniformLocation = gl.getUniformLocation(this.shaderProgram, 'u_radius');

            this.positionLocation = gl.getAttribLocation(this.shaderProgram, "position");
        }
    });
}

export {initDynamicCircle}
