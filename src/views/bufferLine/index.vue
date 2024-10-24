<template>
  <div class="mapdiv">
    <div id="mapdiv" ref="mapdiv" class="mapdiv"></div>
  </div>
</template>

<script setup>


import Map from '@geoscene/core/Map'
import SceneView from '@geoscene/core/views/SceneView'

import { onBeforeUnmount, onMounted } from 'vue'
import bufferLine from '@/views/bufferLine/js/bufferLine.js'
import Query from '@geoscene/core/rest/support/Query.js'
import * as query from '@geoscene/core/rest/query.js'
import * as three from 'three'
import * as webgl from '@geoscene/core/views/3d/webgl.js'
// import * as webgl from "@geoscene/core/views/3d/webgl.js";

import * as externalRenderers from '@geoscene/core/views/3d/externalRenderers'
import { MeshLine, MeshLineMaterial } from 'threejs-meshline'
import texture from '@/views/bufferLine/img/line.png'

window.THREE = three

onMounted(() => {
  const map = new Map({
    basemap: 'tianditu-image'
  })

  const view = new SceneView({
    map: map,
    container: 'mapdiv',
    viewingMode: 'local',
    alphaCompositingEnabled: true,
    camera: {
      position: [116.34987559660293, 40, 2268.2247062232345],
      heading: 27.823889801786425,
      tilt: 63.10242206294739,
      fov: 55
    }

  })

  window.geosceneIn = {
    view,
    map
  }

  const extrudeLayerRender = new bufferLine(
    {
      view,
      externalRenderers,
      Query,
      query,
      MeshLine,
      MeshLineMaterial,
      queryUrl: 'https://gs3d.geosceneonline.cn/server/rest/services/Hosted/yanqing/FeatureServer/0',
      width: 2000,
      texture,
      webgl
    })
  externalRenderers.add(view, extrudeLayerRender)


  view.when(function() {
    view.goTo({
      fov: 55,
      tilt: 52.70900067620726,
      heading: 344.4638162994172,
      position: {
        x: 12982311.63941162,
        y: 4760176.414256406,
        z: 140960.06714017296,
        spatialReference: {
          wkid: 102100
        }
      }
    })
  })

})

onBeforeUnmount(() => {
})


</script>

<style scoped>
@import '../main.css';
</style>
