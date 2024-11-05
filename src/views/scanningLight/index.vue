<template>
  <div id="viewDiv">
    <button
      id='renderNodeToggle'
    >隐藏渲染</button>
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
import {initScanningLight} from './js/scanningLight.js';
import Graphic from "@geoscene/core/Graphic.js";
import {SpatialReference} from "@geoscene/core/geometry.js";

const flag = ref(false);

onMounted(() => {
  initMap();
});

const initMap = () => {
  let layer = new IntegratedMesh3DTilesLayer({
    url:'http://gis.sinoma-sd.cn/model/taian3dtiles/tileset.json',
    elevationInfo: {
      offset: -150,
    }
  })

  let map = new Map({
    basemap:'tianditu-vector',
    layers: [layer]
  })

  let view = new SceneView({
    container: 'viewDiv',
    map
  })

  // // 地面点
  const point = {
    type: "point", // autocasts as new Point()
    x: 116.89542345538057,
    y: 36.193795194657916,
    z: 1,
    viewH: 3000,
  };

  // 空中点
  const pointSky = {
    type: "point", // autocasts as new Point()
    x: 116.89542345538057,
    y: 36.193795194657916,
    z: 500
  };

  const markerSymbol = {
    type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
    color: [226, 119, 40],
    outline: {
      // autocasts as new SimpleLineSymbol()
      color: [255, 255, 255],
      width: 2
    }
  };

  // 创建点对象
  const pointGraphic = new Graphic({
    geometry: point,
    symbol: markerSymbol
  });

  view.graphics.add(pointGraphic);

  // 平铺点数据
  const points = [
    point.x, point.y, point.z,
    pointSky.x, pointSky.y, pointSky.z,
  ];

  view.when(function(){
    view.extent = layer.fullExtent;

    // 世界坐标
    const localOriginRender = webgl.toRenderCoordinates(
      view,
      points,
      0,
      SpatialReference.WGS84,
      new Float32Array(points.length),
      0,
      (points.length) / 3,
    );

    const LuminanceRenderNode = initScanningLight(RenderNode);

    // Initializes the new custom render node and connects to SceneView
    const luminanceRenderNode = new LuminanceRenderNode({ view, point: localOriginRender });

    var gui = new dat.GUI();
    gui.add(luminanceRenderNode, 'test_float', 0, 1000).name('扫描半径');
    gui.add(luminanceRenderNode, 'test_brightness', 0, 4000).name('持续时间');

    var colorController = gui.addColor(luminanceRenderNode, 'test_color').name('颜色');

    // Toggle button to enable/disable the custom render node
    const renderNodeToggle = document.getElementById("renderNodeToggle");
    renderNodeToggle.addEventListener("click", () => {
      luminanceRenderNode.enabled = !luminanceRenderNode.enabled;
      if(luminanceRenderNode.enabled){
        renderNodeToggle.innerHTML = '隐藏渲染';
      }else{
        renderNodeToggle.innerHTML = '显示渲染';
      }

    });
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
#renderNodeToggle {
  position: absolute;
  top: 120px;
  right: 20px;
  width: 100px;
  height: 30px;
  borderRadius: 5px;
}
</style>
<style src="../../../node_modules/@geoscene/core/assets/geoscene/themes/light/main.css" />
