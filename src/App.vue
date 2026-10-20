<template>
  <el-config-provider :locale="zhCn">
    <div class="common-layout">
      <el-container>
        <el-header v-if="!$route.meta.hideLayout">
          <TopMenu ref="topMenuRef" />
        </el-header>
        <el-alert
          v-if="showSubWarning"
          class="sub-warning"
          :title="subWarningTitle"
          type="warning"
          :closable="true"
          show-icon
          @close="handleSubWarningClose"
          center
        >
          <template #default>
            <span>{{ subWarningMsg }}</span>
            <el-button link type="primary" size="small" @click="handleSubRenew">
              查看版本/续费 →
            </el-button>
          </template>
        </el-alert>
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
import { ref, computed, onMounted } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { Fold, Expand } from '@element-plus/icons-vue'
import TopMenu from '@/components/TopMenu/index.vue'
import { useRoute } from 'vue-router'
import { useSubscriptionStatus } from '@/composables/useSubscriptionStatus'

const route = useRoute()
const hideAside = ref(false)
const asideWidth = ref('200px')

const toggleAside = () => {
  hideAside.value = !hideAside.value
}

// 订阅到期预警
const topMenuRef = ref(null)
const { trialDays, planName, init: initSub, isWarningPeriod, isWarnedToday, markWarnedToday } = useSubscriptionStatus()

const showSubWarning = ref(false)

const subWarningTitle = computed(() => '订阅即将到期')
const subWarningMsg = computed(() => {
  const plan = planName.value || '您的订购'
  const d = trialDays.value
  if (d <= 0) return ''
  if (d === 1) return `${plan}将在 1 天后到期，请及时续费以继续使用。`
  return `${plan}将在 ${d} 天后到期，请及时续费以继续使用。`
})

const handleSubWarningClose = () => {
  showSubWarning.value = false
  markWarnedToday()
}

const handleSubRenew = () => {
  showSubWarning.value = false
  markWarnedToday()
  topMenuRef.value?.openRenewDialog?.()
}

onMounted(async () => {
  await initSub()
  if (isWarningPeriod() && !isWarnedToday()) {
    showSubWarning.value = true
  }
})
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

.sub-warning {
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
  margin: 16px 0 0 0;
  z-index: 999;
}

.sub-warning :deep(.el-alert__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}
</style>