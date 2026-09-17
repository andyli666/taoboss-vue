<template>
  <el-config-provider :locale="zhCn">
    <div class="common-layout">
      <el-container>
        <el-header v-if="!$route.meta.hideLayout">
          <TopMenu />
        </el-header>
        <el-container>
          <!-- 侧边栏容器 -->
          <div class="aside-wrapper" :class="{ collapsed: hideAside }">
            <el-aside v-show="!hideAside" :width="asideWidth" class="aside-container"
              v-if="!$route.meta.hideLayout && !$route.meta.hideAside">
              <router-view name="aside"></router-view>
            </el-aside>

            <!-- 切换按钮 - 放在右边框上 -->
            <div class="toggle-btn-wrapper" @click="toggleAside">
              <el-button :icon="hideAside ? Expand : Fold" circle size="small" class="toggle-btn" />
            </div>
          </div>

          <el-main :class="{
            nopadding: $route.meta.hideAside || $route.meta.nopadding
          }">
            <RouterView />
          </el-main>
        </el-container>
      </el-container>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { Fold, Expand } from '@element-plus/icons-vue'
import TopMenu from '@/components/TopMenu/index.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const hideAside = ref(false)
const asideWidth = ref('200px')

const toggleAside = () => {
  hideAside.value = !hideAside.value
}
</script>

<style scoped>
.el-header {
  padding: 0;
}

.aside-wrapper {
  position: relative;
  display: flex;
  align-items: stretch;
}

.aside-container {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fff;
  border-right: 1px solid #e4e7ed;
  overflow: hidden;
  flex-shrink: 0;
}

/* 切换按钮包装器 - 定位在右边框上 */
.toggle-btn-wrapper {
  position: absolute;
  right: -12px;
  /* 按钮一半在侧边栏内，一半在外 */
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn {
  background: #fff;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background: #f5f7fa;
  transform: scale(1.1);
}

/* 侧边栏折叠状态 */
.aside-wrapper.collapsed .toggle-btn-wrapper {
  right: -12px;
}

.nopadding {
  padding-right: 0;
  padding-left: 0;
  padding-top: 0;
}
</style>