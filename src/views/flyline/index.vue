<template>
  <div id="viewDiv"></div>
  <div id="label"></div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import Map from '@geoscene/core/Map';
import SceneView from '@geoscene/core/views/SceneView';
import IntegratedMesh3DTilesLayer from "@geoscene/core/layers/IntegratedMesh3DTilesLayer.js";
// import * as dat from 'dat.gui';
// import Graphic from "@geoscene/core/Graphic.js";
// import {SpatialReference} from "@geoscene/core/geometry.js";
import Query from "@geoscene/core/rest/support/Query";
import * as query from '@geoscene/core/rest/query';
import * as externalRenderers from "@geoscene/core/views/3d/externalRenderers";
import * as webgl from "@geoscene/core/views/3d/webgl";
import RenderNode from "@geoscene/core/views/3d/webgl/RenderNode";
import FlylineMarker from './js/flylineMarker.js';
import texture0 from '@/assets/material/tex_0.png';
import texture1 from '@/assets/material/tex_1.png';
import FlashLine from "@/views/flashLine/js/flashLine.js";
import ElevationLayer from "@geoscene/core/layers/ElevationLayer.js";
import Ground from "@geoscene/core/Ground.js";
import {Point, SpatialReference} from "@geoscene/core/geometry.js";
import {TextSymbol} from "@geoscene/core/symbols.js";
import Graphic from "@geoscene/core/Graphic";

onMounted(() => {
  initMap();
});

const initMap = () => {
  let layer = new IntegratedMesh3DTilesLayer({
    url:'http://gis.sinoma-sd.cn/model/taian3dtiles/tileset.json',
    // url:'http://gis.sinoma-sd.cn/model/scsq3dtiles/tileset.json',
    elevationInfo: {
      offset: -150,
    }
  })

  let map = new Map({
    basemap:'tianditu-image',
    // layers: [layer],
  })

  let view = new SceneView({
    container: 'viewDiv',
    map,
    viewingMode: 'local',
    camera: {
      position: [116.89445782274609, 35.941061598900255, 23160.26126230228],
      fov: 55,
      heading: 14.610423808082675,
      tilt: 53.89639605594937,
    }
  })

  window.view = view

  view.on("click", async function (event) {
    // 检查点击的是否为3D图层
    var hit = await view.hitTest(event);
    console.log("===========hit", hit);
  });

  let flylineMarkerRenderNode = RenderNode.createSubclass(FlylineMarker);
  view.when(function () {
    new flylineMarkerRenderNode({
      view,
      webgl,
      size: 5000,
      height: 4000,
      maxHeight: 5500,
      minHeight: 5000,
      speed: 10,
      lineWidth: 100,
      positionConfig: [{
        longitude: 116.89168636895607,
        latitude: 36.19137356224247,
        color: "#e54949",
        textColor: "#b07d7d",
        text: "济南",
      }, {
        longitude: 117.00669525528684,
        latitude: 36.09070210632804,
        color: "#f8ec06",
        textColor: "#adad83",
        text: "泰安",
      }],
      container: document.getElementById("label"),
    });
    const textPoint = new Point({
			longitude: 116.89168636895607,
			latitude: 36.19137356224247,
			z: 300,
			spatialReference: new SpatialReference({ wkid: 102100 }),
		});
    // 标签渲染
		const textSymbol = new TextSymbol({
			color: "white",
			backgroundColor: "black",
			haloColor: "black",
			haloSize: "1px",
			text: "厂区",
			xoffset: 3,
			yoffset: 3,
			font: {
				// autocasts as new Font()
				size: 8,
				family: "Josefin Slab",
				weight: "bold",
			},
		});
    const graphic = new Graphic({
      geometry: textPoint,
      symbol: textSymbol,
    });
    view.graphics.add(graphic);
  });
}
</script>

<style scoped>
#viewDiv {
  padding: 0;
  margin: 0;
  height: 100vh;
  width: 100%;
//background: radial-gradient(#899AB0, #0E1520);
}
#label {
  position: absolute;
  top: 0;
  left: 0;
  padding: 0;
  margin: 0;
  height: 100vh;
  width: 100%;
  pointer-events: none;
}
#renderNodeToggle {
  position: absolute;
  top: 120px;
  right: 20px;
  width: 100px;
  height: 30px;
  borderRadius: 5px;
}
</style>
<style>
.tip-box {
  --base-color: dodgerblue;
  border: solid 1px var(--base-color);
  background-color: rgba(30, 144, 255, 0.3);
  color: white;
  white-space: nowrap;
  padding-left: 8px;
  padding-right: 16px;
  height: 32px;
  animation: big 1s ease-in;
  border-radius: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 0 8px var(--base-color);
}
.tip-box .circle {
  background-color: var(--base-color);
  height: 16px;
  width: 16px;
  border-radius: 50%;
  animation: flash 0.5s ease-in alternate infinite;
}
.tip-box .text {
  margin: 0 8px;
}
@keyframes big {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes flash {
  0% {
    opacity: 0.3;
  }
  100% {
    opacity: 1;
  }
}
</style>
<style src="../../../node_modules/@geoscene/core/assets/geoscene/themes/light/main.css" />
