<template>
  <el-menu :default-active="activeIndex" class="el-menu-aside" :default-openeds="['1']" router>
    <el-sub-menu index="1">
      <template #title>经营分析</template>
      <el-menu-item index="/statistics/order-profit">订单及利润统计</el-menu-item>
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