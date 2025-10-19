<template>
  <el-menu :default-active="activeIndex" class="el-menu-aside" :default-openeds="['1']" router>
    <el-sub-menu index="1">
      <template #title>小工具</template>
      <el-menu-item index="/widget/blacklist">黑名单设置</el-menu-item>
      <el-menu-item index="/widget/profit-calc">利润计算器</el-menu-item>
      <el-menu-item index="/widget/auto-rate">自动评价</el-menu-item>
      <el-menu-item index="/widget/rate-alarm">中差评提醒</el-menu-item>
      <el-menu-item index="/widget/rate-auto-reply">评价自动回复</el-menu-item>
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