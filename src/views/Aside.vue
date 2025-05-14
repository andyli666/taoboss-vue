<template>
    <el-menu :default-active="activeIndex" class="el-menu-aside" :default-openeds="['1']" router>
      <el-sub-menu index="1">
        <template #title>定时修改库存</template>
        <el-menu-item index="/new">新建任务</el-menu-item>
        <el-menu-item index="/list">任务列表</el-menu-item>
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