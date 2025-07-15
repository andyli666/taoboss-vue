<script setup>
import { defineAsyncComponent } from 'vue'
const Header = defineAsyncComponent(() =>
  import('./views/Header.vue') //虽然用了异步组件，但是实际上当v-if为false时还是加载了，不知道为何
)
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>
<template>
  <el-config-provider :locale="zhCn">
    <div class="common-layout">
      <el-container>
        <el-header v-if="!$route.meta.hideLayout">
          <Header />
        </el-header>
        <el-container>
          <el-aside width="200px" v-if="!$route.meta.hideLayout">
            <router-view name="aside"></router-view>
          </el-aside>
          <el-main>
            <RouterView />
          </el-main>
        </el-container>
      </el-container>
    </div>
  </el-config-provider>
</template>