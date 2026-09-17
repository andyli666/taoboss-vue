<template>
    <div class="dashboard">
        <!-- ====== 顶部标题栏 ====== -->
        <div class="dashboard-header">
            <div class="header-left">
                <h2>📊 工作台</h2>
            </div>
            <div class="header-right">
                <el-button type="primary" :icon="Refresh" @click="refreshData">刷新</el-button>
            </div>
        </div>

        <!-- ====== 成本配置引导条 ====== -->
        <el-alert v-if="showCostGuide" title="完善成本配置" type="warning" :closable="true" show-icon class="cost-guide-alert"
            @close="handleGuideClose">
            <template #default>
                <span>
                    {{ costGuideMessage }}
                    <el-button type="primary" size="small" plain @click="goToCostConfig" style="margin-left: 12px;">
                        {{ costGuideButtonText }}
                    </el-button>
                </span>
            </template>
        </el-alert>

        <!-- ====== 订单同步状态横幅 ====== -->
        <el-alert v-if="syncStatus.showBanner" :type="syncStatus.isCompleted ? 'success' : 'info'" :closable="true"
            show-icon class="sync-status-alert" @close="closeSyncBanner">
            <template #title>
                <div class="sync-status-content">
                    <span>{{ syncStatus.message }}</span>
                    <el-progress v-if="syncStatus.isSyncing" :percentage="syncStatus.progress" :stroke-width="6"
                        style="width: 200px; margin-left: 16px;" />
                </div>
            </template>
        </el-alert>

        <!-- ====== KPI 卡片 ====== -->
        <el-row :gutter="16" class="kpi-row">
            <el-col :xs="12" :sm="12" :md="6" v-for="kpi in kpiList" :key="kpi.label">
                <div class="kpi-card" :class="kpi.class">
                    <div class="kpi-icon">{{ kpi.icon }}</div>
                    <div class="kpi-content">
                        <div class="kpi-label">{{ kpi.label }}</div>
                        <div class="kpi-value">{{ kpi.value }}</div>
                        <div class="kpi-trend" :class="kpi.trend > 0 ? 'up' : kpi.trend < 0 ? 'down' : 'flat'">
                            <span v-if="kpi.trend > 0">↑ {{ kpi.trend }}%</span>
                            <span v-else-if="kpi.trend < 0">↓ {{ Math.abs(kpi.trend) }}%</span>
                            <span v-else>- 0%</span>
                            <span class="kpi-sub">{{ kpi.sub || '' }}</span>
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>

        <!-- ====== 主内容区：左图表 + 右排行 ====== -->
        <el-row :gutter="16" class="main-row">
            <el-col :xs="24" :lg="16">
                <el-card class="chart-card" shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>📈 销售 &amp; 利润趋势</span>
                            <el-radio-group v-model="trendRange" size="small" @change="handleTrendChange">
                                <el-radio-button value="7">近7天</el-radio-button>
                                <el-radio-button value="30">近30天</el-radio-button>
                                <el-radio-button value="90">近90天</el-radio-button>
                            </el-radio-group>
                        </div>
                    </template>
                    <div class="chart-container" ref="chartRef"></div>
                </el-card>
            </el-col>

            <el-col :xs="24" :lg="8">
                <el-card class="rank-card" shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>🏆 商品利润排行</span>
                            <el-button type="text" @click="goToAnalysis">查看全部 →</el-button>
                        </div>
                    </template>
                    <div class="rank-list">
                        <div v-for="(item, index) in rankList" :key="item.id" class="rank-item">
                            <div class="rank-index" :class="getRankClass(index)">
                                {{ index + 1 }}
                            </div>
                            <!-- 👇 新增商品图片 -->
                            <div class="rank-image" v-if="item.pic_url">
                                <el-image :src="item.pic_url" fit="cover"
                                    style="width: 36px; height: 36px; border-radius: 4px;">
                                    <template #error>
                                        <div style="width:36px;height:36px;background:#f5f5f5;border-radius:4px;"></div>
                                    </template>
                                </el-image>
                            </div>
                            <div class="rank-info">
                                <div class="rank-title">{{ item.title }}</div>
                                <div class="rank-sku">{{ item.sku }}</div>
                            </div>
                            <div class="rank-profit">
                                <div class="rank-price">¥{{ item.profit }}</div>
                                <!-- 没有变化率，暂时隐藏 -->
                                <!-- <div class="rank-change" :class="item.change > 0 ? 'up' : 'down'">
            {{ item.change > 0 ? '↑' : '↓' }} {{ Math.abs(item.change) }}%
        </div> -->
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- ====== 快捷操作区 ====== -->
        <el-card class="quick-actions" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span>🚀 快捷操作</span>
                </div>
            </template>
            <el-row :gutter="16">
                <el-col :xs="12" :sm="12" :md="6" v-for="action in quickActions" :key="action.label">
                    <div class="action-item" @click="action.handle">
                        <div class="action-icon">{{ action.icon }}</div>
                        <div class="action-content">
                            <div class="action-label">{{ action.label }}</div>
                            <div class="action-desc">{{ action.desc }}</div>
                        </div>
                        <el-icon class="action-arrow">
                            <ArrowRight />
                        </el-icon>
                    </div>
                </el-col>
            </el-row>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, ArrowRight } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getKpi, getTradeStatistics, getSyncStatus } from '@/api/trade'
import { getItemSalesAnalysis } from '@/api/stat'
import { checkCostHasRecords, getItemsWithoutCostCount } from '@/api/cost'
import { checkFreightConfigured } from '@/api/freight'
import { checkExpenseHasRecords } from '@/api/expense'
import { getItemsWithoutActivityCount } from '@/api/recommend'

// ==================== ECharts 按需引入 ====================
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必需的组件
echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    LineChart,
    CanvasRenderer
])

const router = useRouter()

// ============================================================
// 成本配置引导
// ============================================================
const showCostGuide = ref(false)
const costGuideMessage = ref('配置商品成本、运费成本和导入支出流水后，利润统计才能精准计算。')
const costGuideButtonText = ref('立即配置 →')
const costGuidePath = ref('/cost/item-cost-manage')

const goToCostConfig = () => {
    router.push(costGuidePath.value)
}

// ============================================================
// 成本配置检查
// ============================================================
const checkCostConfig = async () => {
    try {
        // 并行请求三个接口检查配置状态
        const [itemRes, freightRes, expenseRes] = await Promise.all([
            // 1. 检查商品成本
            checkCostHasRecords().catch(() => ({ data: { data: { has_records: false } } })),
            // 2. 检查运费配置
            checkFreightConfigured().catch(() => ({ data: { data: { configured: false } } })),
            // 3. 检查支出流水
            checkExpenseHasRecords().catch(() => ({ data: { data: { has_records: false } } }))
        ])

        // 判断各项是否已配置（统一从 res.data.data 中取值）
        const hasItemCost = itemRes.data?.data?.has_records || false
        const hasFreightCost = freightRes.data?.data?.configured || false
        const hasExpense = expenseRes.data?.data?.has_records || false

        // 构建未配置项列表
        const unconfiguredItems = []
        if (!hasItemCost) unconfiguredItems.push('商品成本')
        if (!hasFreightCost) unconfiguredItems.push('运费成本')
        if (!hasExpense) unconfiguredItems.push('支出流水')

        if (unconfiguredItems.length > 0) {
            showCostGuide.value = true
            costGuideMessage.value = `您还未配置/导入${unconfiguredItems.join('、')}，利润统计可能不准确，请尽快完善。`
            costGuideButtonText.value = `去配置/导入${unconfiguredItems[0]}`
            // 设置跳转路径：优先跳转到第一个未配置项
            if (!hasItemCost) {
                costGuidePath.value = '/cost/item-cost-manage'
            } else if (!hasFreightCost) {
                costGuidePath.value = '/cost/freight-cost-config'
            } else if (!hasExpense) {
                costGuidePath.value = '/cost/expense'
            }
        } else {
            showCostGuide.value = false
        }

    } catch (error) {
        console.error('检查成本配置失败:', error)
        // 接口报错时默认显示引导条
        showCostGuide.value = true
        costGuideMessage.value = '检查成本配置失败，请手动确认配置是否完整'
        costGuideButtonText.value = '去配置'
        costGuidePath.value = '/cost/item-cost-manage'
    }
}

const handleGuideClose = () => {
    showCostGuide.value = false
}

// ============================================================
// KPI 数据（对接真实接口）
// ============================================================
const kpiList = ref([
    { icon: '💰', label: '今日利润', value: '¥12,847', trend: 8.3, sub: '较昨日', class: 'profit' },
    { icon: '💳', label: '今日销售额', value: '¥38,490', trend: 6.7, sub: '较昨日', class: 'revenue' },
    { icon: '📦', label: '今日订单', value: '1,283 单', trend: 5.2, sub: '较昨日', class: 'order' },
    { icon: '✅', label: '今日确认收货', value: '¥0', trend: 0, sub: '较昨日', class: 'confirmed' },
])

// ============================================================
// 商品排行数据
// ============================================================
const rankList = ref([
    { id: 1, title: '复古碎花连衣裙', sku: 'SKU-001', profit: '3,200', change: 12 },
    { id: 2, title: '宽松休闲T恤', sku: 'SKU-002', profit: '2,100', change: 8 },
    { id: 3, title: '高腰阔腿裤', sku: 'SKU-003', profit: '1,800', change: -3 },
    { id: 4, title: '真丝围巾', sku: 'SKU-004', profit: '1,200', change: 5 },
    { id: 5, title: '草编遮阳帽', sku: 'SKU-005', profit: '900', change: -2 },
])

const getRankClass = (index) => {
    if (index === 0) return 'gold'
    if (index === 1) return 'silver'
    if (index === 2) return 'bronze'
    return ''
}

// ============================================================
// 4. 快捷操作
// ============================================================
const quickActions = ref([
    {
        icon: '📊',
        label: '利润分析',
        desc: '查看详细利润报表',
        handle: () => router.push('/statistics/order-profit')
    },
    {
        icon: '✏️',
        label: '商品成本设置',
        desc: '',
        handle: () => router.push({
            path: '/cost/item-cost-manage',
            query: {
                status: 'onsale',
                costStatus: 'notSet'
            }
        })
    },
    {
        icon: '🔗',
        label: '关联营销',
        desc: '3个商品可优化搭配',
        handle: () => router.push('/recommend/list')
    },
    {
        icon: '⏰',
        label: '上下架时间优化',
        desc: '查看当前上下架时间分布',
        handle: () => router.push('/delist-optimize/distribution')
    },
])

// ============================================================
// 5. ECharts 趋势图
// ============================================================
const chartRef = ref(null)
let chartInstance = null
const trendRange = ref('7')
const chartData = ref({ xAxis: [], sales: [], profits: [] })

const handleTrendChange = () => {
    loadTrendData()
    loadRankingData()
}

const refreshData = () => {
    ElMessage.info('正在刷新数据...')
    Promise.all([
        loadTodayKpiData(),
        loadTrendData(),
        loadRankingData(),
        checkCostConfig(),
        loadQuickActionBadges()
    ]).then(() => {
        ElMessage.success('数据已刷新')
    }).catch(() => {
        ElMessage.error('部分数据加载失败')
    })
}

const goToAnalysis = () => {
    router.push('/statistics/item-sales-analysis')
}

// ============================================================
// 加载今日 KPI 数据
// ============================================================
const loadTodayKpiData = async () => {
    try {
        const today = dayjs().format('YYYY-MM-DD')
        const params = {
            granularity: 'day',
            time_field: 'pay_time',
            start_date: today,
            end_date: today
        }

        const res = await getKpi()
        const data = res.data.data

        kpiList.value[0].value = `¥${data.profit.value.toFixed(2)}`
        kpiList.value[0].trend = data.profit.trend

        kpiList.value[1].value = `¥${data.payment.value.toFixed(2)}`
        kpiList.value[1].trend = data.payment.trend

        kpiList.value[2].value = `${data.orders.value} 单`
        kpiList.value[2].trend = data.orders.trend

        kpiList.value[3].value = `¥${data.confirmed.value.toFixed(2)}`
        kpiList.value[3].trend = data.confirmed.trend

    } catch (error) {
        console.error('加载今日KPI数据失败:', error)
        ElMessage.error('加载今日数据失败')
    }
}
// ============================================================
// 加载趋势图数据
// ============================================================
const loadTrendData = async () => {
    try {
        const days = parseInt(trendRange.value)
        const endDate = dayjs()
        const startDate = dayjs().subtract(days - 1, 'day')

        const params = {
            granularity: 'day',
            time_field: 'pay_time',
            start_date: startDate.format('YYYY-MM-DD'),
            end_date: endDate.format('YYYY-MM-DD')
        }

        const response = await getTradeStatistics(params)
        const data = response.data.data

        // 从 period_details 提取数据
        const details = data.period_details || []
        chartData.value = {
            xAxis: details.map(item => item.period_label || ''),
            sales: details.map(item => item.amount || 0),
            profits: details.map(item => item.profit || 0)
        }

        renderChart()
    } catch (error) {
        console.error('加载趋势数据失败:', error)
        ElMessage.error('加载趋势数据失败')
    }
}
const renderChart = () => {
    if (!chartRef.value) return
    if (chartInstance) chartInstance.dispose()

    chartInstance = echarts.init(chartRef.value)

    const xData = chartData.value.xAxis.length ? chartData.value.xAxis : ['暂无数据']
    const salesData = chartData.value.sales.length ? chartData.value.sales : [0]
    const profitsData = chartData.value.profits.length ? chartData.value.profits : [0]

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            formatter: function (params) {
                let html = `<div style="font-weight:600;">${params[0].axisValue}</div>`
                params.forEach(p => {
                    html += `<div>${p.marker} ${p.seriesName}: ¥${p.value.toFixed(2)}</div>`
                })
                return html
            }
        },
        legend: {
            data: ['销售额', '利润'],
            top: 0,
            right: 0
        },
        grid: {
            left: 50,
            right: 30,
            top: 50,
            bottom: 30
        },
        xAxis: {
            type: 'category',
            data: xData,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 11 }
        },
        yAxis: {
            type: 'value',
            name: '金额 (元)',
            nameTextStyle: { fontSize: 11, color: '#86909C' },
            splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
            axisLabel: {
                fontSize: 11,
                formatter: function (value) {
                    if (value >= 10000) return (value / 10000).toFixed(0) + '万'
                    return value
                }
            }
        },
        series: [
            {
                name: '销售额',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: { color: '#0089FA', width: 2 },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(0, 137, 250, 0.25)' },
                        { offset: 1, color: 'rgba(0, 137, 250, 0.02)' }
                    ])
                },
                data: salesData
            },
            {
                name: '利润',
                type: 'line',
                smooth: true,
                symbol: 'diamond',
                symbolSize: 8,
                lineStyle: { color: '#f46615', width: 2 },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(244, 102, 21, 0.20)' },
                        { offset: 1, color: 'rgba(244, 102, 21, 0.02)' }
                    ])
                },
                data: profitsData
            }
        ]
    }

    chartInstance.setOption(option)
    chartInstance.resize()
}

// ============================================================
// 加载商品排行（使用 getItemSalesAnalysis）
// ============================================================
const loadRankingData = async () => {
    try {
        const days = parseInt(trendRange.value)
        const endDate = dayjs()
        const startDate = dayjs().subtract(days - 1, 'day')

        const params = {
            page: 1,
            page_size: 5,
            time_type: 'day',
            start_date: startDate.format('YYYY-MM-DD'),
            end_date: endDate.format('YYYY-MM-DD'),
            num_iid: '',
            outer_iid: '',
            is_special: '',
            sort_field: 'total_profit',
            sort_order: 'desc'
        }

        const res = await getItemSalesAnalysis(params)
        if (res.data.code === 200) {
            const list = res.data.data.list || []
            rankList.value = list.map((item) => {
                // 获取 sku_list，按利润降序排序
                const skuList = (item.sku_list || []).slice() // 复制数组，避免修改原数据
                skuList.sort((a, b) => (b.profit || 0) - (a.profit || 0))

                // 取利润最高的第一个 SKU
                const topSku = skuList.length > 0 ? skuList[0] : null

                return {
                    id: item.num_iid,
                    num_iid: item.num_iid,
                    title: item.title || '未知商品',
                    sku: topSku?.properties_name || item.outer_iid || `ID:${item.num_iid}`,
                    profit: item.total_profit?.toFixed(0) || '0',
                    pic_url: item.pic_url || ''
                }
            })
        }
    } catch (error) {
        console.error('加载排行数据失败:', error)
    }
}

// 加载快捷操作角标
const loadQuickActionBadges = async () => {
    try {
        // 关联营销 - 未发布商品数
        const recommendRes = await getItemsWithoutActivityCount()
        quickActions.value[2].desc = `${recommendRes.data.data?.count || 0} 个商品可发布关联营销`

        // 商品成本设置 - 未设置成本商品数
        const costRes = await getItemsWithoutCostCount()
        quickActions.value[1].desc = `${costRes.data.data?.count || 0} 个出售中商品/SKU未配置生效成本`

    } catch (error) {
        console.error('加载快捷操作角标失败:', error)
    }
}

// ============================================================
// 定时刷新
// ============================================================
const refreshInterval = ref(null)
const REFRESH_INTERVAL = 600000  // 600秒，单位毫秒

// 启动定时刷新
const startAutoRefresh = () => {
    if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
    }
    refreshInterval.value = setInterval(() => {
        // 静默刷新，不显示提示
        refreshDataSilent()
    }, REFRESH_INTERVAL)
}

// 静默刷新（不显示 Loading 提示）
const refreshDataSilent = async () => {
    try {
        await Promise.all([
            loadTodayKpiData(),
            loadTrendData(),
            loadRankingData(),
            checkCostConfig(),
            loadQuickActionBadges()
        ])
    } catch (error) {
        console.error('定时刷新失败:', error)
    }
}

// 停止定时刷新
const stopAutoRefresh = () => {
    if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
    }
}

// ============================================================
// 订单同步状态
// ============================================================
const SYNC_SHOWN_KEY = 'taoboss_sync_shown'
const syncStatus = ref({
    isSyncing: false,      // 是否同步中
    isCompleted: false,    // 是否已完成
    progress: 0,           // 进度 0-100
    message: '',           // 状态消息
    showBanner: false      // 是否显示横幅
})

// 检查是否已经显示过同步完成
const hasSyncBeenShown = () => {
    return localStorage.getItem(SYNC_SHOWN_KEY) === 'true'
}

// 标记同步已完成显示
const markSyncAsShown = () => {
    localStorage.setItem(SYNC_SHOWN_KEY, 'true')
}

let syncPollTimer = null   // 轮询定时器
// ============================================================
// 订单同步状态检查
// ============================================================

// 检查同步状态
const checkSyncStatus = async () => {
    try {
        const res = await getSyncStatus()
        const data = res.data.data

        if (data) {
            syncStatus.value.isSyncing = data.is_syncing || false
            syncStatus.value.isCompleted = data.is_completed || false
            syncStatus.value.progress = data.progress || 0
            syncStatus.value.message = data.message || ''

            // 只有在未显示过的情况下才展示横幅
            const alreadyShown = hasSyncBeenShown()

            // 如果已完成且已显示过，不再显示
            if (data.is_completed && alreadyShown) {
                syncStatus.value.showBanner = false
                stopSyncPolling()
                return
            }

            // 显示横幅
            syncStatus.value.showBanner = true

            // 如果同步完成，标记已显示，3秒后自动隐藏
            if (data.is_completed) {
                markSyncAsShown()  // 👈 标记已显示

                // ✅ 同步完成后静默刷新数据（不显示加载提示）
                await refreshDataSilent()

                // // 显示横幅 30 秒后自动关闭
                // setTimeout(() => {
                //     syncStatus.value.showBanner = false
                // }, 30000)
                stopSyncPolling()
            }

            // 如果还在同步中，继续轮询
            if (data.is_syncing) {
                startSyncPolling()
            }
        }
    } catch (error) {
        console.error('获取同步状态失败:', error)
        // 接口报错时隐藏横幅
        syncStatus.value.showBanner = false
    }
}

// 启动轮询
const startSyncPolling = () => {
    if (syncPollTimer) {
        clearInterval(syncPollTimer)
    }
    syncPollTimer = setInterval(() => {
        checkSyncStatus()
    }, 3000)  // 每3秒轮询一次
}

// 停止轮询
const stopSyncPolling = () => {
    if (syncPollTimer) {
        clearInterval(syncPollTimer)
        syncPollTimer = null
    }
}

// 关闭横幅
const closeSyncBanner = () => {
    syncStatus.value.showBanner = false
    stopSyncPolling()
    // 关闭时也标记为已显示
    if (syncStatus.value.isCompleted) {
        markSyncAsShown()
    }
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
    nextTick(() => {
        // 首次并行加载所有数据
        Promise.all([
            loadTodayKpiData(),
            loadTrendData(),
            loadRankingData(),
            checkCostConfig(),
            loadQuickActionBadges(),
            checkSyncStatus()
        ]).then(() => {
            // 所有数据加载完成后渲染图表
            renderChart()
            // 数据加载完成后启动定时刷新
            startAutoRefresh()
        })
    })

    // 页面可见性变化时处理（用户切换标签页后回来）
    document.addEventListener('visibilitychange', handleVisibilityChange)

    window.addEventListener('resize', () => {
        chartInstance?.resize()
    })
})

onUnmounted(() => {
    // 清理定时器
    stopAutoRefresh()
    stopSyncPolling()
    document.removeEventListener('visibilitychange', handleVisibilityChange)

    window.removeEventListener('resize', () => {
        chartInstance?.resize()
    })
    chartInstance?.dispose()
})

// 页面可见性变化处理
const handleVisibilityChange = () => {
    if (document.hidden) {
        // 页面隐藏时停止刷新（节省资源）
        stopAutoRefresh()
    } else {
        // 页面重新可见时立即刷新一次，然后恢复定时
        refreshDataSilent()
        startAutoRefresh()
    }
}
</script>

<style scoped>
.dashboard {
    padding: 20px 24px;
    background: #f5f7fa;
    min-height: calc(100vh - 64px);
}

/* ====== 顶部标题栏 ====== */
.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;
}

.dashboard-header h2 {
    font-size: 20px;
    font-weight: 600;
    color: #1D2129;
    margin: 0;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

/* ====== KPI 卡片 ====== */
.kpi-row {
    margin-bottom: 16px;
}

.kpi-card {
    background: #fff;
    border-radius: 12px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    transition: all 0.3s;
    height: 88px;
}

.kpi-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.kpi-icon {
    font-size: 28px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    flex-shrink: 0;
}

.kpi-card.profit .kpi-icon {
    background: rgba(244, 102, 21, 0.10);
}

.kpi-card.revenue .kpi-icon {
    background: rgba(0, 137, 250, 0.10);
}

.kpi-card.order .kpi-icon {
    background: rgba(0, 200, 150, 0.10);
}

.kpi-card.confirmed .kpi-icon {
    background: rgba(0, 200, 150, 0.10);
    font-size: 23px;
}

.kpi-content {
    flex: 1;
    min-width: 0;
}

.kpi-label {
    font-size: 13px;
    color: #86909C;
    margin-bottom: 2px;
}

.kpi-value {
    font-size: 22px;
    font-weight: 700;
    color: #1D2129;
    line-height: 1.3;
}

.kpi-trend {
    font-size: 12px;
    margin-top: 2px;
}

.kpi-trend.up {
    color: #00A854;
}

.kpi-trend.down {
    color: #F56C6C;
}

.kpi-trend.flat {
    color: #86909C;
}

.kpi-sub {
    color: #86909C;
    font-weight: 400;
}

/* ====== 主内容区 ====== */
.main-row {
    margin-bottom: 16px;
}

.chart-card,
.rank-card {
    border-radius: 12px;
    border: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.chart-card :deep(.el-card__header),
.rank-card :deep(.el-card__header) {
    border-bottom: 1px solid #f0f0f0;
    padding: 14px 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    color: #1D2129;
}

.card-header .el-button--text {
    font-weight: 500;
    color: #0089FA;
}

.chart-container {
    height: 280px;
    width: 100%;
}

/* ====== 排行列表 ====== */
.rank-list {
    padding: 0 4px;
}

.rank-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #f5f5f5;
}

.rank-item:last-child {
    border-bottom: none;
}

.rank-index {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
    color: #86909C;
    background: #f5f5f5;
    flex-shrink: 0;
}

.rank-index.gold {
    background: #FFD700;
    color: #fff;
}

.rank-index.silver {
    background: #C0C0C0;
    color: #fff;
}

.rank-index.bronze {
    background: #CD7F32;
    color: #fff;
}

.rank-info {
    flex: 1;
    min-width: 0;
}

.rank-title {
    font-size: 14px;
    font-weight: 500;
    color: #1D2129;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.rank-sku {
    font-size: 12px;
    color: #86909C;
}

.rank-profit {
    text-align: right;
    flex-shrink: 0;
}

.rank-price {
    font-size: 15px;
    font-weight: 600;
    color: #1D2129;
}

.rank-change {
    font-size: 12px;
}

.rank-change.up {
    color: #00A854;
}

.rank-change.down {
    color: #F56C6C;
}

.rank-image {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 4px;
    overflow: hidden;
}

/* ====== 快捷操作区 ====== */
.quick-actions {
    border-radius: 12px;
    border: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.quick-actions :deep(.el-card__header) {
    border-bottom: 1px solid #f0f0f0;
    padding: 14px 20px;
}

.action-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 10px;
    background: #f7f8fa;
    cursor: pointer;
    transition: all 0.25s;
}

.action-item:hover {
    background: rgba(0, 137, 250, 0.06);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.action-icon {
    font-size: 28px;
    flex-shrink: 0;
}

.action-content {
    flex: 1;
    min-width: 0;
}

.action-label {
    font-size: 14px;
    font-weight: 600;
    color: #1D2129;
}

.action-desc {
    font-size: 12px;
    color: #86909C;
    margin-top: 1px;
}

.action-arrow {
    font-size: 16px;
    color: #C9CDD4;
    transition: transform 0.25s;
}

.action-item:hover .action-arrow {
    color: #0089FA;
    transform: translateX(4px);
}

.cost-guide-alert {
    margin-bottom: 16px;
    border-radius: 8px;
}

.cost-guide-alert :deep(.el-alert__content) {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.cost-guide-alert :deep(.el-alert__title) {
    font-weight: 600;
    color: #E6A23C;
}

/* ====== 同步状态横幅 ====== */
.sync-status-alert {
    margin-bottom: 16px;
    border-radius: 8px;
}

.sync-status-alert :deep(.el-alert__content) {
    width: 100%;
}

.sync-status-content {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
}

/* ============================================================
   响应式
   ============================================================ */
@media screen and (max-width: 992px) {
    .dashboard {
        padding: 16px;
    }

    .kpi-card {
        height: 76px;
        padding: 14px 16px;
    }

    .kpi-value {
        font-size: 18px;
    }
}

@media screen and (max-width: 768px) {
    .dashboard {
        padding: 12px;
    }

    .dashboard-header h2 {
        font-size: 17px;
    }

    .kpi-card {
        height: 68px;
        padding: 12px 14px;
    }

    .kpi-icon {
        font-size: 22px;
        width: 40px;
        height: 40px;
    }

    .kpi-value {
        font-size: 16px;
    }

    .chart-container {
        height: 200px;
    }

    .action-item {
        padding: 10px 12px;
    }

    .action-icon {
        font-size: 22px;
    }
}
</style>