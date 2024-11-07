<template>
  <div id="viewDiv"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import Map from '@geoscene/core/Map'
import SceneView from '@geoscene/core/views/SceneView'
import Track from '@geoscene/core/widgets/Track.js'
import geolocate from 'mock-geolocation'


onMounted(() => {
  stubGeolocation()

  initMap()
})

const initMap = () => {
  let map = new Map({
    basemap: 'tianditu-vector'
  })

  const view = new SceneView({
    map: map,
    container: 'viewDiv',
    center: [117.187038, 34.057322],
    zoom: 18,
    ui: {
      components: ['attribution'] // replace default set of UI components
    }
  })


  const track = new Track({
    view: view,
    goToLocationEnabled: false
  })
  view.ui.add(track, 'top-left')

  view.when(() => {
    let prevLocation = view.center

    track.on('track', () => {
      const location = track.graphic.geometry

      view.goTo({
        center: location,
        tilt: 50,
        scale: 2500,
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
    var hit = await view.hitTest(event)
    console.log('===========hit', hit)
    geolocate.change({
      lat: hit.ground.mapPoint.latitude,
      lng: hit.ground.mapPoint.longitude
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
#viewDiv {
  padding: 0;
  margin: 0;
  height: 100vh;
  width: 100%;
}

#overlay {
  position: absolute;
  font-size: 16px;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.7);
}

#overlay button {
  background: transparent;
  border: 0;
  border: 1px solid rgb(255, 255, 255);
  border-radius: 4px;
  color: #ffffff;
  padding: 12px 18px;
  text-transform: uppercase;
  cursor: pointer;
}


#video {
  display: none;
}
</style>
<style src="../../../node_modules/@geoscene/core/assets/geoscene/themes/light/main.css" />
