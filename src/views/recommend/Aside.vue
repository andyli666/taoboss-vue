<template>
  <el-menu :default-active="activeIndex" class="el-menu-aside" :default-openeds="['1']" router>
    <el-sub-menu index="1">
      <template #title>关联推荐</template>
      <el-menu-item index="/recommend/new">新建活动</el-menu-item>
      <el-menu-item index="/recommend/list">活动列表</el-menu-item>
      <el-menu-item index="/recommend/banner">海报下载</el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeIndex = computed(() => {
  return route.path
})
</script>

<style scoped>
.el-menu-aside {
  width: 100%
}
</style>