<template>
  <el-carousel :interval="4000" type="card" height="200px">
    <el-carousel-item v-for="item in items" :key="item">
<!--      <el-statistic title="lng:" :value=props.lng />-->
<!--      <el-statistic title="lat" :value=props.lat />-->
<!--      <h3 text="2xl" justify="center">{{ item }}</h3>-->
        <div class="block">
          <span class="demonstration">{{ item.name }}</span>
          <el-image :src="getAssetURL(item.imgUrl)" />
        </div>

    </el-carousel-item>
  </el-carousel>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps(['lng', 'lat'])
const items = ref([
  {
    name: '2024-01-06',
    // imgUrl: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg'
    imgUrl: '1.png',
  },
  {
    name: '2024-04-06',
    imgUrl: '2.png',
  },
  {
    name: '2024-07-06',
    imgUrl: '3.png',
  }
])
const getAssetURL = (image) => {
  return new URL(`/src/views/visualTracking/popup/img/${image}`, import.meta.url).href
}
</script>
<style scoped>
 .block {
   text-align: center;
   display: inline-block;
   box-sizing: border-box;
   vertical-align: top
}
 .demonstration {
   display: block;
   color: var(--el-text-color-secondary);
   font-size: 14px;
   margin-bottom: 20px;
 }
.el-image {
  padding: 0 5px;
  max-width: 300px;
  max-height: 200px;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

</style>
