<script setup>
import { defineAsyncComponent, ref } from 'vue'
const Header = defineAsyncComponent(() =>
  import('./views/Header.vue') //虽然用了异步组件，但是实际上当v-if为false时还是加载了，不知道为何
)
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { Fold, Expand } from '@element-plus/icons-vue'
const hideAside = ref(false)
</script>
<template>
  <el-config-provider :locale="zhCn">
    <div class="common-layout">
      <el-container>
        <el-header v-if="!$route.meta.hideLayout">
          <Header />
        </el-header>
        <el-container>
          <el-aside :width="hideAside ? '20px' : '200px'" v-if="!$route.meta.hideLayout && !$route.meta.hideAside"
            style="overflow-x:hidden">
            <el-button :icon="hideAside ? Expand : Fold" size="small" @click="hideAside = !hideAside"
              style="padding-left: 0;padding-right: 0;" />
            <router-view name="aside"></router-view>
          </el-aside>
          <el-main :class="{ nopadding: $route.meta.hideAside }">
            <RouterView />
          </el-main>
        </el-container>
      </el-container>
    </div>
  </el-config-provider>
</template>
<style scoped>
.el-header {
  padding: 0;
}

.nopadding {
  padding-right: 0;
  padding-left: 0;
}
</style>