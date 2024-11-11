<template>
  <div id="content">
    <div id="viewDiv"></div>
    <div id="infoDiv" ref="infoDiv">
      <popup-component :lng="lng" :lat="lat"></popup-component>
    </div>
  </div>

</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import Map from '@geoscene/core/Map'
import SceneView from '@geoscene/core/views/SceneView'
import Track from '@geoscene/core/widgets/Track.js'
import geolocate from 'mock-geolocation'

import IntegratedMesh3DTilesLayer from '@geoscene/core/layers/IntegratedMesh3DTilesLayer.js'
import ElevationLayer from '@geoscene/core/layers/ElevationLayer.js'
import Ground from '@geoscene/core/Ground.js'
import PopupComponent from '@/views/visualTracking/popup/PopupComponent.vue'

// 获取 infoDiv 的 DOM 元素
const infoDiv = ref('infoDiv')
const lng = ref('')
const lat = ref('')

onMounted(() => {
  stubGeolocation()

  initMap()
})

const initMap = () => {

  const layer = new IntegratedMesh3DTilesLayer({
    url: 'http://gis.sinoma-sd.cn/model/taian3dtiles/tileset.json'
  })

  const elevationLayer = new ElevationLayer({
    url: 'http://ltks.nonmine.com/server/rest/services/taiandsm6/ImageServer'
  })

  let map = new Map({
    basemap: 'tianditu-vector',
    ground: new Ground({ layers: [elevationLayer] }),
    layers: [layer]
  })

  let view = new SceneView({
    container: 'viewDiv',
    map
  })


  view.when(function() {
    view.extent = layer.fullExtent

  })

  const track = new Track({
    view: view,
    goToLocationEnabled: false
  })
  view.ui.add(track, 'top-right')
  // 漫游
  view.when(() => {
    let prevLocation = view.center

    track.on('track', () => {
      const location = track.graphic.geometry

      view.goTo({
        center: location,
        tilt: 70,
        scale: 500,
        heading: 360 - getHeading(location, prevLocation), // only applies to SceneView
        rotation: 360 - getHeading(location, prevLocation) // only applies to MapView
      })
        .catch((error) => {
          if (error.name != 'AbortError') {
            console.error(error)
          }
        })

      prevLocation = location.clone()
    })

    track.start()

  })

  view.on('click', async function(event) {
    let hit = await view.hitTest(event)
    console.log('===========hit', hit)
    geolocate.change({
      lat: hit.ground.mapPoint.latitude,
      lng: hit.ground.mapPoint.longitude
    })
  })
  view.on('click', async function(event) {
    let hit = await view.hitTest(event)
    console.log('===========hit', hit)
    view.hitTest(event).then(function() {
      lat.value = hit.ground.mapPoint.latitude
      lng.value = hit.ground.mapPoint.longitude
      // 显示 infoDiv
      infoDiv.value.style.display = 'block'
    })
  })


}

function getHeading(point, oldPoint) {
  // get angle between two points
  const angleInDegrees = (Math.atan2(point.y - oldPoint.y, point.x - oldPoint.x) * 180) / Math.PI

  // move heading north
  return -90 + angleInDegrees
}

// geolocation simulator
function stubGeolocation() {
  geolocate.use()
}

</script>

<style scoped>
#content{
  position: relative;

}
#viewDiv {
  padding: 0;
  margin: 0;
  height: 100vh;
  width: 100%;
}

#infoDiv {
  position: absolute;
  bottom: 10px;
  /* right: 10px; */
  left: 50%;
  padding: 10px;
  background-color: white;
  border: 1px solid #ccc;
  z-index: 1000;
  /* display: none; */
  width: 80vh;
  height: 25vh;
  margin-left: -40vh;
}
</style>
<style src="../../../node_modules/@geoscene/core/assets/geoscene/themes/light/main.css" />
