<template>
  <div class="mapdiv">
    <div class="mapdiv" id="viewDiv"></div>
    <div id="btnDiv">
      <el-button @click="addPath">添加路径</el-button>
      <el-button @click="startMove">开始路径渲染</el-button>
      <el-button @click="endMove">结束路径渲染</el-button>
      <el-button @click="clearMove">清除径渲染</el-button>
    </div>
  </div>

</template>

<script setup>

import { onMounted } from 'vue'
import DynamicGLTFAPI from '@/views/gltfModelMoveShow/dynamicGltf.js'
import * as externalRenderers from '@geoscene/core/views/3d/externalRenderers'

import Map from '@geoscene/core/Map'
import SceneView from '@geoscene/core/views/SceneView'
import MoveCar from '@/views/gltfModelMoveShow/index.js'
import Polyline from '@geoscene/core/geometry/Polyline.js'
import Graphic from '@geoscene/core/Graphic.js'

const points = [
  [12951326.493237052, 4853952.086447924],
  [12949028.262606025, 4847257.110948907],
  [12954918.045681862, 4849509.592180731],
  [12953533.669428933, 4853223.932062919],
  [12951326.493237052, 4853952.086447924]
]
let v = 60
let movecar = null
let dynamicGLTFRender = null
onMounted(() => {
    let map = new Map({
      basemap: 'tianditu-image'
    })
    let view = new SceneView({
      map: map,
      container: 'viewDiv',
      viewingMode: 'local'
    })
    view.when(function() {
      view.goTo({
        fov: 55,
        heading: 55.99495193816657,
        position: {
          x: 12938770.522407457,
          y: 4845939.913251031,
          z: 5606.4604498164545,
          spatialReference: {
            wkid: 102100
          }
        },
        tilt: 69.0179407311609
      })
      dynamicGLTFRender = new DynamicGLTFAPI({
        view,
        externalRenderers
      })
      externalRenderers.add(view, dynamicGLTFRender)
      let updatePosition = dynamicGLTFRender.updatePosition()

      movecar = new MoveCar(
        points,
        v,
        updatePosition
      )
    })


    view.on('click', async function(event) {
      let hit = await view.hitTest(event)
      console.log('===========hit', hit)
      console.log(hit.ground.mapPoint)
      // dynamicGLTFRender.updatePosition([hit.ground.mapPoint.x, hit.ground.mapPoint.y, hit.ground.mapPoint.z + 2000])
      dynamicGLTFRender.updatePosition(
        {
          carPoint: [hit.ground.mapPoint.x, hit.ground.mapPoint.y, hit.ground.mapPoint.z + 2000],
          height: 10, // 设置的模型高度视觉变量的属性值
          heading: Math.PI / 2 // 设置模型水平旋转视觉变量的属性值
        }
      )
    })

    window.geosceneIn = {
      view,
      map
    }

  }
)

function addPath() {
  const path = new Polyline({
    paths: [points], // 点坐标集合
    spatialReference: window.geosceneIn.view.spatialReference // 空间参考
  })

  window.geosceneIn.view.extent = path.extent

  const pathGraphic = new Graphic({
    geometry: path, // 几何体
    symbol: {
      // 展示符号
      type: 'simple-line',
      color: 'red', // 颜色
      width: '4px', // 线的粗细
      style: 'solid' // 线的样式
    }
  })
  window.geosceneIn.view.graphics.add(pathGraphic) // 添加进三维场景中
}

function startMove() {
  dynamicGLTFRender.scene.add(dynamicGLTFRender.gltfMesh.scene)
  let AnimationAction = dynamicGLTFRender.mixer.clipAction(dynamicGLTFRender.gltfMesh.animations[0])
  AnimationAction.play()//播放动画

  movecar.startExecute()
}

function endMove() {
  movecar.terminateExecute()
}

function clearMove() {
  dynamicGLTFRender.clearMesh()
}

</script>

<style scoped>
@import '../main.css';

#btnDiv {
  position: absolute;
  top: 20px;
  right: 60px;
}
</style>
