<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/mapPopup1">地图弹窗方式一</RouterLink>
        <RouterLink to="/mapPopup2">地图弹窗方式二</RouterLink>
        <RouterLink to="/mapmodel">加载动态Gltf</RouterLink>
        <RouterLink to="/mapmodelmove">加载动态Gltf，路径回访</RouterLink>
        <RouterLink to="/movecar">小车路径回放</RouterLink>
        <RouterLink to="/extrudeLayer">底面拉伸</RouterLink>
        <RouterLink to="/bufferLine">渐变边界线</RouterLink>
        <RouterLink to="/buildingEffect">建筑效果</RouterLink>
        <RouterLink to="/odline">道路ODLine</RouterLink>
        <RouterLink to="/labelPoint">点标注</RouterLink>
        <RouterLink to="/cyclinderLayer">光圈</RouterLink>
        <RouterLink to="/3dtiles">3dtiles</RouterLink>
        <RouterLink to="/scanningLight">动态扩扫描</RouterLink>
        <RouterLink to="/dynamicCircle">动态扩散圆</RouterLink>
        <RouterLink to="/flyline">飞线</RouterLink>
        <RouterLink to="/flashWall">动态围墙</RouterLink>
        <RouterLink to="/flashLine">流光矿界线</RouterLink>
        <RouterLink to="/video">视频融合</RouterLink>
        <RouterLink to="/visualTracking">沿线漫游</RouterLink>
      </nav>
    </div>
  </header>
  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
