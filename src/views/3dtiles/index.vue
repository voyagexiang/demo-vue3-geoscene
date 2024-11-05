<template>
  <div id="mapdiv"></div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { TilesRenderer } from '3d-tiles-renderer';
import * as THREE from "three";
import {DRACOLoader} from "three/addons";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"

let camera = null;
let scene = null;
let renderer = null;
let tilesRenderer = null;

onMounted(() => {
  initMap();
});

const initMap = () => {
  // const url = 'http://gis.sinoma-sd.cn/model/henan/tileset.json';
  const url = "http://gis.sinoma-sd.cn/model/taian3dtiles/tileset.json";
  // 初始化一个three.js场景
  const container = document.getElementById('mapdiv');
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.z = 1300;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // 创建光源
  const sun = new THREE.DirectionalLight(0xffffff, 0.5);
  sun.position.set(-600, 300, 60000);
  scene.add(sun);
  // 创建环境光，如果不创建环境光，渲染的界面将是一片漆黑
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

//加载3dtiles
  tilesRenderer = new TilesRenderer(url);
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath( './draco/' );
  const loader = new GLTFLoader( tilesRenderer.manager );
  loader.setDRACOLoader( dracoLoader );
  tilesRenderer.manager.addHandler( /\.(gltf|glb)$/g, loader );
  tilesRenderer.setCamera( camera );
  tilesRenderer.setResolutionFromRenderer( camera, renderer );
  tilesRenderer.addEventListener( 'load-tile-set', () => {
    console.log('=========load')
    // 定位3dtiles
    const sphere = new THREE.Sphere();
    tilesRenderer.getBoundingSphere( sphere );
    tilesRenderer.group.position.copy( sphere.center ).multiplyScalar( - 1 );
  });
  console.log('========tilesRenderer.group', tilesRenderer.group)
  scene.add( tilesRenderer.group );

  //创建鼠标控制器
  let controls = new OrbitControls(camera, renderer.domElement );
  //监听控制器，每次拖动后重新渲染画面
  controls.addEventListener('change', function () {
     renderer.render(scene, camera); //执行渲染操作
  });

  renderLoop();
}

const renderLoop = () => {
  requestAnimationFrame( renderLoop );
  //循环渲染效果
  camera.updateMatrixWorld();
  tilesRenderer.update();
  renderer.render( scene, camera );

}
</script>

<style scoped>
@import '../main.css';
</style>
