<template>
  <div id="viewDiv"></div>
</template>

<script setup>

import Map from '@geoscene/core/Map'
import SceneView from '@geoscene/core/views/SceneView'

import { onBeforeUnmount, onMounted } from 'vue'
import odLine from '@/views/ODLine/js/odLine.js'
import Query from '@geoscene/core/rest/support/Query.js'
import * as query from '@geoscene/core/rest/query.js'
import * as three from 'three'
import * as  webgl from '@geoscene/core/views/3d/webgl.js'

import * as externalRenderers from '@geoscene/core/views/3d/externalRenderers'
import RenderNode from '@geoscene/core/views/3d/webgl/RenderNode.js'
import texture0 from '@/assets/material/tex_0.png'
import texture1 from '@/assets/material/tex_1.png'

window.THREE = three

onMounted(() => {

  const map = new Map({
    basemap: 'tianditu-image'
  })

  const view = new SceneView({
    container: 'viewDiv',
    map,
    viewingMode: 'local',
    alphaCompositingEnabled: true,
    camera: {
      position: [116.34987559660293, 40, 2268.2247062232345],
      heading: 27.823889801786425,
      tilt: 63.10242206294739,
      fov: 55
    }

  })
  let odLineRenderNode = RenderNode.createSubclass(odLine)

  view.when(function() {
    view.goTo({
      fov: 55,
      heading: 23.186137002529893,
      position: {
        x: 12954971.91151246,
        y: 4846884.521914151,
        z: 2903.7313713895214,
        spatialReference: {
          wkid: 102100
        }
      },
      tilt: 62.46796754204343
    })

    new odLineRenderNode({
      view,
      externalRenderers,
      Query,
      QueryTask: query,
      queryUrl: 'https://gs3d.geosceneonline.cn/server/rest/services/Hosted/rLine/FeatureServer/0',
      color: '#f1c232',
      size: 3,//宽度
      length: 0.2,//<1
      speed: 0.8,//<1
      isShow: true,//是否可见道路线
      webgl
    })

  })

})
</script>

<style scoped>
#viewDiv {
  padding: 0;
  margin: 0;
  height: 100vh;
  width: 100%;
}
</style>
<style src="../../../node_modules/@geoscene/core/assets/geoscene/themes/light/main.css" />
