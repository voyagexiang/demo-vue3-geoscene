<template>
  <div id="viewDiv"></div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import Map from '@geoscene/core/Map';
import SceneView from '@geoscene/core/views/SceneView';
import IntegratedMesh3DTilesLayer from "@geoscene/core/layers/IntegratedMesh3DTilesLayer.js";
import Query from "@geoscene/core/rest/support/Query";
import * as query from '@geoscene/core/rest/query';
import * as externalRenderers from "@geoscene/core/views/3d/externalRenderers";
import * as webgl from "@geoscene/core/views/3d/webgl";
import RenderNode from "@geoscene/core/views/3d/webgl/RenderNode";
import FlashWall from './js/flashWall.js';
import texture0 from '@/assets/material/tex_0.png';
import texture1 from '@/assets/material/tex_1.png';
import ElevationLayer from "@geoscene/core/layers/ElevationLayer.js";
import Ground from "@geoscene/core/Ground.js";

onMounted(() => {
  initMap();
});

const initMap = () => {
  let layer = new IntegratedMesh3DTilesLayer({
    url:'http://gis.sinoma-sd.cn/model/taian3dtiles/tileset.json',
    // url:'http://gis.sinoma-sd.cn/model/scsq3dtiles/tileset.json',
    // elevationInfo: {
    //   offset: -150,
    // }
  })

  const elevationLayer = new ElevationLayer({
    url: "http://ltks.nonmine.com/server/rest/services/taiandsm6/ImageServer",
  })

  let map = new Map({
    basemap:'tianditu-vector',
    layers: [layer],
    ground: new Ground({ layers: [elevationLayer] }),
  })

  let view = new SceneView({
    container: 'viewDiv',
    map,
    viewingMode: 'local',
  })

  let flashWallRenderNode = RenderNode.createSubclass(FlashWall);
  view.when(function () {
    view.extent = layer.fullExtent;
  });
  map.ground
    .load()
    .then(function () {
      // 获取高程抽样
      return view.map.ground.createElevationSampler(layer.fullExtent);
    })
    .then(function (elevationSampler) {
      new flashWallRenderNode({
        view,
        externalRenderers,
        elevationSampler,
        Query,
        QueryTask: query,
        // QueryTask,
        // queryUrl: 'https://bim.arcgisonline.cn/server/rest/services/Hosted/dmLayer/FeatureServer/0',
        queryUrl: 'http://ltks.nonmine.com/server/rest/services/Hosted/kuagnjiexianta84/FeatureServer/1',
        height: 100,
        texture0,
        texture1,
        webgl
      })
    });
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
