<template>
  <div id="viewDiv"></div>
</template>
<script setup>
import Map from '@geoscene/core/Map'
import SceneView from '@geoscene/core/views/SceneView'

import { onBeforeUnmount, onMounted } from 'vue'
import extrudeLayer from '@/views/extrudeLayer/js/extrudeLayer.js'
import Query from '@geoscene/core/rest/support/Query.js'
import * as query from '@geoscene/core/rest/query.js'
import * as three from 'three'
import * as  webgl from '@geoscene/core/views/3d/webgl.js'
import RenderNode from '@geoscene/core/views/3d/webgl/RenderNode'

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

  let extrudeLayerRenderNode = RenderNode.createSubclass(extrudeLayer)

  view.when(function() {
    view.goTo({
      tilt: 61.56156746792838,
      heading: 338.1741593743114,
      position: {
        x: 13053963.301168973,
        y: 4640209.816354747,
        z: 132279.02891495437,
        spatialReference: {
          wkid: 102100
        }
      }
    })

    new extrudeLayerRenderNode({
      view,
      Query,
      QueryTask: query,
      queryUrl: 'https://gs3d.geosceneonline.cn/server/rest/services/Hosted/bjpolygon/FeatureServer/0',
      interval: 100,
      extrudeField: 'SHAPE__Length',
      rgbArray: [255, 0, 0],//渲染颜色值
      maxHeight: 5000,
      minHeight: 600,
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
