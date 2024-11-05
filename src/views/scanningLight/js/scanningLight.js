import * as mat4 from "@geoscene/core/core/libs/gl-matrix-2/math/mat4";
import * as vec3 from '@geoscene/core/core/libs/gl-matrix-2/math/vec3';
import * as vec4 from '@geoscene/core/core/libs/gl-matrix-2/math/vec4';
import * as mat3 from '@geoscene/core/core/libs/gl-matrix-2/math/mat3';
// import * as mat4 from "@geoscene/core/core/libs/gl-matrix-2/mat4";
// import * as vec3 from '@geoscene/core/core/libs/gl-matrix-2/vec3';
// import * as vec4 from '@geoscene/core/core/libs/gl-matrix-2/vec4';
// import * as mat3 from '@geoscene/core/core/libs/gl-matrix-2/mat3';
import * as vec4f64 from '@geoscene/core/core/libs/gl-matrix-2/factories/vec4f64';
import * as vec3f64 from '@geoscene/core/core/libs/gl-matrix-2/factories/vec3f64';
import * as mat4f64 from '@geoscene/core/core/libs/gl-matrix-2/factories/mat4f64';
import * as mat3f64 from '@geoscene/core/core/libs/gl-matrix-2/factories/mat3f64';
import {activeOpacity, activeMatrix, initWebgl2Shaders} from '@/utils/renderCommon.js';
function initScanningLight(RenderNode) {
  return RenderNode.createSubclass({
      constructor: function (param) {
        param = {
          ...param
        }
        // consumes and produces define the location of the the render node in the render pipeline
        this.consumes = { required: ["composite-color"] };
        this.produces = "composite-color";
        // 半径
        this.test_float = 500;
        // 持续时间
        this.test_brightness = 2000;
        // 颜色
        this.test_color = [0, 255, 255, 0.1];

        // 记录时间
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

        // 获取WebGL上下文
        const gl = this.gl;

        // 扩散中心位置
        // 这里假设this.point是一个包含3个元素（x, y, z）的数组
        const _Cartesian3Center = this.point.slice(0, 3);

        // 增加齐次坐标
        // 齐次坐标是OpenGL中使用的坐标系统，用于处理透视投影
        const _Cartesian4Center = [..._Cartesian3Center, 1.0];

        // 扩展中心位置，增加高度
        // 用于计算法线
        const _Cartesian3Center1 = this.point.slice(3);
        const _Cartesian4Center1 = [..._Cartesian3Center1, 1.0];
        _Cartesian4Center1[0] += 1.0; // 增加高度

        // 另一个中心位置的扩展
        const _Cartesian3Center2 = this.point.slice(0, 3);
        const _Cartesian4Center2 = [..._Cartesian3Center2, 1.0];
        _Cartesian4Center2[0] += 1.0; // 增加高度

        // 转为视图坐标系
        // 即跟随视野变化
        const scanCenter = vec4f64.create();

        // 应用矩阵计算
        vec4.transformMat4(scanCenter, _Cartesian4Center, this.camera.viewMatrix);

        // 扫描中心和半径
        gl.uniform4fv(this.scanCenterUniformLocation, scanCenter);
        gl.uniform1f(this.scanRadiusUniformLocation, this.test_float);

        // ==============================================================================

        // 法线转为视图坐标系
        // 即跟随视野变化
        const _scratchCartesian3Normal = vec3f64.create();

        // 创建临时向量用于存储法线坐标
        const temp = vec4f64.create();
        vec4.transformMat4(temp, _Cartesian4Center, this.camera.viewMatrix);

        // 创建另一个临时向量用于存储法线坐标
        const temp1 = vec4f64.create();
        vec4.transformMat4(temp1, _Cartesian4Center1, this.camera.viewMatrix);

        // 计算法线
        _scratchCartesian3Normal[0] = temp1[0] - temp[0];
        _scratchCartesian3Normal[1] = temp1[1] - temp[1];
        _scratchCartesian3Normal[2] = temp1[2] - temp[2];

        // 归一化向量
        vec3.normalize(_scratchCartesian3Normal, _scratchCartesian3Normal);

        // 传递法线给着色器
        gl.uniform3fv(this.scanPlaneNormalUniformLocation, _scratchCartesian3Normal);

        // ==============================================================================

        // 另一个法线向量
        const _scratchCartesian3Normal1 = vec3f64.create();

        // 创建另一个临时向量用于存储法线坐标
        const temp2 = vec4f64.create();
        vec4.transformMat4(temp2, _Cartesian4Center2, this.camera.viewMatrix);

        // 计算法线
        _scratchCartesian3Normal1[0] = temp2[0] - temp[0];
        _scratchCartesian3Normal1[1] = temp2[1] - temp[1];
        _scratchCartesian3Normal1[2] = temp2[2] - temp[2];

        // 旋转法线向量
        const tempTime = (((new Date()).getTime() - this._time) % this.test_brightness) / this.test_brightness;

        // 创建旋转矩阵
        const _RotateQ = mat4f64.create();
        const _RotateM = mat3f64.create();

        // 应用旋转
        mat4.fromRotation(_RotateQ, tempTime * Math.PI * 2, _scratchCartesian3Normal);

        // 从旋转矩阵获取旋转矩阵
        mat3.fromMat4(_RotateM, _RotateQ);

        // 应用旋转到法线向量
        vec3.transformMat3(_scratchCartesian3Normal1, _scratchCartesian3Normal1, _RotateM);

        // 归一化旋转后的法线向量
        vec3.normalize(_scratchCartesian3Normal1, _scratchCartesian3Normal1);

        // 传递旋转后的法线给着色器
        gl.uniform3fv(this.scanLineNormalECUniformLocation, _scratchCartesian3Normal1);

      },

      render(inputs) {
        // The field input contains all available framebuffer objects
        // We need color texture from the composite render target
        const input = inputs.find(({ name }) => name === "composite-color");

        const color = input.getTexture();

        const output = this.acquireOutputFramebuffer();

        const gl = this.gl;

        const depth = input.getTexture(gl.DEPTH_STENCIL_ATTACHMENT);

        // Clear newly acquired framebuffer
        gl.clearColor(0, 0, 0, 0);
        gl.colorMask(true, true, true, true);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // gl.disable(gl.CULL_FACE); // 禁用面剔除

        // 激活透明
        activeOpacity(gl);

        // Prepare custom shaders and geometry for screenspace rendering
        this.ensureShader(gl);
        this.ensureScreenSpacePass(gl);

        // Bind custom program
        gl.useProgram(this.shaderProgram);

        this.tempUniform();
        // 传递数据
        gl.uniform4fv(this.textureUniformTestColor, this.test_color);
        gl.uniform2fv(this.nearFarUniformLocation, [this.camera.near, this.camera.far]);

        // 绑定颜色纹理
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, color.glName);
        gl.uniform1i(this.textureUniformLocation, 0);

        // 绑定颜色纹理
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, depth.glName);
        gl.uniform1i(this.depthTextureUniformLocation, 2);

        // 激活相机矩阵
        activeMatrix(this);

        // Issue the render call for a screen space render pass
        gl.bindVertexArray(this.vao);

        gl.drawArrays(gl.TRIANGLES, 0, 3);

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

                    in vec2 uv;

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

                    // 动态颜色
                    uniform vec4 test_color;
                    // 扫描半径
                    uniform float u_radius;

                    // 扫描中心点
                    uniform vec4 u_scanCenterEC;
                    // 扫描平面法线
                    uniform vec3 u_scanPlaneNormalEC;
                    uniform vec3 u_scanLineNormalEC;

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
                        float viewZ = linearizeDepth(depth);

                        // 计算裁剪空间中的W值
                        float clipW = u_projectionMatrix[2][3] * viewZ + u_projectionMatrix[3][3];

                        // 将纹理坐标和深度值转换为NDC坐标
                        vec3 ndcPosition = vec3(uv, depth) * 2.0 - 1.0;

                        // 将NDC坐标转换为裁剪坐标
                        vec4 clipPosition = vec4(ndcPosition, 1.0) * clipW;

                        // 将裁剪坐标变换回视图坐标
                        vec4 viewPos = u_inverseProjectionMatrix * clipPosition;

                        // 进行透视除法，将视图坐标转换为齐次坐标
                        viewPos /= viewPos.w;

                        // 返回视图空间中的位置
                        return viewPos;
                    }

                    // 将一个点投影到一个平面上。
                    vec3 pointProjectOnPlane(in vec3 planeNormal, in vec3 planeOrigin, in vec3 point) {
                        // 计算从平面原点到点的向量
                        vec3 v01 = point - planeOrigin;

                        // 计算该向量与平面法线的点积
                        float d = dot(planeNormal, v01);

                        // 将点投影到平面上
                        return (point - planeNormal * d);
                    }


                     // 判断一个点是否在直线右侧的函数
                    bool isPointOnLineRight(in vec3 ptOnLine, in vec3 lineNormal, in vec3 testPt) {
                        // 计算测试点到直线上点的向量
                        vec3 v01 = testPt - ptOnLine;
                        // 归一化该向量
                        normalize(v01);
                        // 计算该向量与直线法向量的叉积
                        vec3 temp = cross(v01, lineNormal);
                        // 计算叉积结果与另一个法向量的点积
                        float d = dot(temp, u_scanPlaneNormalEC);
                        // 如果点积大于 0.5 返回真
                        return d > 0.5;
                    }

                    void main() {
                        // 从颜色纹理中获取当前像素的颜色
                        vec4 color = texture(colorTex, uv);

                        // 将获取的颜色设置为片段颜色
                        fragColor = color;

                        // 获取当前像素在视图空间中的位置
                        vec4 viewPos = getPositionByDepth(uv);

                        // 将当前像素投影到指定平面上
                        vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz, u_scanCenterEC.xyz, viewPos.xyz);
                        // 计算投影点到指定中心的距离
                        float dis = length(prjOnPlane.xyz - u_scanCenterEC.xyz);
                        // 获取两倍半径值
                        float twou_radius = u_radius * 2.0;
                        // 如果距离小于半径
                        if (dis < u_radius) {
                            // 计算一个与距离相关的衰减值 f0
                            float f0 = 1.0 - abs(u_radius - dis) / u_radius;
                            f0 = pow(f0, 64.0);
                            // 计算直线终点
                            vec3 lineEndPt = vec3(u_scanCenterEC.xyz) + u_scanLineNormalEC * u_radius;
                            // 初始化一个值 f
                            float f = 0.0;
                            // 如果点在直线右侧
                            if (isPointOnLineRight(u_scanCenterEC.xyz, u_scanLineNormalEC.xyz, prjOnPlane.xyz)) {
                                // 计算到直线终点的距离
                                float dis1 = length(prjOnPlane.xyz - lineEndPt);
                                // 计算另一个与距离相关的衰减值 f
                                f = abs(twou_radius - dis1) / twou_radius;
                                f = pow(f, 3.0);
                            }
                            // 对颜色进行混合
                            fragColor.rgb = mix(color.rgb, test_color.rgb/255.0, f + f0);
                        }
                    }

                   `;

        this.shaderProgram = initWebgl2Shaders(gl, vshader, fshader);
        this.nearFarUniformLocation = gl.getUniformLocation(this.shaderProgram, "nearFar");
        this.textureUniformLocation = gl.getUniformLocation(this.shaderProgram, "colorTex");
        this.depthTextureUniformLocation = gl.getUniformLocation(this.shaderProgram, "depthTex");

        this.textureUniformTestColor = gl.getUniformLocation(this.shaderProgram, "test_color");

        this.scanCenterUniformLocation = gl.getUniformLocation(this.shaderProgram, 'u_scanCenterEC');
        this.scanPlaneNormalUniformLocation = gl.getUniformLocation(this.shaderProgram, 'u_scanPlaneNormalEC');
        this.scanLineNormalECUniformLocation = gl.getUniformLocation(this.shaderProgram, 'u_scanLineNormalEC');
        this.scanRadiusUniformLocation = gl.getUniformLocation(this.shaderProgram, 'u_radius');


        this.positionLocation = gl.getAttribLocation(this.shaderProgram, "position");
      }
    }
  )
}

export {initScanningLight}
