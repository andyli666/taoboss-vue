<template>
    <div class="page-view-stats">
        <!-- 页面标题 -->
        <div class="page-header">
            <div>
                <h2>页面访问统计</h2>
                <p class="page-desc">按自然日统计各用户访问了哪些页面（数据保留 90 天）</p>
            </div>
        </div>

        <!-- 筛选栏 -->
        <el-card class="filter-card">
            <el-form :inline="true" :model="filterForm" class="filter-form">
                <el-form-item label="日期范围">
                    <el-date-picker v-model="filterForm.dateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD" :shortcuts="dateShortcuts" style="width: 260px" />
                </el-form-item>

                <el-form-item label="卖家昵称">
                    <el-input v-model="filterForm.sellerNick" placeholder="精确匹配" clearable style="width: 160px"
                        @keyup.enter="searchData" />
                </el-form-item>

                <el-form-item label="用户ID">
                    <el-input v-model="filterForm.userId" placeholder="精确匹配" clearable style="width: 120px"
                        @keyup.enter="searchData" />
                </el-form-item>

                <el-form-item label="页面路径">
                    <el-input v-model="filterForm.pagePath" placeholder="如 /batch-update/price" clearable
                        style="width: 200px" @keyup.enter="searchData" />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" :loading="loading" @click="searchData">查询</el-button>
                    <el-button @click="resetFilter">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 汇总指标 -->
        <div class="summary-grid" v-loading="loading">
            <el-card v-for="item in summaryCards" :key="item.label" class="summary-card" shadow="never">
                <div class="summary-label">{{ item.label }}</div>
                <div class="summary-value" :style="{ color: item.color }">{{ item.value }}</div>
            </el-card>
        </div>

        <!-- 每日趋势 -->
        <el-card class="chart-card">
            <template #header>
                <div class="card-header">
                    <span>每日访问趋势</span>
                    <span class="sub-tip">PV：访问次数　UV：用户×页面去重数　用户数：当日访问用户去重数</span>
                </div>
            </template>
            <div v-if="hasTrendData" ref="trendChartRef" class="chart chart-trend"></div>
            <el-empty v-else description="所选区间暂无数据" :image-size="80" />
        </el-card>

        <!-- 页面排行 -->
        <el-card class="chart-card">
            <template #header>
                <div class="card-header">
                    <span>页面访问排行</span>
                    <span class="sub-tip">按 PV 降序，取前 10 个页面</span>
                </div>
            </template>
            <div v-if="hasPageData" ref="pageChartRef" class="chart" :style="{ height: pageChartHeight + 'px' }">
            </div>
            <el-empty v-else description="暂无页面数据" :image-size="80" />
        </el-card>

        <!-- 页面维度 -->
        <el-card class="table-card">
            <template #header>
                <div class="card-header">
                    <span>页面明细</span>
                    <span class="sub-tip">按 PV 降序</span>
                </div>
            </template>
            <el-table :data="stats.pages" border stripe v-loading="loading" max-height="420"
                style="width: 100%">
                <el-table-column type="index" label="序号" width="70" align="center" />
                <el-table-column prop="pagePath" label="页面路径" min-width="240" show-overflow-tooltip />
                <el-table-column prop="pageTitle" label="页面标题" min-width="180" show-overflow-tooltip>
                    <template #default="{ row }">{{ row.pageTitle || '-' }}</template>
                </el-table-column>
                <el-table-column prop="pv" label="访问次数（PV）" width="140" align="right">
                    <template #default="{ row }">{{ formatNumber(row.pv) }}</template>
                </el-table-column>
                <el-table-column prop="uv" label="访问用户数（UV）" width="150" align="right">
                    <template #default="{ row }">{{ formatNumber(row.uv) }}</template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 用户维度 -->
        <el-card class="table-card">
            <template #header>
                <div class="card-header">
                    <span>用户明细</span>
                    <span class="sub-tip">按 PV 降序</span>
                </div>
            </template>
            <el-table :data="stats.users" border stripe v-loading="loading" max-height="420"
                style="width: 100%">
                <el-table-column prop="sellerNick" label="卖家昵称" min-width="160" />
                <el-table-column prop="userId" label="用户ID" width="110" align="right">
                    <template #default="{ row }">{{ row.userId || 0 }}</template>
                </el-table-column>
                <el-table-column prop="pv" label="访问次数" width="120" align="right">
                    <template #default="{ row }">{{ formatNumber(row.pv) }}</template>
                </el-table-column>
                <el-table-column prop="pageCount" label="访问页面数" width="120" align="right">
                    <template #default="{ row }">{{ formatNumber(row.pageCount) }}</template>
                </el-table-column>
                <el-table-column prop="lastVisitDate" label="最后访问日期" width="140" />
            </el-table>
        </el-card>

        <!-- 访问明细 -->
        <el-card class="table-card">
            <template #header>
                <div class="card-header">
                    <span>访问明细（日期 × 用户 × 页面）</span>
                    <span class="sub-tip">合计 {{ formatNumber(rowsTotal) }} 条记录</span>
                </div>
            </template>
            <el-table :data="pagedRows" border stripe v-loading="loading" style="width: 100%">
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="sellerNick" label="卖家昵称" min-width="150">
                    <template #default="{ row }">{{ row.sellerNick || '-' }}</template>
                </el-table-column>
                <el-table-column prop="userId" label="用户ID" width="100" align="right">
                    <template #default="{ row }">{{ row.userId || 0 }}</template>
                </el-table-column>
                <el-table-column prop="pagePath" label="页面路径" min-width="220" show-overflow-tooltip />
                <el-table-column prop="pageTitle" label="页面标题" min-width="160" show-overflow-tooltip>
                    <template #default="{ row }">{{ row.pageTitle || '-' }}</template>
                </el-table-column>
                <el-table-column prop="pv" label="访问次数" width="110" align="right">
                    <template #default="{ row }">{{ formatNumber(row.pv) }}</template>
                </el-table-column>
                <el-table-column prop="firstVisitAt" label="首次访问时间" width="170" />
                <el-table-column prop="lastVisitAt" label="末次访问时间" width="170" />
            </el-table>

            <div class="pagination-wrapper">
                <el-pagination v-model:current-page="rowsPage.current" v-model:page-size="rowsPage.pageSize"
                    :page-sizes="[20, 50, 100]" :total="rowsTotal"
                    layout="total, sizes, prev, pager, next, jumper" />
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getPageViewStats } from '@/api/pageView'
import { dateShortcuts, getDefaultDateRange } from '@/utils/index'
import dayjs from 'dayjs'

// 注册 ECharts 组件
echarts.use([
    LineChart,
    BarChart,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    CanvasRenderer
])

// ==================== 状态 ====================
const loading = ref(false)

const filterForm = reactive({
    dateRange: getDefaultDateRange(),
    sellerNick: '',
    userId: '',
    pagePath: ''
})

const emptyStats = () => ({
    summary: { userCount: 0, pageCount: 0, pv: 0, uv: 0 },
    dates: [],
    daily: [],
    pages: [],
    users: [],
    rows: []
})

const stats = ref(emptyStats())

const rowsPage = reactive({
    current: 1,
    pageSize: 20
})

// 图表实例
const trendChartRef = ref(null)
const pageChartRef = ref(null)
const chartInstances = { trend: null, page: null }

// ==================== 计算属性 ====================
const formatNumber = (value) => {
    const num = Number(value) || 0
    return num.toLocaleString('zh-CN')
}

const summaryCards = computed(() => {
    const summary = stats.value.summary || {}
    return [
        { label: '访问用户数', value: formatNumber(summary.userCount), color: '#0089FA' },
        { label: '被访问页面数', value: formatNumber(summary.pageCount), color: '#36CFC9' },
        { label: '访问次数（PV）', value: formatNumber(summary.pv), color: '#FFA940' },
        { label: '用户×页面（UV）', value: formatNumber(summary.uv), color: '#9B8AFA' }
    ]
})

const hasTrendData = computed(() => (stats.value.dates || []).length > 0 && (stats.value.daily || []).length > 0)
const hasPageData = computed(() => (stats.value.pages || []).length > 0)

const topPages = computed(() => (stats.value.pages || []).slice(0, 10))
const pageChartHeight = computed(() => Math.max(320, topPages.value.length * 32 + 90))

const rowsTotal = computed(() => (stats.value.rows || []).length)
const pagedRows = computed(() => {
    const rows = stats.value.rows || []
    const start = (rowsPage.current - 1) * rowsPage.pageSize
    return rows.slice(start, start + rowsPage.pageSize)
})

// ==================== 图表渲染 ====================
const getChart = (key, el) => {
    let instance = chartInstances[key]
    // 容器因空态切换被重建时，旧实例需销毁
    if (instance && instance.getDom() !== el) {
        instance.dispose()
        instance = null
        chartInstances[key] = null
    }
    if (!instance) {
        instance = echarts.init(el)
        chartInstances[key] = instance
    }
    return instance
}

const disposeChart = (key) => {
    const instance = chartInstances[key]
    if (instance) {
        instance.dispose()
        chartInstances[key] = null
    }
}

const renderTrendChart = () => {
    if (!trendChartRef.value) return
    const daily = stats.value.daily || []
    const option = {
        tooltip: {
            trigger: 'axis',
            valueFormatter: (value) => formatNumber(value)
        },
        legend: { top: 0, icon: 'roundRect' },
        grid: { left: 16, right: 24, top: 48, bottom: 16, containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: stats.value.dates || [],
            axisLabel: { color: '#86909C', hideOverlap: true }
        },
        yAxis: {
            type: 'value',
            minInterval: 1,
            axisLabel: { color: '#86909C' }
        },
        series: [
            {
                name: 'PV',
                type: 'line',
                smooth: true,
                showSymbol: true,
                data: daily.map((item) => item.pv || 0),
                itemStyle: { color: '#0089FA' },
                lineStyle: { width: 2 }
            },
            {
                name: 'UV',
                type: 'line',
                smooth: true,
                showSymbol: true,
                data: daily.map((item) => item.uv || 0),
                itemStyle: { color: '#36CFC9' },
                lineStyle: { width: 2 }
            },
            {
                name: '用户数',
                type: 'line',
                smooth: true,
                showSymbol: true,
                data: daily.map((item) => item.userCount || 0),
                itemStyle: { color: '#FFA940' },
                lineStyle: { width: 2 }
            }
        ]
    }
    const chart = getChart('trend', trendChartRef.value)
    chart.setOption(option, true)
    chart.resize()
}

const renderPageChart = () => {
    if (!pageChartRef.value || !hasPageData.value) return
    // ECharts 类目轴自下而上排列，反转后 PV 最高的排在最上方
    const pages = [...topPages.value].reverse()
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                const item = params[0]
                const page = pages[item.dataIndex]
                return `${item.marker}${page.pageTitle || page.pagePath}<br/>页面路径：${page.pagePath}<br/>PV：${formatNumber(page.pv)}<br/>UV：${formatNumber(page.uv)}`
            }
        },
        grid: { left: 16, right: 56, top: 16, bottom: 12, containLabel: true },
        xAxis: {
            type: 'value',
            minInterval: 1,
            axisLabel: { color: '#86909C' }
        },
        yAxis: {
            type: 'category',
            data: pages.map((item) => item.pagePath),
            axisLabel: { color: '#4E5969', width: 200, overflow: 'truncate' }
        },
        series: [
            {
                name: 'PV',
                type: 'bar',
                barMaxWidth: 20,
                itemStyle: { color: '#0089FA', borderRadius: [0, 4, 4, 0] },
                label: { show: true, position: 'right', color: '#4E5969' },
                data: pages.map((item) => item.pv || 0)
            }
        ]
    }
    const chart = getChart('page', pageChartRef.value)
    chart.setOption(option, true)
    chart.resize()
}

const renderCharts = () => {
    if (!hasTrendData.value) disposeChart('trend')
    if (!hasPageData.value) disposeChart('page')

    renderTrendChart()
    renderPageChart()
}

const handleResize = () => {
    Object.values(chartInstances).forEach((instance) => {
        if (instance) instance.resize()
    })
}

// ==================== 数据加载 ====================
const validateRange = () => {
    const range = filterForm.dateRange
    if (!range || range.length !== 2) return true
    const start = dayjs(range[0])
    const end = dayjs(range[1])
    if (end.isBefore(start)) {
        ElMessage.warning('开始日期不能晚于结束日期')
        return false
    }
    if (end.diff(start, 'day') + 1 > 366) {
        ElMessage.warning('单次查询区间最长 366 天')
        return false
    }
    return true
}

const loadData = async () => {
    if (!validateRange()) return

    const userId = filterForm.userId.trim()
    if (userId && !/^\d+$/.test(userId)) {
        ElMessage.warning('用户ID需为数字')
        return
    }

    loading.value = true
    try {
        const params = {}
        if (filterForm.dateRange && filterForm.dateRange.length === 2) {
            params.startDate = filterForm.dateRange[0]
            params.endDate = filterForm.dateRange[1]
        }
        const sellerNick = filterForm.sellerNick.trim()
        if (sellerNick) params.sellerNick = sellerNick
        if (userId) params.userId = Number(userId)
        const pagePath = filterForm.pagePath.trim()
        if (pagePath) params.pagePath = pagePath

        const res = await getPageViewStats(params)
        if (res.data.code === 0) {
            stats.value = { ...emptyStats(), ...(res.data.data || {}) }
            rowsPage.current = 1
            await nextTick()
            renderCharts()
        }
    } catch (error) {
        // 拦截器已统一提示（403 无权限 / 400 参数错误等），此处不再重复提示
    } finally {
        loading.value = false
    }
}

const searchData = () => {
    loadData()
}

const resetFilter = () => {
    filterForm.dateRange = getDefaultDateRange()
    filterForm.sellerNick = ''
    filterForm.userId = ''
    filterForm.pagePath = ''
    loadData()
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
    loadData()
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    Object.values(chartInstances).forEach((instance) => {
        if (instance) instance.dispose()
    })
})
</script>

<style scoped>
.page-view-stats {
    padding: 20px;
    background: #f5f7fa;
    min-height: 100vh;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.page-header h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
}

.page-desc {
    margin: 0;
    color: #909399;
    font-size: 14px;
}

.filter-card {
    margin-bottom: 20px;
    border-radius: 12px;
}

.filter-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
}

/* 汇总卡片 */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;
}

.summary-card {
    border-radius: 12px;
    border: none;
}

.summary-label {
    font-size: 13px;
    color: #86909C;
}

.summary-value {
    margin-top: 8px;
    font-size: 26px;
    font-weight: 700;
    line-height: 1.2;
}

/* 图表 */
.chart-card {
    margin-bottom: 20px;
    border-radius: 12px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.sub-tip {
    font-size: 12px;
    color: #909399;
    font-weight: 400;
}

.chart {
    width: 100%;
}

.chart-trend {
    height: 340px;
}

/* 表格 */
.table-card {
    margin-bottom: 20px;
    border-radius: 12px;
}

.pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}

/* 响应式 */
@media (max-width: 992px) {
    .summary-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .page-view-stats {
        padding: 12px;
    }

    .summary-value {
        font-size: 20px;
    }
}
</style>
