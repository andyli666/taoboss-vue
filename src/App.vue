<script setup>
import Aside from './components/Aside.vue'
import NewTask from './components/NewTask.vue'
</script>
<template>
  <div class="common-layout">
    <el-container>
      <el-header>Header</el-header>
      <el-container>
        <el-aside width="200px">
          <Aside />
        </el-aside>
        <el-main><NewTask /></el-main>
      </el-container>
    </el-container>
  </div>
</template>
<style scoped>

.common-layout .el-header {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--el-color-primary-light-7);
  text-align: center
}
/*
.common-layout .el-header,
.common-layout .el-footer,
.common-layout .el-main,
.common-layout .el-aside {
  display: flex;
  justify-content: center;
  align-items: center
}

.common-layout .el-main,
.common-layout .el-aside {
  align-items:normal
}

.common-layout .el-header,
.common-layout .el-footer {
  background-color: var(--el-color-primary-light-7);
  color: var(--el-text-color-primary);
  text-align: center
}

.common-layout .el-aside {
  background-color: var(--el-color-primary-light-8);
  color: var(--el-text-color-primary);
 text-align: center
}

 .common-layout .el-main {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-text-color-primary);
  text-align: center;
  height: 150px
} */
</style>