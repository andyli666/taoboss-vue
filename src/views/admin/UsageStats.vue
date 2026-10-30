<template>
    <div class="usage-stats">
        <!-- 页面标题 -->
        <div class="page-header">
            <div>
                <h2>批量修改使用统计</h2>
                <p class="page-desc">按自然日统计各店铺使用了哪些批量修改功能，以及使用的是「范围修改」还是「列表修改」</p>
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

                <el-form-item label="功能">
                    <el-select v-model="filterForm.feature" placeholder="全部功能" clearable style="width: 180px">
                        <el-option v-for="item in featureOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </el-form-item>

                <el-form-item label="模式">
                    <el-select v-model="filterForm.mode" placeholder="全部模式" clearable style="width: 140px">
                        <el-option v-for="item in modeOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
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
                    <span>每日使用趋势</span>
                    <span class="sub-tip">左轴：使用次数 / 使用用户数　右轴：涉及修改对象数</span>
                </div>
            </template>
            <div v-if="hasTrendData" ref="trendChartRef" class="chart chart-trend"></div>
            <el-empty v-else description="所选区间暂无数据" :image-size="80" />
        </el-card>

        <!-- 功能分布 + 功能×模式 -->
        <div class="chart-row">
            <el-card class="chart-card">
                <template #header>
                    <div class="card-header">
                        <span>功能分布</span>
                        <el-radio-group v-model="pieMetric" size="small" @change="renderPieChart">
                            <el-radio-button label="usageCount">使用次数</el-radio-button>
                            <el-radio-button label="itemCount">涉及对象数</el-radio-button>
                        </el-radio-group>
                    </div>
                </template>
                <div v-if="hasFeatureData" ref="pieChartRef" class="chart chart-pie"></div>
                <el-empty v-else description="暂无功能数据" :image-size="80" />
            </el-card>

            <el-card class="chart-card">
                <template #header>
                    <div class="card-header">
                        <span>功能 × 模式</span>
                        <span class="sub-tip">按使用次数堆叠</span>
                    </div>
                </template>
                <div v-if="hasStackData" ref="stackChartRef" class="chart chart-stack"></div>
                <el-empty v-else description="暂无功能数据" :image-size="80" />
            </el-card>
        </div>

        <!-- 用户使用排行 -->
        <el-card class="chart-card">
            <template #header>
                <div class="card-header">
                    <span>用户使用排行</span>
                    <span class="sub-tip">按使用次数降序，取前 10 名</span>
                </div>
            </template>
            <div v-if="hasUserData" ref="userChartRef" class="chart" :style="{ height: userChartHeight + 'px' }">
            </div>
            <el-empty v-else description="暂无用户数据" :image-size="80" />
        </el-card>

        <!-- 用户明细 -->
        <el-card class="table-card">
            <template #header>
                <div class="card-header">
                    <span>用户明细</span>
                    <span class="sub-tip">展开可查看该用户的功能 / 模式明细</span>
                </div>
            </template>
            <el-table :data="stats.users" border stripe v-loading="loading" max-height="420"
                style="width: 100%">
                <el-table-column type="expand">
                    <template #default="{ row }">
                        <div class="expand-wrapper">
                            <el-table :data="row.features || []" size="small" border style="width: 100%">
                                <el-table-column prop="featureName" label="功能" min-width="150" />
                                <el-table-column prop="modeName" label="模式" width="110">
                                    <template #default="{ row: featureRow }">
                                        <el-tag size="small"
                                            :type="featureRow.mode === 'range' ? 'warning' : 'success'">
                                            {{ featureRow.modeName }}
                                        </el-tag>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="usageCount" label="使用次数" width="120" align="right">
                                    <template #default="{ row: featureRow }">
                                        {{ formatNumber(featureRow.usageCount) }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="itemCount" label="涉及修改对象数" width="150" align="right">
                                    <template #default="{ row: featureRow }">
                                        {{ formatNumber(featureRow.itemCount) }}
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="sellerNick" label="卖家昵称" min-width="160" />
                <el-table-column prop="usageCount" label="使用次数" width="120" align="right">
                    <template #default="{ row }">{{ formatNumber(row.usageCount) }}</template>
                </el-table-column>
                <el-table-column prop="itemCount" label="涉及修改对象数" width="150" align="right">
                    <template #default="{ row }">{{ formatNumber(row.itemCount) }}</template>
                </el-table-column>
                <el-table-column prop="lastUsedDate" label="最后使用日期" width="140" />
            </el-table>
        </el-card>

        <!-- 明细行 -->
        <el-card class="table-card">
            <template #header>
                <div class="card-header">
                    <span>使用明细（日期 × 用户 × 功能 × 模式）</span>
                    <span class="sub-tip">合计 {{ formatNumber(rowsTotal) }} 条记录</span>
                </div>
            </template>
            <el-table :data="pagedRows" border stripe v-loading="loading" style="width: 100%">
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="sellerNick" label="卖家昵称" min-width="150" />
                <el-table-column prop="featureName" label="功能" min-width="150" />
                <el-table-column prop="modeName" label="模式" width="120">
                    <template #default="{ row }">
                        <el-tag size="small" :type="row.mode === 'range' ? 'warning' : 'success'">
                            {{ row.modeName }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="usageCount" label="使用次数" width="120" align="right">
                    <template #default="{ row }">{{ formatNumber(row.usageCount) }}</template>
                </el-table-column>
                <el-table-column prop="itemCount" label="涉及修改对象数" width="150" align="right">
                    <template #default="{ row }">{{ formatNumber(row.itemCount) }}</template>
                </el-table-column>
                <el-table-column prop="successCount" label="成功数" width="110" align="right">
                    <template #default="{ row }">{{ formatNumber(row.successCount) }}</template>
                </el-table-column>
                <el-table-column prop="failCount" label="失败数" width="110" align="right">
                    <template #default="{ row }">
                        <span :class="{ 'fail-count': row.failCount > 0 }">{{ formatNumber(row.failCount) }}</span>
                    </template>
                </el-table-column>
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
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getUsageStatsDaily } from '@/api/usageStats'
import { dateShortcuts, getDefaultDateRange } from '@/utils/index'
import dayjs from 'dayjs'

// 注册 ECharts 组件
echarts.use([
    LineChart,
    PieChart,
    BarChart,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    CanvasRenderer
])

// ==================== 常量 ====================
// 功能编码与后端保持一致，顺序固定
const featureOptions = [
    { value: 'price', label: '批量改价' },
    { value: 'stock', label: '批量改库存' },
    { value: 'title', label: '批量改标题' },
    { value: 'shop_title', label: '批量改导购标题' },
    { value: 'sku_prop_name', label: '批量修改SKU名称' },
    { value: 'cat_prop', label: '批量修改类目属性' },
    { value: 'food_prop', label: '批量修改食品属性' }
]

const modeOptions = [
    { value: 'range', label: '范围修改' },
    { value: 'list', label: '列表修改' }
]

const CHART_COLORS = ['#0089FA', '#36CFC9', '#FFA940', '#F46615', '#9B8AFA', '#00A870', '#EB6FBD']

// ==================== 状态 ====================
const loading = ref(false)

const filterForm = reactive({
    dateRange: getDefaultDateRange(),
    sellerNick: '',
    feature: '',
    mode: ''
})

const emptyStats = () => ({
    summary: { userCount: 0, usageCount: 0, itemCount: 0, successCount: 0, failCount: 0 },
    dates: [],
    daily: [],
    features: [],
    users: [],
    rows: []
})

const stats = ref(emptyStats())
const pieMetric = ref('usageCount')

const rowsPage = reactive({
    current: 1,
    pageSize: 20
})

// 图表实例
const trendChartRef = ref(null)
const pieChartRef = ref(null)
const stackChartRef = ref(null)
const userChartRef = ref(null)
const chartInstances = { trend: null, pie: null, stack: null, user: null }

// ==================== 计算属性 ====================
const formatNumber = (value) => {
    const num = Number(value) || 0
    return num.toLocaleString('zh-CN')
}

const summaryCards = computed(() => {
    const summary = stats.value.summary || {}
    return [
        { label: '使用用户数', value: formatNumber(summary.userCount), color: '#0089FA' },
        { label: '使用次数', value: formatNumber(summary.usageCount), color: '#0089FA' },
        { label: '涉及修改对象数', value: formatNumber(summary.itemCount), color: '#36CFC9' },
        { label: '成功数', value: formatNumber(summary.successCount), color: '#00A870' },
        { label: '失败数', value: formatNumber(summary.failCount), color: '#F46615' }
    ]
})

const hasTrendData = computed(() => (stats.value.dates || []).length > 0 && (stats.value.daily || []).length > 0)
const hasFeatureData = computed(() => (stats.value.features || []).length > 0)
const hasUserData = computed(() => (stats.value.users || []).length > 0)

// 功能 × 模式聚合（按功能编码固定顺序）
const stackRows = computed(() => {
    const rows = stats.value.rows || []
    const order = featureOptions.map((item) => item.value)
    const map = new Map()
    rows.forEach((row) => {
        if (!map.has(row.feature)) {
            map.set(row.feature, { feature: row.feature, featureName: row.featureName, range: 0, list: 0 })
        }
        const entry = map.get(row.feature)
        if (row.mode === 'range') {
            entry.range += row.usageCount || 0
        } else if (row.mode === 'list') {
            entry.list += row.usageCount || 0
        }
    })
    const known = order.filter((code) => map.has(code)).map((code) => map.get(code))
    const unknown = Array.from(map.values()).filter((entry) => !order.includes(entry.feature))
    return known.concat(unknown)
})

const hasStackData = computed(() => stackRows.value.length > 0)

const topUsers = computed(() => (stats.value.users || []).slice(0, 10))
const userChartHeight = computed(() => Math.max(320, topUsers.value.length * 32 + 90))

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
        yAxis: [
            {
                type: 'value',
                name: '次数 / 人数',
                minInterval: 1,
                nameTextStyle: { color: '#86909C' },
                axisLabel: { color: '#86909C' }
            },
            {
                type: 'value',
                name: '涉及对象数',
                minInterval: 1,
                nameTextStyle: { color: '#86909C' },
                axisLabel: { color: '#86909C' },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: '使用次数',
                type: 'line',
                smooth: true,
                showSymbol: true,
                data: daily.map((item) => item.usageCount || 0),
                itemStyle: { color: '#0089FA' },
                lineStyle: { width: 2 }
            },
            {
                name: '涉及修改对象数',
                type: 'line',
                smooth: true,
                yAxisIndex: 1,
                showSymbol: true,
                data: daily.map((item) => item.itemCount || 0),
                itemStyle: { color: '#36CFC9' },
                lineStyle: { width: 2 }
            },
            {
                name: '使用用户数',
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

const pieMetricLabel = computed(() => (pieMetric.value === 'usageCount' ? '使用次数' : '涉及对象数'))

const renderPieChart = () => {
    if (!pieChartRef.value || !hasFeatureData.value) return
    const data = (stats.value.features || []).map((item) => ({
        name: item.featureName,
        value: item[pieMetric.value] || 0
    }))
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: (params) =>
                `${params.marker}${params.name}<br/>${pieMetricLabel.value}：${formatNumber(params.value)}（${params.percent}%）`
        },
        legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#4E5969' } },
        color: CHART_COLORS,
        series: [
            {
                name: '功能分布',
                type: 'pie',
                radius: ['38%', '62%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: true,
                itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
                label: { show: false },
                emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold', formatter: '{b}\n{c}' } },
                data
            }
        ]
    }
    const chart = getChart('pie', pieChartRef.value)
    chart.setOption(option, true)
    chart.resize()
}

const renderStackChart = () => {
    if (!stackChartRef.value || !hasStackData.value) return
    const rowsData = stackRows.value
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            valueFormatter: (value) => formatNumber(value)
        },
        legend: { top: 0, icon: 'roundRect' },
        grid: { left: 16, right: 24, top: 48, bottom: 12, containLabel: true },
        xAxis: {
            type: 'category',
            data: rowsData.map((item) => item.featureName),
            axisLabel: {
                color: '#86909C',
                interval: 0,
                rotate: rowsData.length > 5 ? 25 : 0,
                hideOverlap: false
            }
        },
        yAxis: {
            type: 'value',
            minInterval: 1,
            axisLabel: { color: '#86909C' }
        },
        series: [
            {
                name: '范围修改',
                type: 'bar',
                stack: 'total',
                barMaxWidth: 36,
                itemStyle: { color: '#0089FA' },
                data: rowsData.map((item) => item.range)
            },
            {
                name: '列表修改',
                type: 'bar',
                stack: 'total',
                barMaxWidth: 36,
                itemStyle: { color: '#36CFC9' },
                data: rowsData.map((item) => item.list)
            }
        ]
    }
    const chart = getChart('stack', stackChartRef.value)
    chart.setOption(option, true)
    chart.resize()
}

const renderUserChart = () => {
    if (!userChartRef.value || !hasUserData.value) return
    // ECharts 类目轴自下而上排列，反转后使用次数最多的排在最上方
    const users = [...topUsers.value].reverse()
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                const item = params[0]
                const user = users[item.dataIndex]
                return `${item.marker}${user.sellerNick}<br/>使用次数：${formatNumber(item.value)}<br/>涉及对象数：${formatNumber(user.itemCount)}<br/>最后使用：${user.lastUsedDate || '-'}`
            }
        },
        grid: { left: 16, right: 48, top: 16, bottom: 12, containLabel: true },
        xAxis: {
            type: 'value',
            minInterval: 1,
            axisLabel: { color: '#86909C' }
        },
        yAxis: {
            type: 'category',
            data: users.map((item) => item.sellerNick),
            axisLabel: { color: '#4E5969', width: 120, overflow: 'truncate' }
        },
        series: [
            {
                name: '使用次数',
                type: 'bar',
                barMaxWidth: 20,
                itemStyle: { color: '#0089FA', borderRadius: [0, 4, 4, 0] },
                label: { show: true, position: 'right', color: '#4E5969' },
                data: users.map((item) => item.usageCount || 0)
            }
        ]
    }
    const chart = getChart('user', userChartRef.value)
    chart.setOption(option, true)
    chart.resize()
}

const renderCharts = () => {
    // 无数据的图表先销毁旧实例，避免容器重建后仍保留脏数据
    if (!hasTrendData.value) disposeChart('trend')
    if (!hasFeatureData.value) disposeChart('pie')
    if (!hasStackData.value) disposeChart('stack')
    if (!hasUserData.value) disposeChart('user')

    renderTrendChart()
    renderPieChart()
    renderStackChart()
    renderUserChart()
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

    loading.value = true
    try {
        const params = {}
        if (filterForm.dateRange && filterForm.dateRange.length === 2) {
            params.startDate = filterForm.dateRange[0]
            params.endDate = filterForm.dateRange[1]
        }
        const sellerNick = filterForm.sellerNick.trim()
        if (sellerNick) params.sellerNick = sellerNick
        if (filterForm.feature) params.feature = filterForm.feature
        if (filterForm.mode) params.mode = filterForm.mode

        const res = await getUsageStatsDaily(params)
        if (res.data.code === 0) {
            stats.value = res.data.data || emptyStats()
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
    filterForm.feature = ''
    filterForm.mode = ''
    pieMetric.value = 'usageCount'
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
.usage-stats {
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
    grid-template-columns: repeat(5, 1fr);
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

.chart-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.chart-row .chart-card {
    margin-bottom: 20px;
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

.chart-trend,
.chart-pie,
.chart-stack {
    height: 340px;
}

/* 表格 */
.table-card {
    margin-bottom: 20px;
    border-radius: 12px;
}

.expand-wrapper {
    padding: 8px 16px 8px 48px;
    background: #fafbfc;
}

.fail-count {
    color: #F46615;
    font-weight: 600;
}

.pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}

/* 响应式 */
@media (max-width: 1200px) {
    .summary-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 992px) {
    .chart-row {
        grid-template-columns: 1fr;
        gap: 0;
    }

    .summary-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .usage-stats {
        padding: 12px;
    }

    .summary-value {
        font-size: 20px;
    }
}
</style>
