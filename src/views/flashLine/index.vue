<template>
  <div id="viewDiv"></div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import Map from '@geoscene/core/Map';
import SceneView from '@geoscene/core/views/SceneView';
import IntegratedMesh3DTilesLayer from "@geoscene/core/layers/IntegratedMesh3DTilesLayer.js";
import FlashLine from "@/views/flashLine/js/flashLine.js";
import * as externalRenderers from "@geoscene/core/views/3d/externalRenderers";
import * as query from "@geoscene/core/rest/query";
import Query from "@geoscene/core/rest/support/Query";
import ElevationLayer from "@geoscene/core/layers/ElevationLayer.js";
import Ground from "@geoscene/core/Ground.js";
import RenderNode from '@geoscene/core/views/3d/webgl/RenderNode'
import * as webgl from '@geoscene/core/views/3d/webgl.js'

const flag = ref(false);

onMounted(() => {
  initMap();
});

const initMap = () => {
  const layer = new IntegratedMesh3DTilesLayer({
    url:'http://gis.sinoma-sd.cn/model/taian3dtiles/tileset.json',
    // elevationInfo: {
    //   offset: -150,
    // }
  })

  const elevationLayer = new ElevationLayer({
    url: "http://ltks.nonmine.com/server/rest/services/taiandsm6/ImageServer",
  });

  let map = new Map({
    basemap:'tianditu-vector',
    ground: new Ground({ layers: [elevationLayer] }),
    layers: [layer]
  })

  let view = new SceneView({
    container: 'viewDiv',
    map
  })


  view.when(function(){
    view.extent = layer.fullExtent;

  })

  let odLineRender=RenderNode.createSubclass( FlashLine)
  map.ground
    .load()
    .then(function () {
      // 获取高程抽样
      return view.map.ground.createElevationSampler(layer.fullExtent);
    })
    .then(function (elevationSampler) {
      // 动态矿界
      new odLineRender({
        elevationSampler,
        view,
        externalRenderers,
        Query,
        QueryTask: query,
        queryUrl:
          "http://ltks.nonmine.com/server/rest/services/Hosted/kuagnjiexianta84/FeatureServer/1",
        // queryUrl: config.boundary[0].layerUrl,
        color: "#FFF036",
        size: 5, //宽度
        length: 0.2, //<1
        speed: 0.3, //<1
        isShow: true, //是否可见道路线
        webgl
      });
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
