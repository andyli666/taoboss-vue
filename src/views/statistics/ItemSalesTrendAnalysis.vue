<template>
    <div class="item-sales-trend">
        <!-- 页面标题 -->
        <div class="page-header">
            <div>
                <h2>商品销售趋势分析</h2>
                <p class="page-desc">按月/年对比指定商品的销售额和销售数量趋势</p>
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

        <!-- 左右布局 -->
        <div class="split-layout">
            <!-- 左侧：商品销量排行 -->
            <div class="left-panel">
                <div class="left-search">
                    <el-input v-model="leftSearchKeyword" placeholder="商品ID/标题搜索" clearable @clear="loadItemRanking"
                        @keyup.enter="loadItemRanking">
                        <template #append>
                            <el-button @click="loadItemRanking">
                                <el-icon>
                                    <Search />
                                </el-icon>
                            </el-button>
                        </template>
                    </el-input>
                </div>
                <div class="item-list" v-loading="rankingLoading">
                    <div v-for="item in itemRankingList" :key="item.num_iid" class="item-card"
                        :class="{ 'active-card': selectedItemId === item.num_iid }" @click="selectItem(item.num_iid)">
                        <div class="item-image">
                            <el-image :src="item.pic_url" fit="cover" style="width: 50px; height: 50px">
                                <template #error>
                                    <div class="image-placeholder">无图</div>
                                </template>
                            </el-image>
                        </div>
                        <div class="item-info">
                            <div class="item-title">{{ item.title || '-' }}</div>
                            <div class="item-meta">
                                <span class="item-id">ID: {{ item.num_iid }}</span>
                                <span class="item-sold">销量: {{ item.sold_quantity || 0 }}</span>
                            </div>
                        </div>
                    </div>
                    <div v-if="itemRankingList.length === 0 && !rankingLoading" class="empty-tip">
                        暂无商品数据
                    </div>
                    <div class="pagination-wrapper" v-if="rankingTotal > 0">
                        <el-pagination v-model:current-page="rankingPage" v-model:page-size="rankingPageSize"
                            :page-sizes="[10, 20, 50]" :total="rankingTotal" layout="total, sizes, prev, pager, next"
                            @size-change="loadItemRanking" @current-change="loadItemRanking" small />
                    </div>
                </div>
            </div>

            <!-- 右侧：趋势图表 + 数据明细 -->
            <div class="right-panel">
                <!-- 图表卡片 -->
                <el-card class="chart-card">
                    <div class="chart-header">
                        <div class="chart-title">
                            <span>{{ currentItemTitle ? `${currentItemTitle} ` : '' }}{{ chartTitle }}</span>
                        </div>
                        <div class="chart-actions">
                            <el-radio-group v-model="chartMetric" size="small">
                                <el-radio-button label="amount">销售额</el-radio-button>
                                <el-radio-button label="quantity">销售数量</el-radio-button>
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
                    <div style="overflow-x: auto;">
                        <el-table :data="tableData" border stripe v-loading="loading"
                            style="width: 100%; min-width: 500px">
                            <el-table-column prop="period" label="周期" width="100" fixed="left" />

                            <!-- 单周期模式 -->
                            <template v-if="!isCompareMode">
                                <el-table-column prop="amount" label="销售额(元)" width="150" align="right">
                                    <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
                                </el-table-column>
                                <el-table-column prop="quantity" label="销售数量" width="120" align="right" />
                            </template>

                            <!-- 对比模式 -->
                            <template v-else>
                                <el-table-column :label="`${periodAName} 销售额(元)`" width="180" align="right">
                                    <template #default="{ row }">¥{{ formatMoney(row.amount_a) }}</template>
                                </el-table-column>
                                <el-table-column :label="`${periodAName} 销售数量`" width="180" align="right">
                                    <template #default="{ row }">{{ row.quantity_a ?? '-' }}</template>
                                </el-table-column>
                                <el-table-column :label="`${periodBName} 销售额(元)`" width="180" align="right">
                                    <template #default="{ row }">¥{{ formatMoney(row.amount_b) }}</template>
                                </el-table-column>
                                <el-table-column :label="`${periodBName} 销售数量`" width="180" align="right">
                                    <template #default="{ row }">{{ row.quantity_b ?? '-' }}</template>
                                </el-table-column>
                            </template>
                        </el-table>
                    </div>
                </el-card>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import { Download, Search } from '@element-plus/icons-vue'
import { getItemSalesTrend, getItemRanking } from '@/api/stat'
import { getItemList } from '@/api/cost'
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

// ==================== 状态定义 ====================
const loading = ref(false)
const rankingLoading = ref(false)
const chartRef = ref(null)
let chartInstance = null

// 筛选表单
const filterForm = reactive({
    compareType: 'month',
    periodA: '',
    periodB: ''
})

const chartMetric = ref('amount')
const leftSearchKeyword = ref('')
const selectedItemId = ref('')
const currentItemTitle = ref('')

// 商品排行列表
const itemRankingList = ref([])
const rankingPage = ref(1)
const rankingPageSize = ref(20)
const rankingTotal = ref(0)

// 趋势数据
const chartData = ref(null)
const tableData = ref([])
const periodAName = ref('')
const periodBName = ref('')
const isCompareMode = ref(false)

// ==================== 计算属性 ====================
const metricLabel = computed(() => chartMetric.value === 'amount' ? '销售额(元)' : '销售数量')

const chartTitle = computed(() => {
    const metricName = chartMetric.value === 'amount' ? '销售额' : '销售数量'
    if (!isCompareMode.value) {
        return `${periodAName.value} ${metricName}趋势`
    }
    return `${periodAName.value} vs ${periodBName.value} ${metricName}对比`
})

// ==================== 保存各对比类型的值 ====================
const savedFilters = reactive({
    month: { periodA: '', periodB: '' },
    year: { periodA: '', periodB: '' }
})

// ==================== 辅助函数 ====================
const getDefaultPeriod = (type) => {
    const now = new Date()
    if (type === 'month') {
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }
    return `${now.getFullYear()}`
}

// 加载商品销量排行
const loadItemRanking = async () => {
    rankingLoading.value = true
    try {
        const params = {
            page: rankingPage.value,
            page_size: rankingPageSize.value,
            keyword: leftSearchKeyword.value || ''
        }
        const res = await getItemRanking(params)
        if (res.data.code === 200) {
            itemRankingList.value = res.data.data.list || []
            rankingTotal.value = res.data.data.total || 0
            // 如果没有选中商品且有列表，默认选中第一个
            if (!selectedItemId.value && itemRankingList.value.length > 0) {
                selectedItemId.value = itemRankingList.value[0].num_iid
                currentItemTitle.value = itemRankingList.value[0].title
                loadTrendData()
            } else if (selectedItemId.value) {
                // 已有选中商品，刷新趋势
                loadTrendData()
            }
        }
    } catch (error) {
        ElMessage.error('加载商品排行失败')
    } finally {
        rankingLoading.value = false
    }
}

// 加载趋势数据
const loadTrendData = async () => {
    if (!selectedItemId.value) {
        return
    }
    if (!filterForm.periodA) {
        ElMessage.warning('请选择时间周期')
        return
    }

    loading.value = true
    try {
        const params = {
            type: filterForm.compareType,
            num_iid: selectedItemId.value,
            period_a: filterForm.periodA,
            period_b: filterForm.periodB || ''
        }
        const res = await getItemSalesTrend(params)
        if (res.data.code === 200) {
            chartData.value = res.data.data
            periodAName.value = res.data.data.period_a_name || filterForm.periodA
            periodBName.value = res.data.data.period_b_name || ''
            isCompareMode.value = !!filterForm.periodB && res.data.data.mode === 'compare'

            buildTableData()
            renderChart()
        }
    } catch (error) {
        ElMessage.error('加载趋势数据失败')
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
            quantity: item.quantity
        }))
    } else {
        const dataA = chartData.value.data[periodAName.value] || []
        const dataB = chartData.value.data[periodBName.value] || []
        const xAxis = chartData.value.xAxis

        tableData.value = xAxis.map((x, idx) => ({
            period: x,
            amount_a: dataA[idx]?.amount,
            quantity_a: dataA[idx]?.quantity,
            amount_b: dataB[idx]?.amount,
            quantity_b: dataB[idx]?.quantity
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
            : data.map(d => d.quantity)
        seriesData = [{
            name: chartMetric.value === 'amount' ? '销售额' : '销售数量',
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
            : dataA.map(d => d.quantity)
        const yDataB = chartMetric.value === 'amount'
            ? dataB.map(d => d.amount)
            : dataB.map(d => d.quantity)
        seriesData = [
            { name: periodAName.value, type: 'line', data: yDataA, smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2, color: '#409eff' } },
            { name: periodBName.value, type: 'line', data: yDataB, smooth: true, symbol: 'diamond', symbolSize: 6, lineStyle: { width: 2, color: '#f59e0b' } }
        ]
    }

    chartInstance.setOption({
        tooltip: {
            trigger: 'axis',
            valueFormatter: (value) => chartMetric.value === 'amount' ? `¥${value}` : `${value}件`
        },
        xAxis: { type: 'category', data: xAxisData, name: chartData.value.xAxisName || '日期' },
        yAxis: { type: 'value', name: chartMetric.value === 'amount' ? '销售额(元)' : '销售数量(件)' },
        series: seriesData,
        grid: { containLabel: true, top: 30, bottom: 30, left: 60, right: 40 }
    })
}

// 选中商品
const selectItem = (numIid) => {
    if (selectedItemId.value === numIid) return
    selectedItemId.value = numIid
    const selected = itemRankingList.value.find(item => item.num_iid === numIid)
    if (selected) {
        currentItemTitle.value = selected.title
    }
    loadTrendData()
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

// 切换对比类型
const handleCompareTypeChange = () => {
    const newType = filterForm.compareType
    const oldType = newType === 'month' ? 'year' : 'month'

    if (oldType === 'month') {
        savedFilters.month.periodA = filterForm.periodA
        savedFilters.month.periodB = filterForm.periodB
    } else {
        savedFilters.year.periodA = filterForm.periodA
        savedFilters.year.periodB = filterForm.periodB
    }

    if (newType === 'month') {
        filterForm.periodA = savedFilters.month.periodA || getDefaultPeriod('month')
        filterForm.periodB = savedFilters.month.periodB || ''
    } else {
        filterForm.periodA = savedFilters.year.periodA || getDefaultPeriod('year')
        filterForm.periodB = savedFilters.year.periodB || ''
    }

    loadTrendData()
}

// 查询
const searchData = () => {
    if (filterForm.compareType === 'month') {
        savedFilters.month.periodA = filterForm.periodA
        savedFilters.month.periodB = filterForm.periodB
    } else {
        savedFilters.year.periodA = filterForm.periodA
        savedFilters.year.periodB = filterForm.periodB
    }
    loadItemRanking()
    if (selectedItemId.value) {
        loadTrendData()
    }
}

// 重置
const resetFilter = () => {
    filterForm.compareType = 'month'
    savedFilters.month.periodA = getDefaultPeriod('month')
    savedFilters.month.periodB = ''
    savedFilters.year.periodA = getDefaultPeriod('year')
    savedFilters.year.periodB = ''
    filterForm.periodA = savedFilters.month.periodA
    filterForm.periodB = ''
    leftSearchKeyword.value = ''
    rankingPage.value = 1

    // 重置选中商品
    selectedItemId.value = ''
    currentItemTitle.value = ''

    // 重新加载排行（内部会自动选中第一个并刷新趋势）
    loadItemRanking()
}

// 导出
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
    loadItemRanking()
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (chartInstance) chartInstance.dispose()
})
</script>

<style scoped>
.item-sales-trend {
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

.filter-form .el-form-item {
    margin-bottom: 0;
    margin-right: 0 !important;
}

/* 调整第一个 radio 的右边距 */
.filter-form .el-radio:first-child {
    margin-right: 14px;
}

.split-layout {
    display: flex;
    gap: 20px;
    min-height: 600px;
}

.left-panel {
    width: 360px;
    flex-shrink: 0;
    background: white;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.left-search {
    margin-bottom: 8px;
}

.item-list {
    flex: 1;
    overflow-y: auto;
    max-height: calc(100vh - 300px);
}

.item-card {
    display: flex;
    gap: 12px;
    padding: 12px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s;
}

.item-card:hover {
    background-color: #f5f7fa;
    transform: translateX(2px);
}

.active-card {
    border-color: #409eff;
    background-color: #ecf5ff;
}

.item-image {
    flex-shrink: 0;
    width: 50px;
    height: 50px;
    border-radius: 4px;
    overflow: hidden;
    background: #f5f5f5;
}

.item-info {
    flex: 1;
    min-width: 0;
}

.item-title {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.item-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
}

.image-placeholder {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c0c4cc;
    font-size: 12px;
}

.right-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.chart-card,
.table-card {
    border-radius: 12px;
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

.chart-actions {
    flex-shrink: 0;
}

.chart-container {
    width: 100%;
    height: 350px;
}

.pagination-wrapper {
    margin-top: 12px;
    display: flex;
    justify-content: center;
}

.empty-tip {
    text-align: center;
    padding: 40px;
    color: #909399;
}
</style>