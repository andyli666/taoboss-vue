<template>
  <el-menu :default-active="activeIndex" class="el-menu-aside" :default-openeds="['1']" router>
    <el-sub-menu index="1">
      <template #title>成本设置</template>
      <el-menu-item index="/cost/item-cost-manage">商品成本配置</el-menu-item>
      <el-menu-item index="/cost/freight-cost-config">运费成本配置</el-menu-item>
      <el-menu-item index="/cost/expense">支出明细</el-menu-item>
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