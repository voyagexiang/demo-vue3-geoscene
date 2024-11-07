<template>
  <div id="content">
    <div id="overlay">
      <button id="startButton" @click="playVideo">Play</button>
    </div>
    <video id="video" autoplay controls>
      <source src="./textures/sintel.ogv" type='video/ogg; codecs="theora, vorbis"'>
      <source src="./textures/sintel.mp4" type='video/mp4; codecs="avc1.42E01E, mp4a.40.2"'>
    </video>
    <div id="viewDiv"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import Map from '@geoscene/core/Map'
import SceneView from '@geoscene/core/views/SceneView'
import Query from '@geoscene/core/rest/support/Query'
import * as query from '@geoscene/core/rest/query'
import * as webgl from '@geoscene/core/views/3d/webgl'
import RenderNode from '@geoscene/core/views/3d/webgl/RenderNode'
import materialsVideo from './js/materialsVideo.js'
let overlay=null
let video=null
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
  //todo  webgl_lights_spotlight
  let buildingEffectRenderNode = RenderNode.createSubclass(materialsVideo)
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

    overlay = document.getElementById('overlay')
    video = document.querySelector('#video')
    video.addEventListener('play', function() {

      this.currentTime = 3

    })
    new buildingEffectRenderNode({
      view,
      Query,
      QueryTask: query,
      queryUrl: 'https://gs3d.geosceneonline.cn/server/rest/services/Hosted/buildingOutline/FeatureServer/0',
      height: 100,
      webgl, video
    })
  })
}
const playVideo = () => {
  overlay.remove()

  video.play()

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
