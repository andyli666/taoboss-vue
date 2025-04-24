<template>
    <el-menu :default-active="activeIndex" class="el-menu-aside" :default-openeds="['1']" >
      <el-sub-menu index="1">
        <template #title>sku定时修改库存</template>
        <el-menu-item index="1-1">新建任务</el-menu-item>
        <el-menu-item index="1-2">任务列表</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue'
  
  const activeIndex = ref('1-1')
  </script>
  
  <style scoped>
  .el-menu-aside {
    width: 100%
  }
  </style>