<!-- src/components/TopMenu/index.vue -->
<template>
  <header class="top-menu-header">
    <div class="menu-container">
      <!-- ====== 左侧：Logo ====== -->
      <div class="menu-left">
        <div class="logo" @click="goHome">
          <img src="/logo.png" alt="淘掌柜" class="logo-icon" />
          <span class="logo-text">TAOBOSS</span>
        </div>
      </div>

      <!-- ====== 中间：菜单 ====== -->
      <nav class="menu-center">
        <div
          v-for="item in menuList"
          :key="item.index"
          class="menu-item-wrapper"
          :class="{ active: isActive(item) }"
          @mouseenter="hoverIndex = item.index"
          @mouseleave="hoverIndex = null"
        >
          <!-- ====== 有子菜单（使用 groups 分组） ====== -->
          <template v-if="item.groups && item.groups.length">
            <div class="menu-item parent" @click="handleParentClick(item)">
              <el-icon class="menu-icon"><component :is="item.icon" /></el-icon>
              <span class="menu-label">{{ item.label }}</span>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
              <div class="active-bar" :class="{ show: isActive(item) }"></div>
            </div>
            <transition name="dropdown">
              <div v-show="hoverIndex === item.index" class="dropdown-panel">
                <div
                  v-for="(group, groupIdx) in item.groups"
                  :key="groupIdx"
                  class="dropdown-group"
                >
                  <!-- 分组标题（可选） -->
                  <div v-if="group.name" class="dropdown-group-title">{{ group.name }}</div>
                  <div class="dropdown-grid">
                    <div
                      v-for="child in group.items"
                      :key="child.index"
                      class="dropdown-item"
                      @click="handleMenuClick(child.index)"
                    >
                      <div class="dropdown-item-icon">{{ child.icon }}</div>
                      <div class="dropdown-item-content">
                        <div class="dropdown-item-title">{{ child.label }}</div>
                        <div class="dropdown-item-desc">{{ child.desc || '' }}</div>
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="groupIdx < item.groups.length - 1"
                    class="dropdown-divider"
                  ></div>
                </div>
              </div>
            </transition>
          </template>

          <!-- ====== 无子菜单 ====== -->
          <template v-else>
            <div class="menu-item" @click="handleMenuClick(item.index)">
              <el-icon class="menu-icon"><component :is="item.icon" /></el-icon>
              <span class="menu-label">{{ item.label }}</span>
              <div class="active-bar" :class="{ show: isActive(item) }"></div>
            </div>
          </template>
        </div>
      </nav>

      <!-- ====== 右侧：功能区 ====== -->
      <div class="menu-right">
        <!-- 联系客服 -->
        <div class="icon-btn" @click="handleContactService">
          <el-icon size="18"><ChatDotRound /></el-icon>
          <span class="service-label">联系客服</span>
        </div>

        <!-- 帮助文档 -->
        <a href="https://help.taoboss.com" target="_blank" class="icon-btn" style="text-decoration: none;">
          <el-icon size="18"><Document /></el-icon>
          <span class="service-label">帮助文档</span>
        </a>

        <div class="divider"></div>

        <!-- 剩余时间 + 续费升级 -->
        <div class="trial-info">
          <span class="trial-days">剩余时间：<strong>{{ trialDays }}</strong> 天</span>
          <button class="renew-btn" @click="showRenewDialog = true">续费升级</button>
        </div>

        <!-- 用户 -->
        <div class="user-avatar-wrapper" @click="handleUserClick">
          <div class="user-avatar-text">{{ username.charAt(0) }}</div>
          <span class="user-name">{{ username }}</span>
          <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
        </div>
      </div>
    </div>

    <!-- ====== 续费弹窗 ====== -->
    <el-dialog
      v-model="showRenewDialog"
      title="续费升级"
      width="520px"
      :close-on-click-modal="false"
      class="renew-dialog"
    >
      <div class="renew-plans">
        <div
          v-for="plan in renewPlans"
          :key="plan.value"
          class="renew-plan"
          :class="{ active: selectedPlan === plan.value }"
          @click="selectedPlan = plan.value"
        >
          <div class="plan-header">
            <span class="plan-name">{{ plan.name }}</span>
            <span v-if="plan.recommend" class="plan-recommend">推荐</span>
          </div>
          <div class="plan-price">
            <span class="price">¥{{ plan.price }}</span>
            <span class="period">/ {{ plan.period }}</span>
          </div>
          <ul class="plan-features">
            <li v-for="feature in plan.features" :key="feature">✓ {{ feature }}</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="showRenewDialog = false">稍后再说</el-button>
        <el-button type="primary" @click="handleRenewConfirm">立即续费</el-button>
      </template>
    </el-dialog>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  TrendCharts,
  Money,
  Setting,
  Promotion,
  ArrowDown,
  ChatDotRound,
  Document,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// ============================================================
// 1. 菜单配置 — 按你的 TAOBOSS 结构
// ============================================================
const menuList = [
  // ====== 数据看板 ======
  {
    index: '/dashboard',
    label: '数据看板',
    icon: 'DataAnalysis',
    children: null,
  },

  // ====== 营销推广 ======
  {
    index: '/marketing',
    label: '营销推广',
    icon: 'Promotion',
    groups: [
      {
        name: '推广工具',
        items: [
          { index: '/marketing/recommend', label: '关联营销', icon: '🔗', desc: '智能搭配/关联营销' },
        ],
      },
    ],
  },

  // ====== 商品管理 ======
  {
    index: '/goods',
    label: '商品管理',
    icon: 'Setting',
    groups: [
      {
        name: '商品操作',
        items: [
          { index: '/goods/batch-modify', label: '批量修改', icon: '✏️', desc: '标题/价格/库存批量改' },
          { index: '/goods/schedule-stock', label: '定时修改库存', icon: '⏰', desc: '定时更新商品库存' },
          { index: '/goods/schedule-shelve', label: '定时上下架', icon: '📋', desc: '定时上架/下架商品' },
        ],
      },
    ],
  },

  // ====== 经营分析（核心） ======
  {
    index: '/analysis',
    label: '经营分析',
    icon: 'TrendCharts',
    groups: [
      {
        name: '利润看板',
        items: [
          { index: '/analysis/profit', label: '订单利润看板', icon: '💰', desc: '实时利润数据总览' },
        ],
      },
      {
        name: '成本设置',
        items: [
          { index: '/cost/item', label: '商品成本配置', icon: '📦', desc: '批量设置商品/SKU成本' },
          { index: '/cost/freight', label: '运费成本配置', icon: '🚚', desc: '快递费/包材费配置' },
          { index: '/cost/expense', label: '支出明细', icon: '💳', desc: '支付宝/微信流水导入' },
        ],
      },
      {
        name: '商品分析',
        items: [
          { index: '/analysis/product-sales', label: '商品销量统计', icon: '🏆', desc: '按商品/SKU统计销量及利润' },
          { index: '/analysis/product-refund', label: '商品退款分析', icon: '🔄', desc: '按商品/SKU统计退款金额及退款率' },
        ],
      },
      {
        name: '快递分析',
        items: [
          { index: '/analysis/express', label: '快递发货量统计', icon: '📦', desc: '统计各快递公司的发货单量' },
        ],
      },
      {
        name: '趋势分析',
        items: [
          { index: '/analysis/trend', label: '销售额趋势分析', icon: '📈', desc: '按月对比销售额/商品销售/地区分布' },
        ],
      },
    ],
  },

  // ====== 系统工具 ======
  {
    index: '/tool',
    label: '系统工具',
    icon: 'Setting',
    groups: [
      {
        name: '工具',
        items: [
          { index: '/tool/shelve-time', label: '上下架时间优化', icon: '⏱️', desc: '智能推荐最佳上下架时间' },
          { index: '/tool/feedback', label: '意见反馈', icon: '💬', desc: '提交反馈/建议' },
        ],
      },
    ],
  },
]

// ============================================================
// 2. 状态
// ============================================================
const hoverIndex = ref(null)
const showRenewDialog = ref(false)
const selectedPlan = ref('pro')

const username = ref('卖家昵称')
const trialDays = ref(306)

const renewPlans = [
  {
    value: 'basic',
    name: '基础版',
    price: 299,
    period: '年',
    features: ['基础数据分析', '商品成本管理', '批量修改工具', '7×12 客服支持'],
    recommend: false,
  },
  {
    value: 'pro',
    name: '专业版',
    price: 699,
    period: '年',
    features: ['高级利润分析', '多店铺管理', 'API 数据导出', '自动财务报表', '专属客户经理'],
    recommend: true,
  },
  {
    value: 'enterprise',
    name: '企业版',
    price: 1999,
    period: '年',
    features: ['全部高级功能', '定制化报表', '私有化部署', '7×24 专属支持', '不限店铺数'],
    recommend: false,
  },
]

// ============================================================
// 3. 计算属性
// ============================================================
const currentPath = computed(() => route.path)

// ============================================================
// 4. 方法
// ============================================================
const isActive = (item) => {
  if (!item.groups || item.groups.length === 0) {
    return currentPath.value === item.index
  }
  // 检查当前路径是否匹配该菜单下的任何子项
  for (const group of item.groups) {
    for (const child of group.items) {
      if (currentPath.value === child.index) return true
    }
  }
  return false
}

const handleMenuClick = (index) => {
  if (!index) return
  // 点击后立即关闭下拉
  hoverIndex.value = null
  router.push(index)
}

const handleParentClick = (item) => {
  if (item.groups && item.groups.length > 0) {
    // 如果当前没有激活的子项，跳转到第一个子项
    const hasActiveChild = isActive(item)
    if (!hasActiveChild) {
      const firstChild = item.groups[0].items[0]
      if (firstChild) {
        router.push(firstChild.index)
      }
    }
  }
}

const goHome = () => {
  router.push('/dashboard')
}

const handleContactService = () => {
  window.open('https://www.taobao.com/webww/ww.php?ver=3&touid=你的旺旺ID&siteid=cntaobao&status=2&charset=utf-8')
}

const handleUserClick = () => {
  ElMessage.info('个人中心')
}

const handleRenewConfirm = () => {
  ElMessage.success(`已选择 ${renewPlans.find(p => p.value === selectedPlan.value)?.name}，正在跳转支付...`)
  showRenewDialog.value = false
}
</script>

<style scoped>
/* ============================================================
   基调色：#0089FA
   ============================================================ */
.top-menu-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #0089FA;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 16px rgba(0, 137, 250, 0.25);
}

.menu-container {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 32px;
  max-width: 1600px;
  margin: 0 auto;
  gap: 24px;
}

/* ============================================================
   Logo
   ============================================================ */
.menu-left {
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.logo-icon {
  width: 36px;
  height: 36px;
  display: block;
  object-fit: contain;
  flex-shrink: 0;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
}

/* ============================================================
   一级菜单
   ============================================================ */
.menu-center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
  overflow: visible;
}

.menu-item-wrapper {
  position: relative;
  height: 64px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.menu-item {
  padding: 0 18px;
  height: 42px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.78);
  transition: all 0.2s;
  position: relative;
  white-space: nowrap;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
}

.menu-item .menu-icon {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
}

.menu-item.parent {
  padding-right: 10px;
}

.menu-item .arrow-icon {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  transition: transform 0.25s;
}

.menu-item-wrapper:hover .arrow-icon {
  transform: rotate(180deg);
  color: rgba(255, 255, 255, 0.9);
}

.active-bar {
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 0;
  height: 3px;
  background: #ffffff;
  border-radius: 4px;
  transform: translateX(-50%);
  transition: all 0.3s;
  opacity: 0;
}

.active-bar.show {
  width: 28px;
  opacity: 1;
}

.menu-item-wrapper.active .menu-item {
  color: #ffffff;
}
.menu-item-wrapper.active .menu-item .menu-icon {
  color: #ffffff;
}

/* ============================================================
   下拉面板
   ============================================================ */
.dropdown-panel {
  position: absolute;
  top: 54px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 480px;
  max-width: 560px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  padding: 10px 12px;
  z-index: 100;
  animation: dropdownIn 0.15s ease-out;
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

.dropdown-group {
  width: 100%;
}

.dropdown-group-title {
  font-size: 11px;
  font-weight: 600;
  color: #86909C;
  padding: 4px 12px 2px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.dropdown-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.dropdown-item:hover {
  background: rgba(0, 137, 250, 0.07);
}

.dropdown-item-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #F0F7FF;
  border-radius: 8px;
  flex-shrink: 0;
}

.dropdown-item-content {
  flex: 1;
  min-width: 0;
}

.dropdown-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #1D2129;
}

.dropdown-item-desc {
  font-size: 12px;
  color: #86909C;
  margin-top: 2px;
}

.dropdown-divider {
  height: 1px;
  margin: 6px 12px;
  background: #E5E6E8;
}

/* ============================================================
   右侧功能区
   ============================================================ */
.menu-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  color: rgba(255, 255, 255, 0.7);
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.service-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.icon-btn:hover .service-label {
  color: #ffffff;
}

.divider {
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.12);
}

.trial-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 16px 5px 20px;
  background: rgba(255, 255, 255, 0.10);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.trial-days strong {
  color: #ffffff;
  font-weight: 700;
}

.renew-btn {
  padding: 5px 20px;
  border: none;
  background: #ffffff;
  color: #0089FA;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
}

.renew-btn:hover {
  background: #f0f7ff;
  transform: scale(1.03);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.10);
}

.user-avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 10px 2px 2px;
  border-radius: 22px;
  cursor: pointer;
  transition: background 0.2s;
  color: rgba(255, 255, 255, 0.8);
}

.user-avatar-wrapper:hover {
  background: rgba(255, 255, 255, 0.10);
}

.user-avatar-text {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.20);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.user-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}

/* ============================================================
   续费弹窗
   ============================================================ */
.renew-plans {
  display: flex;
  gap: 12px;
  padding: 4px 0;
}

.renew-plan {
  flex: 1;
  padding: 16px;
  border: 2px solid #E5E6E8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;
}

.renew-plan:hover {
  border-color: #0089FA;
}

.renew-plan.active {
  border-color: #0089FA;
  background: rgba(0, 137, 250, 0.04);
  box-shadow: 0 0 0 4px rgba(0, 137, 250, 0.08);
}

.plan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.plan-name {
  font-size: 16px;
  font-weight: 600;
  color: #1D2129;
}

.plan-recommend {
  font-size: 11px;
  background: #0089FA;
  color: #fff;
  padding: 1px 10px;
  border-radius: 12px;
}

.plan-price .price {
  font-size: 24px;
  font-weight: 700;
  color: #0089FA;
}

.plan-price .period {
  font-size: 13px;
  color: #86909C;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
  color: #4E5969;
}

.plan-features li {
  padding: 2px 0;
}

/* ============================================================
   响应式
   ============================================================ */
@media screen and (max-width: 1200px) {
  .menu-container {
    padding: 0 16px;
    gap: 16px;
  }
  .menu-item {
    padding: 0 12px;
    font-size: 14px;
  }
  .service-label {
    display: none;
  }
  .dropdown-panel {
    min-width: 400px;
  }
}

@media screen and (max-width: 992px) {
  .menu-container {
    padding: 0 12px;
    gap: 6px;
    height: 56px;
  }
  .menu-item {
    padding: 0 10px;
    font-size: 13px;
    height: 36px;
  }
  .menu-item .menu-icon {
    font-size: 16px;
  }
  .trial-info {
    padding: 4px 12px;
    font-size: 12px;
  }
  .renew-btn {
    padding: 4px 14px;
    font-size: 12px;
  }
  .user-name {
    max-width: 40px;
  }
  .dropdown-panel {
    min-width: 340px;
    left: 0;
    transform: translateX(0);
  }
  .dropdown-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media screen and (max-width: 768px) {
  .menu-container {
    padding: 0 8px;
    gap: 4px;
    height: 50px;
  }
  .logo-text {
    font-size: 16px;
  }
  .logo-icon {
    width: 30px;
    height: 30px;
  }
  .menu-item {
    padding: 0 8px;
    font-size: 12px;
    height: 30px;
    gap: 4px;
  }
  .menu-item .menu-icon {
    font-size: 14px;
  }
  .trial-days {
    font-size: 11px;
  }
  .trial-days strong {
    font-size: 12px;
  }
  .renew-btn {
    padding: 3px 10px;
    font-size: 11px;
  }
  .user-name {
    display: none;
  }
  .divider {
    height: 18px;
  }
  .dropdown-panel {
    min-width: 280px;
    top: 44px;
    padding: 8px;
  }
  .dropdown-grid {
    grid-template-columns: 1fr;
  }
}
</style>