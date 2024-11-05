<template>
  <div id="viewDiv"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import Map from '@geoscene/core/Map'
import SceneView from '@geoscene/core/views/SceneView'
import Query from '@geoscene/core/rest/support/Query'
import * as query from '@geoscene/core/rest/query'
import * as webgl from '@geoscene/core/views/3d/webgl'
import RenderNode from '@geoscene/core/views/3d/webgl/RenderNode'
import buildingEffect from './js/buildingEffect.js'
import texture0 from '@/assets/material/tex_0.png'
import texture1 from '@/assets/material/tex_1.png'

onMounted(() => {
  initMap()
})

const initMap = () => {
  let map = new Map({
    basemap: 'tianditu-vector'
  })

  let view = new SceneView({
    container: 'viewDiv',
    map,
    viewingMode: 'local'
  })

  let buildingEffectRenderNode = RenderNode.createSubclass(buildingEffect)
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

    new buildingEffectRenderNode({
      view,
      Query,
      QueryTask: query,
      queryUrl: 'https://gs3d.geosceneonline.cn/server/rest/services/Hosted/buildingOutline/FeatureServer/0',
      height: 200,
      texture0,
      texture1,
      webgl
    })
  })
}
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
