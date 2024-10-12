<template>
  <div>
    <div class="tabs">
      <button
        v-for="(tab, index) in tabs"
        :key="index"
        @click="currentTab = index"
        :class="{ active: currentTab === index }"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- Tabs Content -->
    <div class="tab-content">
      <div v-for="(tab, index) in tabs" :key="index" v-show="currentTab === index">
        <h2>{{ tab.name }}</h2>
        <p>{{ tab.content }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    tabs: {
      type: Array,
      required: true
    },
    initialTabIndex: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      currentTab: this.initialTabIndex
    }
  }
}
</script>

<style scoped>
.tabs {
  display: flex;
  margin-bottom: 20px;
}

button {
  padding: 10px 20px;
  margin-right: 10px;
  border: none;
  background-color: #f0f0f0;
  cursor: pointer;
}

button.active {
  background-color: #007bff;
  color: white;
}

.tab-content {
  border: 1px solid #ddd;
  padding: 20px;
}
</style>
