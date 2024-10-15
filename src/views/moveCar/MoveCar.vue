<template>
  <div class="mapdiv">
    <div id="mapdiv" ref="mapdiv" class="mapdiv"></div>

    <div id="btnDiv">
      <el-button @click="addPath">添加路径</el-button>
      <el-button @click="startMove">开始路径渲染</el-button>
      <el-button @click="endMove">结束路径渲染</el-button>
      <el-button @click="clearMove">清除径渲染</el-button>
    </div>
  </div>
</template>

<script setup>


import Map from '@geoscene/core/Map'
import SceneView from '@geoscene/core/views/SceneView'

import { onBeforeUnmount, onMounted } from 'vue'
import Graphic from '@geoscene/core/Graphic'
import Polyline from '@geoscene/core/geometry/Polyline'
import MoveCar from './index'

const points = [
  [9725652.926497947, 5463392.223527559],
  [9725668.011886094, 5463361.295490462],
  [9725663.074633524, 5462973.224044753],
  [9726293.845886102, 5462966.717276462],
  [9726297.23525203, 5463393.483098033],
  [9725652.926497947, 5463392.22352755]
]
let v = 1
let movecar = null


onMounted(() => {
  const map = new Map({
    basemap: 'tianditu-image'
  })

  const view = new SceneView({
    map: map,
    container: "mapdiv",
    viewingMode: "global",
    alphaCompositingEnabled: true,
    camera: {
      position: [87.34987559660293, 43.95117187825831, 2268.2247062232345],
      heading: 27.823889801786425,
      tilt: 63.10242206294739,
      fov: 55,
    },

  });

  window.geosceneIn = {
    view,
    map
  }
  movecar = new MoveCar(
    map,
    points,
    v,
    './public/model/Articulated_Dump_Truck.gltf'
  )
})

onBeforeUnmount(() => {
})

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
  movecar.startExecute()
}

function endMove() {
  movecar.terminateExecute()
}

function clearMove() {
  movecar.clearCar()
}


</script>

<style scoped>
@import '../main.css';
#btnDiv{
  position: absolute;
  top: 20px;
  right: 60px;
}
</style>
