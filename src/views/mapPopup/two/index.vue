<template>
  <div class="mapdiv">
    <div class="mapdiv">
      <div style="position: absolute;right: 20px;top:20px;background-color: white">
        新建div，position设置为absolute，根据地图点击，修改div位置，优点可以编译elementui组件，确定判断点了那个要素
      </div>
    </div>
    <div id="infoDiv">
      <el-statistic title="Daily active users" :value="268500" />
      <popup-component></popup-component>
    </div>
  </div>


</template>

<script>
import Map from '@geoscene/core/Map.js'
import MapView from '@geoscene/core/views/MapView'
import FeatureLayer from '@geoscene/core/layers/FeatureLayer.js'
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils.js'
import PopupComponent from '@/views/mapPopup/two/PopupComponent.vue'

export default {
  name: 'App',
  components: { PopupComponent },

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


    const fl = new FeatureLayer({
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3',
      outFields: ['STATE_NAME', 'STATE_FIPS', 'SUB_REGION', 'STATE_ABBR', 'POP2000']
    })
    map.add(fl)


    // 获取 infoDiv 的 DOM 元素
    var infoDiv = document.getElementById('infoDiv')

    var divPoint

    // 监听点击事件
    view.on('click', function(event) {
      view.hitTest(event).then(function(response) {
        if (response.results.length > 0) {
          var graphic = response.results.filter(function(result) {
            return result.graphic.layer === fl
          })[0].graphic

          // 获取要素属性
          var attributes = graphic.attributes

          // // 更新 infoDiv 内容
          // infoDiv.innerHTML = "<strong>要素信息:</strong><br>" +
          //   "属性1: " + attributes.OBJECTID + "<br>" +
          //   "属性2: " + attributes.CITY_NAME;

          // 显示 infoDiv
          infoDiv.style.display = 'block'

          // 设置 infoDiv 位置
          updateInfoDivPosition(event.mapPoint)

          divPoint = event.mapPoint
        }
      })
    })

    // 地图移动时更新 div 位置
    reactiveUtils.watch(
      () => view?.extent,
      () => {
        if (infoDiv.style.display === 'block') {
          updateInfoDivPosition(divPoint)
        }

      })

    function updateInfoDivPosition(mapPoint) {

      // 将地图坐标转换为屏幕坐标
      var screenPoint = view.toScreen(mapPoint)

      // 设置 infoDiv 的位置
      infoDiv.style.left = `${screenPoint.x + 15}px`
      infoDiv.style.top = screenPoint.y + 'px'
    }

  }
}
</script>

<style scoped>
@import '../../main.css';

#infoDiv {
  position: absolute;
  padding: 10px;
  background-color: white;
  border: 1px solid #ccc;
  z-index: 1000;
  display: none;
  width: 30vh;
  height: 20vh;
}
</style>
