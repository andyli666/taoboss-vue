<template>
    <div class="order-sales-trend">
        <!-- 页面标题 -->
        <div class="page-header">
            <div>
                <h2>订单销售趋势分析</h2>
                <p class="page-desc">按月/年对比销售额和订单数量趋势</p>
            </div>
            <div class="header-actions">
                <!-- <el-button type="primary" @click="exportData">
                    <el-icon>
                        <Download />
                    </el-icon>
                    导出数据
                </el-button> -->
            </div>
        </div>

        <!-- 筛选栏 -->
        <el-card class="filter-card">
            <el-form :inline="true" :model="filterForm" class="filter-form">
                <el-form-item label="对比类型">
                    <el-radio-group v-model="filterForm.compareType" @change="handleCompareTypeChange">
                        <el-radio label="month">按月对比</el-radio>
                        <el-radio label="year">按年对比</el-radio>
                    </el-radio-group>
                </el-form-item>

                <!-- 按月对比 -->
                <template v-if="filterForm.compareType === 'month'">
                    <el-form-item label="月份A">
                        <el-date-picker v-model="filterForm.periodA" type="month" placeholder="选择月份" format="YYYY-MM"
                            value-format="YYYY-MM" style="width: 140px" />
                    </el-form-item>
                    <el-form-item label="月份B">
                        <el-date-picker v-model="filterForm.periodB" type="month" placeholder="选择月份（可选）"
                            format="YYYY-MM" value-format="YYYY-MM" style="width: 160px" clearable />
                    </el-form-item>
                </template>

                <!-- 按年对比 -->
                <template v-else>
                    <el-form-item label="年份A">
                        <el-date-picker v-model="filterForm.periodA" type="year" placeholder="选择年份" format="YYYY"
                            value-format="YYYY" style="width: 120px" />
                    </el-form-item>
                    <el-form-item label="年份B">
                        <el-date-picker v-model="filterForm.periodB" type="year" placeholder="选择年份（可选）" format="YYYY"
                            value-format="YYYY" style="width: 160px" clearable />
                    </el-form-item>
                </template>

                <el-form-item>
                    <el-button type="primary" @click="searchData">查询</el-button>
                    <el-button @click="resetFilter">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 图表卡片 -->
        <el-card class="chart-card">
            <div class="chart-header">
                <div class="chart-title">
                    <span>{{ chartTitle }}</span>
                </div>
                <div class="chart-actions">
                    <el-radio-group v-model="chartMetric" size="small">
                        <el-radio-button label="amount">销售额</el-radio-button>
                        <el-radio-button label="order_count">订单数量</el-radio-button>
                    </el-radio-group>
                </div>
            </div>
            <div ref="chartRef" class="chart-container"></div>
        </el-card>

        <!-- 数据表格 -->
        <el-card class="table-card">
            <template #header>
                <span>数据明细</span>
            </template>
            <el-table :data="tableData" border stripe v-loading="loading" style="width: 100%;">
                <el-table-column prop="period" label="周期" width="100" />
                <!-- 单模式显示 -->
                <template v-if="!isCompareMode">
                    <el-table-column prop="amount" label="销售额(元)" width="150" align="right">
                        <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
                    </el-table-column>
                    <el-table-column prop="order_count" label="订单数量" width="120" align="right" />
                </template>

                <!-- 对比模式显示 -->
                <template v-else>
                    <el-table-column :label="`${periodAName} ${yAxisLabel}`" width="180" align="right">
                        <template #default="{ row }">{{ formatValue(row.amount_a, row.order_count_a) }}</template>
                    </el-table-column>
                    <el-table-column :label="`${periodBName} ${yAxisLabel}`" width="180" align="right">
                        <template #default="{ row }">{{ formatValue(row.amount_b, row.order_count_b) }}</template>
                    </el-table-column>
                </template>
            </el-table>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { getOrderSalesTrend } from '@/api/stat'
import { formatMoney } from '@/utils/index'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    ToolboxComponent,
    DataZoomComponent,
    VisualMapComponent,
    MarkPointComponent,
    MarkLineComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册组件
echarts.use([
    LineChart,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    ToolboxComponent,
    DataZoomComponent,
    VisualMapComponent,
    MarkPointComponent,
    MarkLineComponent,
    CanvasRenderer
])

const loading = ref(false)
const chartRef = ref(null)
let chartInstance = null

const filterForm = reactive({
    compareType: 'month',
    periodA: '',
    periodB: ''
})

const chartMetric = ref('amount')
const chartData = ref(null)
const tableData = ref([])
const periodAName = ref('')
const periodBName = ref('')
const isCompareMode = ref(false)

// 计算图表标题
const chartTitle = computed(() => {
    const metricName = chartMetric.value === 'amount' ? '销售额' : '订单数量'
    if (!isCompareMode.value) {
        return `${periodAName.value} ${metricName}趋势`
    }
    return `${periodAName.value} vs ${periodBName.value} ${metricName}对比`
})

const yAxisLabel = computed(() => chartMetric.value === 'amount' ? '销售额(元)' : '订单数量(笔)')

// 格式化表格值
const formatValue = (amount, orderCount) => {
    if (chartMetric.value === 'amount') {
        return amount !== undefined ? `¥${formatMoney(amount)}` : '-'
    }
    return orderCount !== undefined ? orderCount : '-'
}

// 保存各对比类型的值
const savedFilters = reactive({
    month: { periodA: '', periodB: '' },
    year: { periodA: '', periodB: '' }
})

// 获取默认时间
const getDefaultPeriod = (type) => {
    const now = new Date()
    if (type === 'month') {
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }
    return `${now.getFullYear()}`
}

// 初始化默认值
const initDefaultValues = () => {
    if (filterForm.compareType === 'month') {
        if (!savedFilters.month.periodA) {
            savedFilters.month.periodA = getDefaultPeriod('month')
        }
        filterForm.periodA = savedFilters.month.periodA
        filterForm.periodB = savedFilters.month.periodB || ''
    } else {
        if (!savedFilters.year.periodA) {
            savedFilters.year.periodA = getDefaultPeriod('year')
        }
        filterForm.periodA = savedFilters.year.periodA
        filterForm.periodB = savedFilters.year.periodB || ''
    }
}

// 事件处理
const handleCompareTypeChange = () => {
    const newType = filterForm.compareType
    const oldType = newType === 'month' ? 'year' : 'month'

    // 保存旧类型的值
    if (oldType === 'month') {
        savedFilters.month.periodA = filterForm.periodA
        savedFilters.month.periodB = filterForm.periodB
    } else {
        savedFilters.year.periodA = filterForm.periodA
        savedFilters.year.periodB = filterForm.periodB
    }

    // 恢复新类型的值
    if (newType === 'month') {
        filterForm.periodA = savedFilters.month.periodA || getDefaultPeriod('month')
        filterForm.periodB = savedFilters.month.periodB || ''
    } else {
        filterForm.periodA = savedFilters.year.periodA || getDefaultPeriod('year')
        filterForm.periodB = savedFilters.year.periodB || ''
    }

    loadData()
}

const searchData = () => {
    // 保存当前值
    if (filterForm.compareType === 'month') {
        savedFilters.month.periodA = filterForm.periodA
        savedFilters.month.periodB = filterForm.periodB
    } else {
        savedFilters.year.periodA = filterForm.periodA
        savedFilters.year.periodB = filterForm.periodB
    }
    loadData()
}

const resetFilter = () => {
    filterForm.compareType = 'month'
    savedFilters.month.periodA = getDefaultPeriod('month')
    savedFilters.month.periodB = ''
    savedFilters.year.periodA = getDefaultPeriod('year')
    savedFilters.year.periodB = ''
    filterForm.periodA = savedFilters.month.periodA
    filterForm.periodB = ''
    loadData()
}

// 加载数据
const loadData = async () => {
    if (!filterForm.periodA) {
        ElMessage.warning('请选择时间周期')
        return
    }

    loading.value = true
    try {
        const params = {
            type: filterForm.compareType,
            period_a: filterForm.periodA,
            period_b: filterForm.periodB || ''
        }
        const res = await getOrderSalesTrend(params)
        if (res.data.code === 200) {
            chartData.value = res.data.data
            periodAName.value = res.data.data.period_a_name || filterForm.periodA
            periodBName.value = res.data.data.period_b_name || ''
            isCompareMode.value = !!filterForm.periodB && res.data.data.mode === 'compare'

            // 构建表格数据
            buildTableData()
            renderChart()
        }
    } catch (error) {
        ElMessage.error('加载失败')
    } finally {
        loading.value = false
    }
}

// 构建表格数据
const buildTableData = () => {
    if (!chartData.value) return

    if (chartData.value.mode === 'single') {
        tableData.value = chartData.value.data.map(item => ({
            period: item.xAxis,
            amount: item.amount,
            order_count: item.order_count
        }))
    } else {
        const dataA = chartData.value.data[periodAName.value] || []
        const dataB = chartData.value.data[periodBName.value] || []
        const xAxis = chartData.value.xAxis

        tableData.value = xAxis.map((x, idx) => ({
            period: x,
            amount_a: dataA[idx]?.amount,
            order_count_a: dataA[idx]?.order_count,
            amount_b: dataB[idx]?.amount,
            order_count_b: dataB[idx]?.order_count
        }))
    }
}

// 渲染图表
const renderChart = () => {
    if (!chartRef.value || !chartData.value) return
    if (chartInstance) chartInstance.dispose()

    chartInstance = echarts.init(chartRef.value)

    const xAxisData = chartData.value.xAxis || []
    let seriesData = []

    if (chartData.value.mode === 'single') {
        const data = chartData.value.data || []
        const yData = chartMetric.value === 'amount'
            ? data.map(d => d.amount)
            : data.map(d => d.order_count)
        seriesData = [{
            name: chartMetric.value === 'amount' ? '销售额' : '订单数量',
            type: 'line',
            data: yData,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { width: 2, color: '#409eff' },
            areaStyle: { opacity: 0.1, color: '#409eff' }
        }]
    } else {
        const dataA = chartData.value.data[periodAName.value] || []
        const dataB = chartData.value.data[periodBName.value] || []
        const yDataA = chartMetric.value === 'amount'
            ? dataA.map(d => d.amount)
            : dataA.map(d => d.order_count)
        const yDataB = chartMetric.value === 'amount'
            ? dataB.map(d => d.amount)
            : dataB.map(d => d.order_count)
        seriesData = [
            { name: periodAName.value, type: 'line', data: yDataA, smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2, color: '#409eff' } },
            { name: periodBName.value, type: 'line', data: yDataB, smooth: true, symbol: 'diamond', symbolSize: 6, lineStyle: { width: 2, color: '#f59e0b' } }
        ]
    }

    chartInstance.setOption({
        tooltip: { trigger: 'axis', valueFormatter: (value) => chartMetric.value === 'amount' ? `¥${value}` : `${value}笔` },
        xAxis: { type: 'category', data: xAxisData, name: chartData.value.xAxisName || '日期' },
        yAxis: { type: 'value', name: chartMetric.value === 'amount' ? '销售额(元)' : '订单数量(笔)' },
        series: seriesData,
        grid: { containLabel: true, top: 30, bottom: 20, left: 60, right: 40 }
    })
}

const exportData = () => {
    ElMessage.info('导出功能开发中')
}

// 监听指标切换
watch(chartMetric, () => {
    renderChart()
})

// 窗口大小变化
const handleResize = () => {
    if (chartInstance) chartInstance.resize()
}

onMounted(() => {
    initDefaultValues()
    loadData()
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (chartInstance) chartInstance.dispose()
})
</script>

<style scoped>
.order-sales-trend {
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

.header-actions {
    display: flex;
    gap: 12px;
}

.filter-card,
.chart-card,
.table-card {
    margin-bottom: 20px;
    border-radius: 12px;
}

.filter-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
}

/* 调整第一个 radio 的右边距 */
.filter-form .el-radio:first-child {
    margin-right: 14px;
}

.filter-form .el-form-item {
    margin-bottom: 0;
    margin-right: 0 !important;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.chart-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.chart-container {
    width: 100%;
    height: 400px;
}
</style>