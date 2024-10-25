<template>
  <div id="mapdiv" ref="mapdiv" class="mapdiv"></div>
</template>

<script setup>

import Map from '@geoscene/core/Map'
import SceneView from '@geoscene/core/views/SceneView'

import { onBeforeUnmount, onMounted } from 'vue'
import * as three from 'three'
import * as externalRenderers from '@geoscene/core/views/3d/externalRenderers'
import texture from '@/views/cyclinderLayer/img/tex_1.png'
import * as webgl from '@geoscene/core/views/3d/webgl.js'
import cylinderLayer from '@/views/cyclinderLayer/js/cylinderLayer.js'
import IntegratedMeshLayer from '@geoscene/core/layers/IntegratedMeshLayer.js'

window.THREE = three

onMounted(() => {

  const map = new Map({
    basemap: 'tianditu-image'
  })
  const layer = new IntegratedMeshLayer({
    url:'https://gs3d.geosceneonline.cn/server/rest/services/Hosted/HongKong/SceneServer'
  })

  map.layers.add(layer);

  const view = new SceneView({
    map: map,
    container: 'mapdiv',
    viewingMode: 'local'
  })

  const cylinderLayerRender = new cylinderLayer({
    view,
    position: [12713244.08627044,2552797.5531978905,89.50873601809144],
    radius: 70,
    height: 20,
    scale: 5,
    texture: texture,
    webgl,
    externalRenderers
  })
  externalRenderers.add(view, cylinderLayerRender)


  view.when(function() {
    view.goTo({
      fov: 55,
      heading: 6.559213650926498,
      position: {
        x: 12713133.7866393198,
        y: 2551777.229459867,
        z: 599.83490394273,
        spatialReference: {
          wkid: 102100
        }
      },
      tilt: 62.7480405896
    });
  })

})

onBeforeUnmount(() => {
})
</script>

<style scoped>
@import '../main.css';

</style>
