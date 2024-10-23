<template>
  <div class="mapdiv">
    <div style="position: absolute;right: 20px;top:20px;background-color: white">
      在原PopupTemplate上进行修改，创建Vue实例作为弹窗内容，优点点击要素不需要判断，缺点不能编译elementui组件
    </div>
  </div>
</template>

<script>
import Map from '@geoscene/core/Map.js'
import MapView from '@geoscene/core/views/MapView'
import FeatureLayer from '@geoscene/core/layers/FeatureLayer.js'
import PopupTemplate from '@geoscene/core/PopupTemplate.js'

import DynamicComponent from './DynamicComponent.vue'
import { createApp } from 'vue'

export default {
  name: 'App',
  components: {},
  async mounted() {
    const map = new Map({
      basemap: 'tianditu-vector'
    })

    const view = new MapView({
      container: this.$el,
      map: map,
      center: [-105, 38],
      zoom: 4
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
@import '../../main.css';
</style>
