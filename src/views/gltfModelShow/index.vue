<template>
  <div class="mapdiv"></div>
</template>

<script>
import FeatureLayer from '@geoscene/core/layers/FeatureLayer.js'
import PopupTemplate from '@geoscene/core/PopupTemplate.js'

import DynamicComponent from '../mapPopup/one/DynamicComponent.vue'
import { createApp } from 'vue'
import DynamicGLTFAPI from '@/views/gltfModelShow/dynamicGltf.js'

import Map from '@geoscene/core/Map'
import SceneView from '@geoscene/core/views/SceneView'
import RenderNode from '@geoscene/core/views/3d/webgl/RenderNode'
import * as webgl from '@geoscene/core/views/3d/webgl'

export default {
  name: 'App',
  components: {},
  async mounted() {
    let map = new Map({
      basemap: 'tianditu-image'
    })
    let view = new SceneView({
      map: map,
      container: this.$el,
      viewingMode: 'local'
    })
    let dynamicGLTFRender = null
    let DynamicGLTFAPIRenderNode = RenderNode.createSubclass(DynamicGLTFAPI)

    view.when(function() {
      view.goTo({
        fov: 55,
        heading: 55.99495193816657,
        position: {
          x: 12938770.522407457,
          y: 4845939.913251031,
          z: 5606.4604498164545,
          spatialReference: {
            wkid: 102100
          }
        },
        tilt: 69.0179407311609
      })
      dynamicGLTFRender = new DynamicGLTFAPIRenderNode({
        view,
        webgl
      })

    })


    view.on('click', async function(event) {
      console.log(view.camera)
      var hit = await view.hitTest(event)
      console.log('===========hit', hit)
      dynamicGLTFRender.updatePosition([hit.ground.mapPoint.x, hit.ground.mapPoint.y, hit.ground.mapPoint.z + 2000])
    })

    const template = new PopupTemplate({
      title: 'Population by Gender',
      content: setContentInfo
    })

    function setContentInfo(feature) {
      console.log(feature)

      const container = document.createElement('div')
      container.id = 'tanchuang'

      const tabs = [
        {
          name: 'Tab 1',
          content: `要素OBJECTID为 ${feature.graphic.attributes.OBJECTID} 的STATE_NAME是: ${feature.graphic.attributes.STATE_NAME}`
        },
        {
          name: 'Tab 2',
          content: `要素OBJECTID为 ${feature.graphic.attributes.OBJECTID} 的STATE_FIPS是: ${feature.graphic.attributes.STATE_FIPS}`
        },
        {
          name: 'Tab 3',
          content: `要素OBJECTID为 ${feature.graphic.attributes.OBJECTID} 的SUB_REGION是: ${feature.graphic.attributes.SUB_REGION}`
        }
      ]

      const app = createApp(DynamicComponent, { tabs, initialTabIndex: 0 })

      app.mount(container)

      return container
    }

    const fl = new FeatureLayer({
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3',
      outFields: ['STATE_NAME', 'STATE_FIPS', 'SUB_REGION', 'STATE_ABBR', 'POP2000'],
      popupTemplate: template
    })
    map.add(fl)


  }
}
</script>

<style scoped>
@import '../main.css';
</style>
