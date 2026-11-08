<template>
    <div class="workbench">
        <!-- ====== 顶部欢迎条 ====== -->
        <div class="wb-header">
            <div class="wb-user">
                <el-avatar :size="42" :src="user.picPath" />
                <div class="wb-user-info">
                    <!-- <div class="wb-title">运营工作台</div> -->
                    <div class="wb-sub">你好，{{ user.title || '掌柜' }}，祝今日大卖，财源滚滚</div>
                </div>
            </div>
            <!-- <div class="wb-meta">
                <span>版本：{{ user.articleItemName || '-' }}</span>
                <span>到期：{{ deadlineText }}</span>
                <el-button size="small" :icon="Refresh" @click="refreshAll">刷新</el-button>
            </div> -->
        </div>

        <!-- ====== 订单同步状态 ====== -->
        <el-alert v-if="syncStatus.showBanner" :type="syncStatus.isCompleted ? 'success' : 'info'" :closable="true"
            show-icon class="sync-alert" @close="closeSyncBanner">
            <template #title>
                <div class="sync-content">
                    <span>{{ syncStatus.message }}</span>
                    <el-progress v-if="syncStatus.isSyncing" :percentage="syncStatus.progress" :stroke-width="6"
                        style="width: 200px;" />
                </div>
            </template>
        </el-alert>

        <!-- ====== ① 批量修改（首屏主推） ====== -->
        <section class="wb-section primary-section">
            <div class="section-head">
                <div class="section-title">
                    批量修改
                    <span class="tag-brand">推荐使用</span>
                </div>
                <div class="section-desc">支持范围修改 · 列表修改 · 定时执行</div>
            </div>

            <div class="batch-layout">
                <div class="module-grid">
                    <div v-for="m in batchModules" :key="m.path" class="module-card" @click="goBatch(m)">
                        <div class="module-icon">{{ m.icon }}</div>
                        <div class="module-content">
                            <div class="module-name">{{ m.name }}</div>
                            <div class="module-desc">{{ m.desc }}</div>
                        </div>
                        <span class="module-arrow">→</span>
                    </div>
                </div>

                <aside class="recent-panel">
                    <div class="recent-head">
                        <span>最近使用</span>
                        <el-button v-if="recentList.length" link size="small" @click="clearRecent">清空</el-button>
                    </div>
                    <template v-if="recentList.length">
                        <div v-for="r in recentList" :key="r.path" class="recent-item" @click="router.push(r.path)">
                            <span class="recent-name">{{ r.name }}</span>
                            <span class="recent-time">{{ r.time }}</span>
                        </div>
                    </template>
                    <div v-else class="recent-empty">
                        <div class="recent-empty-title">第一次使用？</div>
                        <div class="recent-empty-step">① 选择商品　② 预览修改效果　③ 确认执行</div>
                        <el-button type="primary" plain size="small"
                            @click="goBatch(batchModules[2])">从修改价格开始</el-button>
                    </div>
                </aside>
            </div>
        </section>

        <!-- ====== ② 关联营销（次主推） ====== -->
        <section class="wb-section">
            <div class="section-head">
                <div class="section-title">
                    关联营销
                    <span class="tag-plain">提升客单价</span>
                </div>
                <el-button link type="primary" @click="router.push('/recommend/list')">活动列表 →</el-button>
            </div>

            <div class="recommend-lead">
                <span class="lead-text">给在售商品挂上关联推荐，进店买家多买一件</span>
                <span class="lead-count">
                    <b>{{ recommendCount }}</b> 个在售商品还没有关联推荐
                </span>
            </div>

            <div class="recommend-grid">
                <div class="recommend-card focus" @click="router.push('/recommend/new?tab=system')">
                    <div class="recommend-head">
                        <span class="recommend-title">按模板生成</span>
                        <span class="tag-brand">最快上手</span>
                    </div>
                    <div class="recommend-desc">选系统模板 + 挑推荐商品，自动拼成推荐位</div>
                    <div class="recommend-points">拖拽排序 · 右侧实时预览 · 一键批量发布</div>
                    <div class="recommend-action">选择模板建活动 →</div>
                </div>

                <div class="recommend-card" @click="router.push('/recommend/new?tab=custom')">
                    <div class="recommend-head">
                        <span class="recommend-title">自定义营销图片</span>
                    </div>
                    <div class="recommend-desc">把自己做的活动图批量发布到商品详情顶部/底部</div>
                    <div class="recommend-points">最多 5 张 · 可设跳转链接 · 自动裁剪尺寸</div>
                    <div class="recommend-action">上传图片建活动 →</div>
                </div>

                <div class="recommend-card" @click="router.push('/recommend/new?tab=map')">
                    <div class="recommend-head">
                        <span class="recommend-title">带热区活动图</span>
                    </div>
                    <div class="recommend-desc">大促活动图分区域点击，直接跳到对应商品</div>
                    <div class="recommend-points">拉框设热区 · 最多 15 个 · 适合 618/双11</div>
                    <div class="recommend-action">创建热区活动 →</div>
                </div>
            </div>

            <div class="recommend-foot">
                <el-button link type="primary" @click="router.push('/recommend/banner')">免费海报下载 →</el-button>
                <span class="foot-tip">海报中心可作为自定义图片的素材来源</span>
            </div>
        </section>

        <!-- ====== ③ 今天可以做 ====== -->
        <section class="wb-section">
            <div class="section-head">
                <div class="section-title">今天可以做</div>
            </div>

            <template v-if="todoList.length">
                <div v-for="todo in todoList" :key="todo.key" class="todo-row">
                    <div class="todo-main">
                        <span class="todo-label">{{ todo.label }}</span>
                        <span v-if="todo.count !== null" class="todo-count">{{ todo.count }}</span>
                    </div>
                    <el-button link type="primary" @click="router.push(todo.path)">{{ todo.action }} →</el-button>
                </div>
            </template>
            <div v-else class="todo-empty">暂无待办，店铺状态不错</div>
        </section>

        <!-- ====== ④ 店铺数据（弱化） ====== -->
        <section class="wb-section">
            <div class="section-head">
                <div class="section-title">店铺数据</div>
                <el-button link type="primary" @click="router.push('/dashboard')">查看经营数据 →</el-button>
            </div>
            <div class="metric-grid">
                <div v-for="metric in metricList" :key="metric.label" class="metric-item">
                    <div class="metric-label">{{ metric.label }}</div>
                    <div class="metric-value" :class="{ quiet: metric.quiet }">{{ metric.value }}</div>
                </div>
            </div>
            <!-- <div class="metric-tip">销售额、利润为 0 时不显示，出单后自动展示</div> -->
        </section>

        <!-- ====== ⑤ 经营分析（默认折叠） ====== -->
        <el-collapse v-model="analysisActive" class="analysis-collapse" @change="handleAnalysisToggle">
            <el-collapse-item name="analysis" title="经营分析：销售趋势与商品利润排行">
                <div class="analysis-body">
                    <el-row :gutter="16">
                        <el-col :xs="24" :lg="16">
                            <div class="analysis-card">
                                <div class="analysis-head">
                                    <span>销售 &amp; 利润趋势</span>
                                    <el-radio-group v-model="trendRange" size="small" @change="loadAnalysisData">
                                        <el-radio-button value="7">近7天</el-radio-button>
                                        <el-radio-button value="30">近30天</el-radio-button>
                                        <el-radio-button value="90">近90天</el-radio-button>
                                    </el-radio-group>
                                </div>
                                <div ref="chartRef" class="chart-container"></div>
                            </div>
                        </el-col>
                        <el-col :xs="24" :lg="8">
                            <div class="analysis-card">
                                <div class="analysis-head">
                                    <span>商品利润排行</span>
                                    <el-button link type="primary"
                                        @click="router.push('/statistics/item-sales-analysis')">查看全部 →</el-button>
                                </div>
                                <div v-if="rankList.length" class="rank-list">
                                    <div v-for="(item, index) in rankList" :key="item.id" class="rank-item">
                                        <div class="rank-index" :class="getRankClass(index)">{{ index + 1 }}</div>
                                        <div class="rank-info">
                                            <div class="rank-title">{{ item.title }}</div>
                                            <div class="rank-sku">{{ item.sku }}</div>
                                        </div>
                                        <div class="rank-profit">¥{{ item.profit }}</div>
                                    </div>
                                </div>
                                <div v-else class="rank-empty">暂无利润数据，出单后展示</div>
                            </div>
                        </el-col>
                    </el-row>
                </div>
            </el-collapse-item>
        </el-collapse>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getKpi, getTradeStatistics, getSyncStatus } from '@/api/trade'
import { getItemSalesAnalysis } from '@/api/stat'
import { getItemsWithoutCostCount } from '@/api/cost'
import { getItemsWithoutActivityCount } from '@/api/recommend'

import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

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
// 用户信息
// ============================================================
const user = ref({
    picPath: '',
    title: '',
    sellerNick: '',
    articleItemName: '',
    subscribeDeadline: ''
})

const loadUserInfo = () => {
    try {
        const info = JSON.parse(localStorage.getItem('user') || '{}')
        user.value = {
            picPath: info.pic_path || '',
            title: info.title || info.seller_nick || '',
            sellerNick: info.seller_nick || '',
            articleItemName: info.article_item_name || '',
            subscribeDeadline: info.subscribe_deadline || ''
        }
    } catch (error) {
        console.error('读取用户信息失败:', error)
    }
}

const deadlineText = computed(() => {
    const d = user.value.subscribeDeadline
    return d ? d.substring(0, 10) : '-'
})

// ============================================================
// 批量修改模块
// ============================================================
const batchModules = [
    { name: '修改标题', desc: '统一加前缀/后缀，替换关键词', icon: '✏️', path: '/batch-update/title-v2' },
    { name: '修改导购标题', desc: '优化搜索展示的短标题', icon: '📝', path: '/batch-update/shop-title' },
    { name: '修改价格', desc: '全店涨价/降价，支持SKU价格修改', icon: '🏷️', path: '/batch-update/price' },
    { name: '修改库存', desc: '按范围统一设置商品/SKU 库存', icon: '📦', path: '/batch-update/stock' },
    { name: '修改SKU名称', desc: '批量替换 SKU 规格名', icon: '🔖', path: '/batch-update/sku-prop-name' },
    { name: '修改类目属性', desc: '按模板商品统一填写属性', icon: '🧩', path: '/batch-update/cat-prop' },
    { name: '修改食品属性', desc: '保质期、产地等批量填写', icon: '🥫', path: '/batch-update/food-prop' },
    { name: '修改其他', desc: '物流体积重量等杂项批量修改', icon: '🔧', path: '/batch-update/other' },
]

// ============================================================
// 最近使用（localStorage）
// ============================================================
const RECENT_KEY = 'taoboss_workbench_recent'
const recentList = ref([])

const loadRecent = () => {
    try {
        recentList.value = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    } catch (error) {
        recentList.value = []
    }
}

const goBatch = (module) => {
    try {
        const record = {
            name: module.name,
            path: module.path,
            time: dayjs().format('MM-DD HH:mm')
        }
        const list = recentList.value.filter(item => item.path !== module.path)
        list.unshift(record)
        recentList.value = list.slice(0, 3)
        localStorage.setItem(RECENT_KEY, JSON.stringify(recentList.value))
    } catch (error) {
        console.error('保存最近使用失败:', error)
    }
    router.push(module.path)
}

const clearRecent = () => {
    recentList.value = []
    localStorage.removeItem(RECENT_KEY)
}

// ============================================================
// 今日数据
// ============================================================
const kpi = ref({
    orders: 0,
    payment: 0,
    profit: 0,
    confirmed: 0
})

const metricList = computed(() => {
    const outOfOrder = kpi.value.payment === 0
    const formatMoney = (value) => `¥${(value || 0).toFixed(2)}`
    return [
        {
            label: '今日订单',
            value: kpi.value.orders > 0 ? `${kpi.value.orders} 单` : '出单后显示',
            quiet: kpi.value.orders === 0
        },
        {
            label: '今日销售额',
            value: outOfOrder ? '出单后显示' : formatMoney(kpi.value.payment),
            quiet: outOfOrder
        },
        {
            label: '今日利润',
            value: outOfOrder ? '出单后显示' : formatMoney(kpi.value.profit),
            quiet: outOfOrder
        },
        {
            label: '今日确认收货',
            value: outOfOrder ? '出单后显示' : formatMoney(kpi.value.confirmed),
            quiet: outOfOrder
        }
    ]
})

const loadKpi = async () => {
    try {
        const res = await getKpi()
        const data = res.data.data
        kpi.value = {
            orders: data.orders?.value || 0,
            payment: data.payment?.value || 0,
            profit: data.profit?.value || 0,
            confirmed: data.confirmed?.value || 0
        }
    } catch (error) {
        console.error('加载今日数据失败:', error)
    }
}

// ============================================================
// 待办与数量
// ============================================================
const costCount = ref(0)
const recommendCount = ref(0)

const loadCounts = async () => {
    const [costRes, recommendRes] = await Promise.all([
        getItemsWithoutCostCount().catch(() => null),
        getItemsWithoutActivityCount().catch(() => null)
    ])
    costCount.value = costRes?.data?.data?.count || 0
    recommendCount.value = recommendRes?.data?.data?.count || 0
}

const todoList = computed(() => {
    const list = []
    if (costCount.value > 0) {
        list.push({
            key: 'cost',
            label: '未配置成本的商品',
            count: costCount.value,
            action: '去配置',
            path: '/cost/item-cost-manage'
        })
    }
    if (recommendCount.value > 0) {
        list.push({
            key: 'recommend',
            label: '未发布关联营销的商品',
            count: recommendCount.value,
            action: '去发布',
            path: '/recommend/new?tab=system'
        })
    }
    list.push({
        key: 'delist',
        label: '上下架时间是否已优化到流量高峰',
        count: null,
        action: '去查看',
        path: '/delist-optimize/distribution'
    })
    return list
})

// ============================================================
// 经营分析：趋势图与利润排行（默认折叠）
// ============================================================
const analysisActive = ref([])
const trendRange = ref('7')
const chartRef = ref(null)
let chartInstance = null
const chartData = ref({ xAxis: [], sales: [], profits: [] })
const rankList = ref([])

const loadAnalysisData = async () => {
    await Promise.all([loadTrendData(), loadRankingData()])
    if (analysisActive.value.includes('analysis')) {
        nextTick(renderChart)
    }
}

const handleAnalysisToggle = () => {
    if (analysisActive.value.includes('analysis')) {
        loadAnalysisData()
    }
}

const loadTrendData = async () => {
    try {
        const days = parseInt(trendRange.value)
        const params = {
            granularity: 'day',
            time_field: 'pay_time',
            start_date: dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD'),
            end_date: dayjs().format('YYYY-MM-DD')
        }
        const response = await getTradeStatistics(params)
        const details = response.data.data?.period_details || []
        chartData.value = {
            xAxis: details.map(item => item.period_label || ''),
            sales: details.map(item => item.amount || 0),
            profits: details.map(item => item.profit || 0)
        }
        // 近 7 天有销售额时自动展开经营分析
        if (trendRange.value === '7' && !analysisActive.value.includes('analysis')) {
            const totalSales = chartData.value.sales.reduce((sum, value) => sum + value, 0)
            if (totalSales > 0) {
                analysisActive.value = ['analysis']
                nextTick(renderChart)
            }
        }
    } catch (error) {
        console.error('加载趋势数据失败:', error)
    }
}

const renderChart = () => {
    if (!chartRef.value || !analysisActive.value.includes('analysis')) return
    if (chartInstance) chartInstance.dispose()

    chartInstance = echarts.init(chartRef.value)
    const xData = chartData.value.xAxis.length ? chartData.value.xAxis : ['暂无数据']
    const salesData = chartData.value.sales.length ? chartData.value.sales : [0]
    const profitsData = chartData.value.profits.length ? chartData.value.profits : [0]

    chartInstance.setOption({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            formatter: function (params) {
                let html = `<div style="font-weight:600;">${params[0].axisValue}</div>`
                params.forEach(p => {
                    html += `<div>${p.marker} ${p.seriesName}: ¥${Number(p.value).toFixed(2)}</div>`
                })
                return html
            }
        },
        legend: { data: ['销售额', '利润'], top: 0, right: 0 },
        grid: { left: 50, right: 30, top: 50, bottom: 30 },
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
    })
    chartInstance.resize()
}

const loadRankingData = async () => {
    try {
        const days = parseInt(trendRange.value)
        const params = {
            page: 1,
            page_size: 5,
            time_type: 'day',
            start_date: dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD'),
            end_date: dayjs().format('YYYY-MM-DD'),
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
                const skuList = (item.sku_list || []).slice()
                skuList.sort((a, b) => (b.profit || 0) - (a.profit || 0))
                const topSku = skuList.length > 0 ? skuList[0] : null
                return {
                    id: item.num_iid,
                    title: item.title || '未知商品',
                    sku: topSku?.properties_name || item.outer_iid || `ID:${item.num_iid}`,
                    profit: item.total_profit?.toFixed(0) || '0'
                }
            })
        }
    } catch (error) {
        console.error('加载排行数据失败:', error)
    }
}

const getRankClass = (index) => {
    if (index === 0) return 'gold'
    if (index === 1) return 'silver'
    if (index === 2) return 'bronze'
    return ''
}

// ============================================================
// 订单同步状态
// ============================================================
const SYNC_SHOWN_KEY = 'taoboss_sync_shown'
const syncStatus = ref({
    isSyncing: false,
    isCompleted: false,
    progress: 0,
    message: '',
    showBanner: false
})
let syncPollTimer = null

const checkSyncStatus = async () => {
    try {
        const res = await getSyncStatus()
        const data = res.data.data
        if (!data) return

        syncStatus.value.isSyncing = data.is_syncing || false
        syncStatus.value.isCompleted = data.is_completed || false
        syncStatus.value.progress = data.progress || 0
        syncStatus.value.message = data.message || ''

        if (data.is_completed && localStorage.getItem(SYNC_SHOWN_KEY) === 'true') {
            syncStatus.value.showBanner = false
            stopSyncPolling()
            return
        }

        syncStatus.value.showBanner = true

        if (data.is_completed) {
            localStorage.setItem(SYNC_SHOWN_KEY, 'true')
            await refreshSilent()
            stopSyncPolling()
        }

        if (data.is_syncing) {
            startSyncPolling()
        }
    } catch (error) {
        console.error('获取同步状态失败:', error)
        syncStatus.value.showBanner = false
    }
}

const startSyncPolling = () => {
    if (syncPollTimer) clearInterval(syncPollTimer)
    syncPollTimer = setInterval(checkSyncStatus, 3000)
}

const stopSyncPolling = () => {
    if (syncPollTimer) {
        clearInterval(syncPollTimer)
        syncPollTimer = null
    }
}

const closeSyncBanner = () => {
    syncStatus.value.showBanner = false
    stopSyncPolling()
    if (syncStatus.value.isCompleted) {
        localStorage.setItem(SYNC_SHOWN_KEY, 'true')
    }
}

// ============================================================
// 刷新
// ============================================================
const refreshSilent = async () => {
    await Promise.all([loadKpi(), loadCounts(), loadAnalysisData()])
}

const refreshAll = async () => {
    ElMessage.info('正在刷新数据...')
    await refreshSilent()
    ElMessage.success('数据已刷新')
}

onMounted(async () => {
    loadUserInfo()
    loadRecent()
    await Promise.all([
        loadKpi(),
        loadCounts(),
        loadTrendData(),
        loadRankingData(),
        checkSyncStatus()
    ])

    window.addEventListener('resize', handleResize)
})

const handleResize = () => {
    chartInstance?.resize()
}

onUnmounted(() => {
    stopSyncPolling()
    window.removeEventListener('resize', handleResize)
    chartInstance?.dispose()
})
</script>

<style scoped>
.workbench {
    padding: 20px 24px;
    background: #f5f7fa;
    min-height: calc(100vh - 64px);
}

/* ====== 顶部欢迎条 ====== */
.wb-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 16px;
}

.wb-user {
    display: flex;
    align-items: center;
    gap: 12px;
}

.wb-title {
    font-size: 20px;
    font-weight: 600;
    color: #1D2129;
}

.wb-sub {
    font-size: 13px;
    color: #86909C;
    margin-top: 2px;
}

.wb-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 13px;
    color: #86909C;
    flex-wrap: wrap;
}

/* ====== 通用区块 ====== */
.wb-section {
    background: #fff;
    border-radius: 12px;
    padding: 18px 20px;
    margin-bottom: 16px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.primary-section {
    border: 1px solid rgba(0, 137, 250, 0.35);
}

.section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 14px;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1D2129;
    display: flex;
    align-items: center;
    gap: 8px;
}

.section-desc {
    font-size: 12px;
    color: #86909C;
}

.tag-brand {
    font-size: 12px;
    font-weight: 500;
    color: #0089FA;
    border: 1px solid #0089FA;
    border-radius: 999px;
    padding: 0 8px;
    line-height: 18px;
}

.tag-plain {
    font-size: 12px;
    font-weight: 500;
    color: #86909C;
    border: 1px solid #E5E6EB;
    border-radius: 999px;
    padding: 0 8px;
    line-height: 18px;
}

/* ====== 批量修改 ====== */
.batch-layout {
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(240px, 1fr);
    gap: 16px;
}

.module-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

.module-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px;
    border: 1px solid #EBEDF0;
    border-radius: 10px;
    background: #FAFBFC;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
}

.module-card:hover {
    border-color: #0089FA;
    background: rgba(0, 137, 250, 0.04);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.module-icon {
    font-size: 20px;
    line-height: 1;
    flex-shrink: 0;
}

.module-content {
    min-width: 0;
    flex: 1;
}

.module-name {
    font-size: 14px;
    font-weight: 600;
    color: #1D2129;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.module-desc {
    font-size: 12px;
    color: #86909C;
    margin-top: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.module-arrow {
    font-size: 14px;
    color: #C9CDD4;
    flex-shrink: 0;
    align-self: center;
}

.module-card:hover .module-arrow {
    color: #0089FA;
}

.recent-panel {
    border-left: 1px solid #F0F1F3;
    padding-left: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.recent-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
    color: #1D2129;
}

.recent-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    background: #FAFBFC;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.2s;
}

.recent-item:hover {
    background: rgba(0, 137, 250, 0.06);
}

.recent-name {
    color: #1D2129;
}

.recent-time {
    color: #86909C;
    font-size: 12px;
    white-space: nowrap;
}

.recent-empty {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border: 1px dashed #E5E6EB;
    border-radius: 10px;
    background: #FAFBFC;
}

.recent-empty-title {
    font-size: 13px;
    font-weight: 600;
    color: #1D2129;
}

.recent-empty-step {
    font-size: 12px;
    color: #86909C;
    line-height: 1.7;
}

.recent-empty .el-button {
    align-self: flex-start;
}

/* ====== 关联营销 ====== */
.recommend-lead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 10px 14px;
    border-radius: 8px;
    background: #F7F8FA;
    margin-bottom: 12px;
}

.lead-text {
    font-size: 13px;
    color: #4E5969;
}

.lead-count {
    font-size: 13px;
    color: #4E5969;
}

.lead-count b {
    color: #0089FA;
    font-size: 16px;
}

.recommend-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.recommend-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px;
    border: 1px solid #EBEDF0;
    border-radius: 10px;
    background: #FAFBFC;
    cursor: pointer;
    transition: all 0.2s;
}

.recommend-card:hover {
    border-color: #0089FA;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.recommend-card.focus {
    border-color: #0089FA;
    background: rgba(0, 137, 250, 0.04);
}

.recommend-head {
    display: flex;
    align-items: center;
    gap: 8px;
}

.recommend-title {
    font-size: 14px;
    font-weight: 600;
    color: #1D2129;
}

.recommend-head .tag-brand {
    margin-left: auto;
}

.recommend-desc {
    font-size: 13px;
    color: #4E5969;
}

.recommend-points {
    font-size: 12px;
    color: #86909C;
}

.recommend-action {
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid #F0F1F3;
    font-size: 13px;
    font-weight: 500;
    color: #0089FA;
}

.recommend-foot {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 10px;
}

.foot-tip {
    font-size: 12px;
    color: #86909C;
}

/* ====== 今天可以做 ====== */
.todo-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #F5F6F7;
}

.todo-row:last-child {
    border-bottom: none;
}

.todo-main {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #4E5969;
}

.todo-count {
    font-size: 13px;
    font-weight: 600;
    color: #FF9900;
}

.todo-empty {
    font-size: 13px;
    color: #86909C;
    padding: 8px 0;
}

/* ====== 店铺数据 ====== */
.metric-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

.metric-item {
    padding: 12px 14px;
    border-radius: 10px;
    background: #F7F8FA;
}

.metric-label {
    font-size: 12px;
    color: #86909C;
}

.metric-value {
    font-size: 18px;
    font-weight: 600;
    color: #1D2129;
    margin-top: 4px;
}

.metric-value.quiet {
    font-size: 13px;
    font-weight: 400;
    color: #86909C;
}

.metric-tip {
    font-size: 12px;
    color: #86909C;
    margin-top: 10px;
}

/* ====== 经营分析折叠区 ====== */
.analysis-collapse {
    background: #fff;
    border-radius: 12px;
    border: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    padding: 4px 20px;
}

.analysis-collapse :deep(.el-collapse-item__header) {
    font-size: 14px;
    font-weight: 600;
    color: #1D2129;
    border-bottom: none;
}

.analysis-collapse :deep(.el-collapse-item__wrap) {
    border-bottom: none;
}

.analysis-body {
    padding: 4px 0 16px;
}

.analysis-card {
    border: 1px solid #F0F1F3;
    border-radius: 10px;
    padding: 12px;
    height: 100%;
}

.analysis-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 13px;
    font-weight: 600;
    color: #1D2129;
    margin-bottom: 8px;
}

.chart-container {
    height: 260px;
    width: 100%;
}

.rank-list {
    display: flex;
    flex-direction: column;
}

.rank-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid #F5F6F7;
}

.rank-item:last-child {
    border-bottom: none;
}

.rank-index {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #F2F3F5;
    color: #86909C;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
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
    font-size: 13px;
    color: #1D2129;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.rank-sku {
    font-size: 12px;
    color: #86909C;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.rank-profit {
    font-size: 14px;
    font-weight: 600;
    color: #1D2129;
    flex-shrink: 0;
}

.rank-empty {
    font-size: 13px;
    color: #86909C;
    padding: 12px 0;
}

/* ====== 同步状态 ====== */
.sync-alert {
    margin-bottom: 16px;
    border-radius: 8px;
}

.sync-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

/* ====== 响应式 ====== */
@media screen and (max-width: 1200px) {
    .module-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .batch-layout {
        grid-template-columns: minmax(0, 1fr);
    }

    .recent-panel {
        border-left: none;
        padding-left: 0;
        border-top: 1px solid #F0F1F3;
        padding-top: 12px;
    }
}

@media screen and (max-width: 992px) {
    .workbench {
        padding: 16px;
    }

    .recommend-grid {
        grid-template-columns: minmax(0, 1fr);
    }

    .metric-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media screen and (max-width: 768px) {
    .workbench {
        padding: 12px;
    }

    .wb-title {
        font-size: 17px;
    }

    .module-grid {
        grid-template-columns: minmax(0, 1fr);
    }

    .chart-container {
        height: 200px;
    }
}
</style>
