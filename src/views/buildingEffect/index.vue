<template>
  <div id="mapdiv" ref="mapdiv" class="mapdiv"></div>
</template>

<script setup>


import Map from '@geoscene/core/Map'
import SceneView from '@geoscene/core/views/SceneView'

import { onBeforeUnmount, onMounted } from 'vue'
import buildingEffect from '@/views/buildingEffect/js/buildingEffect.js'
import Query from '@geoscene/core/rest/support/Query.js'
import * as query from '@geoscene/core/rest/query.js'
import * as three from 'three'
import * as webgl from '@arcgis/core/views/3d/webgl.js'
import * as externalRenderers from '@geoscene/core/views/3d/externalRenderers'
import texture0 from '@/views/buildingEffect/img/tex_0.png'
import texture1 from '@/views/buildingEffect/img/tex_1.png'

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

  const extrudeLayerRender = new buildingEffect({
    view,
    externalRenderers,
    Query,
    QueryTask: query,
    queryUrl: 'https://gs3d.geosceneonline.cn/server/rest/services/Hosted/buildingOutline/FeatureServer/0',
    height: 100,
    texture0,
    texture1,
    webgl
  })
  externalRenderers.add(view, extrudeLayerRender)


  view.when(function() {
    view.goTo({
      fov: 55,
      heading: 53.84636020634115,
      position: {
        x: 12948623.270177595,
        y: 4851464.6538489815,
        z: 979.8496409150151,
        spatialReference: {
          wkid: 102100
        }
      },
      tilt: 61.305047335171494
    })
  })

})

onBeforeUnmount(() => {
})


</script>

<style scoped>
@import '../main.css';
</style>
