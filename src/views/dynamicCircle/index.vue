<template>
  <div id='viewDiv'>
    <button id='addCircleBtn' @click="() => flag = true">添加点</button>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import Map from '@geoscene/core/Map';
import SceneView from '@geoscene/core/views/SceneView';
import IntegratedMesh3DTilesLayer from "@geoscene/core/layers/IntegratedMesh3DTilesLayer.js";
import RenderNode from '@geoscene/core/views/3d/webgl/RenderNode';
import * as webgl from "@geoscene/core/views/3d/webgl";
import * as dat from 'dat.gui';
import {initDynamicCircle} from './js/dynamicCircle';

const flag = ref(false);

onMounted(() => {
  initMap();
});

const initMap = () => {
  let layer = new IntegratedMesh3DTilesLayer({
    url:'http://gis.sinoma-sd.cn/model/taian3dtiles/tileset.json'
  })

  let map = new Map({
    basemap:'tianditu-vector',
    layers: [layer]
  })

  let view = new SceneView({
    container: 'viewDiv',
    map
  })

  view.when(function(){
    view.extent = layer.fullExtent;
  })

  view.on("click", async function (event) {
    // 检查点击的是否为3D图层
    var hit = await view.hitTest(event);
    console.log("===========hit", hit);
  });

  const LuminanceRenderNode = initDynamicCircle(RenderNode);

  function addCircleRender(event){

    const point = {
      type: "point", // autocasts as new Point()
      x: event.mapPoint.x,
      y: event.mapPoint.y,
      z: event.mapPoint.z,
      spatialReference: event.mapPoint.spatialReference
    };

    const pointGround = {...point,z: event.mapPoint.z + 500};

    const points = [
      point.x, point.y, point.z,
      pointGround.x, pointGround.y, pointGround.z,
    ];

    const localOriginRender = webgl.toRenderCoordinates(
      view,
      points,
      0,
      event.mapPoint.spatialReference,
      new Float32Array(points.length),
      0,
      (points.length) / 3,
    );

    const luminanceRenderNode = new LuminanceRenderNode({view, point: localOriginRender});
    var gui = new dat.GUI();
    gui.add(luminanceRenderNode, 'test_float', 0, 1000).name('扫描半径');
    gui.add(luminanceRenderNode, 'test_brightness', 0, 4000).name('持续时间');
    gui.addColor(luminanceRenderNode, 'test_color').name('颜色');
  }

  // var gui = new dat.GUI();

  view.on('click', function(event){
    if(flag.value){
      addCircleRender(event);
    }
    flag.value = false;
  })
}
</script>

<style scoped>
#viewDiv {
  padding: 0;
  margin: 0;
  height: 100vh;
  width: 100%;
//background: radial-gradient(#899AB0, #0E1520);
}
#addCircleBtn {
  position: absolute;
  top: 20px;
  right: 20px;
}
</style>
<style src="../../../node_modules/@geoscene/core/assets/geoscene/themes/light/main.css" />
