<!-- src/components/TopMenu/index.vue -->
<template>
    <header class="top-menu-header">
        <div class="menu-container">
            <!-- ====== 左侧：Logo ====== -->
            <div class="menu-left">
                <div class="logo" @click="goHome">
                    <img src="@/assets/logo.png" alt="淘掌柜" class="logo-icon" />
                    <span class="logo-text">淘掌柜</span>
                </div>
            </div>

            <!-- ====== 中间：菜单 ====== -->
            <nav class="menu-center">
                <div v-for="item in menuList" :key="item.index" class="menu-item-wrapper"
                    :class="{ active: isActive(item) }" @mouseenter="hoverIndex = item.index"
                    @mouseleave="hoverIndex = null">
                    <template v-if="item.children && item.children.length">
                        <div class="menu-item parent" @click="handleParentClick(item)">
                            <el-icon class="menu-icon">
                                <component :is="item.icon" />
                            </el-icon>
                            <span class="menu-label">{{ item.label }}</span>
                            <el-icon class="arrow-icon">
                                <ArrowDown />
                            </el-icon>
                            <div class="active-bar" :class="{ show: isActive(item) }"></div>
                        </div>
                        <transition name="dropdown">
                            <div v-show="hoverIndex === item.index" class="dropdown-panel">
                                <div class="dropdown-grid">
                                    <div v-for="child in item.children" :key="child.index" class="dropdown-item"
                                        @click="handleMenuClick(child.index)">
                                        <div class="dropdown-item-icon">{{ child.icon }}</div>
                                        <div class="dropdown-item-content">
                                            <div class="dropdown-item-title">{{ child.label }}</div>
                                            <div class="dropdown-item-desc">{{ child.desc || '' }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </template>

                    <template v-else>
                        <div class="menu-item" @click="handleMenuClick(item.index)">
                            <el-icon class="menu-icon">
                                <component :is="item.icon" />
                            </el-icon>
                            <span class="menu-label">{{ item.label }}</span>
                            <div class="active-bar" :class="{ show: isActive(item) }"></div>
                        </div>
                    </template>
                </div>
            </nav>

            <!-- ====== 右侧：功能区 ====== -->
            <div class="menu-right">
                <div class="icon-btn" @click="handleContactService">
                    <el-icon size="18">
                        <ChatDotRound />
                    </el-icon>
                    <span class="service-label">联系客服</span>
                </div>

                <div class="icon-btn" style="text-decoration: none; cursor: pointer;" @click="goToHelpCenter">
                    <el-icon size="18">
                        <Document />
                    </el-icon>
                    <span class="service-label">帮助文档</span>
                </div>

                <div class="divider"></div>

                <!-- 用户头像 + 昵称 -->
                <!-- <div class="user-avatar-wrapper" @click="handleUserClick">
                    <el-avatar :size="32" :src="userAvatar" class="user-avatar">
                        {{ sellerNick.charAt(0) }}
                    </el-avatar>
                    <span class="user-name">{{ sellerNick }}</span>
                </div> -->

                <div class="trial-info">
                    <span class="trial-days">剩余时间：<strong>{{ trialDays }}</strong> 天</span>
                    <button class="renew-btn" @click="handleRenew">续费/升级</button>
                    <!-- <button class="renew-btn" @click="showRenewDialog = true">续费升级</button> -->
                </div>
            </div>
        </div>

        <!-- ====== 续费弹窗 ====== -->
        <el-dialog v-model="showRenewDialog" title="续费升级" width="520px" :close-on-click-modal="false"
            class="renew-dialog">
            <div class="renew-plans">
                <div v-for="plan in renewPlans" :key="plan.value" class="renew-plan"
                    :class="{ active: selectedPlan === plan.value }" @click="selectedPlan = plan.value">
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
import { ref, computed, onMounted } from 'vue'
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
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// ============================================================
// 1. 菜单配置（一级用 Element Plus 图标，二级用 emoji）
// ============================================================
const menuList = [
    {
        index: '/index',
        label: '工作台',
        icon: 'Monitor',
        children: null,
    },
    {
        index: '/statistics',
        label: '分析',
        icon: 'TrendCharts',
        children: [
            { index: '/statistics/order-sales-trend-analysis', label: '订单销售趋势分析/对比', icon: '📈', desc: '按月/年对比订单销售趋势' },
            { index: '/statistics/item-sales-trend-analysis', label: '商品销售趋势分析/对比', icon: '📊', desc: '按月/年对比商品销售趋势' },
            { index: '/statistics/region-sales-analysis', label: '买家地区分析', icon: '🌍', desc: '全国各省份销售分布' },
            { index: '/statistics/item-refund-analysis', label: '商品退款分析', icon: '↩️', desc: '按商品/SKU统计退款金额及退款率' },
            { index: '/statistics/express-shipment-stat', label: '快递发货量统计', icon: '📦', desc: '统计各快递公司的发货单量' },
        ],
    },
    {
        index: '/profit',
        label: '订单&利润',
        icon: 'Money',
        children: [
            { index: '/statistics/order-profit', label: '订单&利润统计', icon: '💰', desc: '按订单统计成本及利润' },
            { index: '/statistics/item-sales-analysis', label: '商品&利润统计', icon: '🏆', desc: '按商品/SKU统计成本及利润' },
        ],
    },
    {
        index: '/cost',
        label: '成本',
        icon: 'Coin',
        children: [
            { index: '/cost/item-cost-manage', label: '商品成本配置', icon: '📦', desc: '批量设置商品/SKU成本' },
            { index: '/cost/freight-cost-config', label: '运费成本配置', icon: '🚚', desc: '配置运费计算方式和价格规则' },
            { index: '/cost/expense', label: '支出明细', icon: '💳', desc: '支付宝/微信流水导入' },
        ],
    },
    {
        index: '/marketing',
        label: '营销',
        icon: 'Promotion',
        children: [
            { index: '/recommend/new?tab=system', label: '关联营销-新建活动', icon: '✨', desc: '利用模板自动生成关联营销' },
            { index: '/recommend/new?tab=custom', label: '关联营销-自定义图片', icon: '🖼️', desc: '上传活动图片批量发布到商品' },
            { index: '/recommend/new?tab=map', label: '关联营销-自定义热区', icon: '🎯', desc: '用热区制作复杂图片活动批量发布到商品' },
            { index: '/recommend/list', label: '关联营销-活动列表', icon: '📋', desc: '管理所有关联营销活动' },
        ],
    },
    {
        index: '/tools',
        label: '工具',
        icon: 'Setting',
        children: [
            { index: '/batch-update/title', label: '批量修改', icon: '✏️', desc: '标题/价格/库存批量改' },
            { index: '/timing-list-delist/list', label: '定时上下架', icon: '⏰', desc: '定时上架/下架商品' },
            { index: '/delist-optimize/list', label: '上下架时间优化🔥', icon: '📋', desc: '自动上下架时间修改到流量高峰时段' },
            { index: '/item-timing-update-quantity/list', label: '定时修改库存', icon: '📦', desc: '定时更新商品库存' },
            { index: '/widget/blacklist', label: '黑名单', icon: '🚫', desc: '可以阻止恶意买家下单' },
            { index: '/widget/rate-auto-reply', label: '评价自动回复', icon: '💬', desc: '评价自动回复，增加用户粘性' },
            { index: '/widget/rate-alarm', label: '中差评提醒', icon: '🔔', desc: '中差评自动预警通知' },
            { index: '/widget/auto-rate', label: '自动评价', icon: '⭐', desc: '买家评价后自动好评回复，支持定时评价' },
            { index: '/widget/profit-calc', label: '利润计算器', icon: '🧮', desc: '快速计算单品利润' },
        ],
    },
]

// ============================================================
// 2. 状态
// ============================================================
const hoverIndex = ref(null)
const showRenewDialog = ref(false)
const selectedPlan = ref('pro')

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
    if (!item.children || item.children.length === 0) {
        return currentPath.value === item.index
    }
    return item.children.some((child) => currentPath.value === child.index)
}

const handleMenuClick = (index) => {
    if (!index) return
    hoverIndex.value = null
    const parent = menuList.find((m) => m.index === index && m.children && m.children.length > 0)
    if (parent) {
        router.push(parent.children[0].index)
        return
    }
    router.push(index)
}

const handleParentClick = (item) => {
    if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some((child) => currentPath.value === child.index)
        if (!hasActiveChild) {
            router.push(item.children[0].index)
        }
    }
}

const goHome = () => {
    router.push('/index')
}

const handleContactService = () => {
    window.open('https://www.taobao.com/webww/ww.php?ver=3&touid=andyli_cool&siteid=cntaobao&status=2&charset=utf-8')
}

const goToHelpCenter = () => {
    router.push('/help')
}

const handleUserClick = () => {
    ElMessage.info('个人中心')
}

const handleRenewConfirm = () => {
    ElMessage.success(`已选择 ${renewPlans.find(p => p.value === selectedPlan.value)?.name}，正在跳转支付...`)
    showRenewDialog.value = false
}

const handleRenew = () => {
    window.open(
        'https://fuwu.taobao.com/ser/detail.htm?service_code=ts-1816190&code=ts-1816190&selected_item_code=ts-1816190&isOpenSkuDialog=1',
        '_blank'
    )
}

// ============================================================
// 用户信息
// ============================================================
const userInfo = ref(null)
const sellerNick = ref('')
const shopTitle = ref('')
const userAvatar = ref('')
const trialDays = ref(0)

// 获取用户信息并计算剩余天数
const loadUserInfo = () => {
    try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            userInfo.value = JSON.parse(userStr)
            sellerNick.value = userInfo.value.seller_nick || '卖家昵称'
            shopTitle.value = userInfo.value.title || ''
            userAvatar.value = userInfo.value.pic_path || ''

            // 计算剩余天数
            if (userInfo.value.subscribe_deadline) {
                const deadline = new Date(userInfo.value.subscribe_deadline)
                const now = new Date()
                const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
                trialDays.value = diff > 0 ? diff : 0
            }
        }
    } catch (error) {
        console.error('获取用户信息失败:', error)
    }
}

onMounted(() => {
    loadUserInfo()
})
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
    object-fit: contain;
    /* 保持比例，不拉伸 */
    flex-shrink: 0;
    /* 防止被压缩 */
}

.logo-text {
    font-size: 22px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.5px;
}

/* ============================================================
   一级菜单 — 使用 Element Plus 图标
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
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    transition: transform 0.25s;
}

.menu-item-wrapper:hover .arrow-icon {
    transform: rotate(180deg);
    color: rgba(255, 255, 255, 0.7);
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
   二级菜单下拉 — 使用 emoji
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
    white-space: nowrap;
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
    background: rgba(255, 255, 255, 0.15);
}

.trial-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 16px 5px 20px;
    /* background: rgba(255, 255, 255, 0.10);
    border-radius: 18px; */
    /* border: 1px solid rgba(255, 255, 255, 0.08); */
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
}

.trial-days strong {
    color: #ffffff;
    font-weight: 700;
}

.renew-btn {
    border: none;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s;
    background: #f46615;
    color: #fff;
    border-radius: 5px;
}

.renew-btn:hover {
    background: #d45a12;
    color: #fff;
    transform: scale(1.03);
    box-shadow: 0 2px 12px rgba(244, 102, 21, 0.35);
}

.user-avatar-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 8px 2px 2px;
    border-radius: 20px;
    cursor: pointer;
    transition: background 0.2s;
}

.user-avatar {
    border: 2px solid rgba(255, 255, 255, 0.2);
}

.user-name {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
    max-width: 80px;
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
        min-width: 320px;
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
        font-size: 16px;
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
        min-width: 260px;
        top: 44px;
        padding: 8px;
    }

    .dropdown-grid {
        grid-template-columns: 1fr;
    }
}
</style>