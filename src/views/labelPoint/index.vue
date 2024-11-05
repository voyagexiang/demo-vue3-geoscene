<template>
  <div id="mapdiv" ref="mapdiv" class="mapdiv"></div>
</template>

<script setup>

import Map from '@geoscene/core/Map'
import SceneView from '@geoscene/core/views/SceneView'

import { onBeforeUnmount, onMounted } from 'vue'
import labelPoint from '@/views/labelPoint/js/labelPoint.js'
import * as three from 'three'
import * as externalRenderers from '@geoscene/core/views/3d/externalRenderers'
import texture1 from './img/tex_1.png';
import texture2 from './img/billboard.png';
import RenderNode from '@geoscene/core/views/3d/webgl/RenderNode.js'
import * as webgl from "@geoscene/core/views/3d/webgl";

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
  let labelPointRenderNode = RenderNode.createSubclass(labelPoint);

  view.when(function() {
    view.goTo({
      fov: 55,
      heading: 358.83617947864354,
      position: {
        x: 13522335.449138768,
        y: 3508779.5737503027,
        z: 107686.45338745633,
        spatialReference: {
          wkid: 102100
        }
      },
      tilt: 51.78744026248896
    });
    new labelPointRenderNode({
      view,
      points: [
        [13529536.50333642, 3626588.0048437016, 1000,1],//1-三角锥标注，2-精灵图标标注
        [13493621.2254855, 3647407.029471413, 1000,1],
        [13517475.44380141, 3652703.85109271, 1000,2]
      ],
      color_pyr:'#5588aa',
      width_pyr: 1000,
      height_pyr: 1500,
      texture_pyr:texture1,
      size_spr:[6000,3000,6000],
      texture_spr:texture2,
      webgl

    })
  })

})

</script>

<style scoped>
@import '../main.css';
</style>
