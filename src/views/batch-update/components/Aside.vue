<template>
  <el-menu :default-active="activeIndex" class="el-menu-aside" :default-openeds="['1']" router>
    <el-sub-menu index="1">
      <template #title>批量修改</template>
      <!-- <el-menu-item index="/batch-update/title">修改标题</el-menu-item> -->
      <el-menu-item index="/batch-update/title-v2">修改标题</el-menu-item>
      <el-menu-item index="/batch-update/shop-title">修改导购标题</el-menu-item>
      <el-menu-item index="/batch-update/price">修改价格</el-menu-item>
      <el-menu-item index="/batch-update/stock">修改库存</el-menu-item>
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