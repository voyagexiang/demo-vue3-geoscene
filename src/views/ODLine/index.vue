<template>
  <div id="mapdiv" ref="mapdiv" class="mapdiv"></div>
</template>

<script setup>

import Map from '@geoscene/core/Map'
import SceneView from '@geoscene/core/views/SceneView'

import { onBeforeUnmount, onMounted } from 'vue'
import odLine from '@/views/ODLine/js/odLine.js'
import Query from '@geoscene/core/rest/support/Query.js'
import * as query from '@geoscene/core/rest/query.js'
import * as three from 'three'
import * as externalRenderers from '@geoscene/core/views/3d/externalRenderers'

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

  const extrudeLayerRender = new odLine({
    view,
    externalRenderers,
    Query,
    QueryTask: query,
    queryUrl: 'https://gs3d.geosceneonline.cn/server/rest/services/Hosted/rLine/FeatureServer/0',
    color: '#f1c232',
    size: 3,//宽度
    length: 0.2,//<1
    speed: 0.8,//<1
    isShow: true//是否可见道路线
  })
  externalRenderers.add(view, extrudeLayerRender)


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
  })

})

onBeforeUnmount(() => {
})


</script>

<style scoped>
@import '../main.css';
</style>
