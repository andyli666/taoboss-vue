<template>
    <div class="region-sales-analysis">
        <!-- 页面标题 -->
        <div class="page-header">
            <div>
                <h2>地区销售对比分析</h2>
                <p class="page-desc">按省份对比销售额，支持周期对比</p>
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
            <!-- 左侧：中国地图 -->
            <div class="left-panel">
                <div class="map-header">
                    <span class="map-title">各地区累计销售额</span>
                    <div class="map-actions">
                        <el-radio-group v-if="isCompareMode" v-model="mapPeriod" size="small" @change="switchMapPeriod">
                            <el-radio-button :label="'A'">{{ periodAName }}</el-radio-button>
                            <el-radio-button :label="'B'">{{ periodBName || '周期B' }}</el-radio-button>
                        </el-radio-group>
                        <div class="map-legend">
                            <span>低</span>
                            <span class="legend-gradient"></span>
                            <span>高</span>
                        </div>
                    </div>
                </div>
                <div ref="mapChartRef" class="map-container" v-loading="mapLoading"></div>
            </div>

            <!-- 右侧：横向柱状图排行 -->
            <div class="right-panel">
                <div class="rank-header">
                    <span class="rank-title">各地区销售额排行</span>
                </div>
                <div ref="barChartRef" class="bar-container" v-loading="barLoading"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { getRegionSalesAnalysis } from '@/api/stat'
import * as echarts from 'echarts/core'
import { MapChart, BarChart } from 'echarts/charts'
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    VisualMapComponent,
    ToolboxComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册组件
echarts.use([
    MapChart,
    BarChart,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    VisualMapComponent,
    ToolboxComponent,
    CanvasRenderer
])

// 动态加载中国地图 GeoJSON
const registerChinaMap = async () => {
    const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    const data = await response.json()
    echarts.registerMap('china', { geoJSON: data })
}

// 状态
const mapLoading = ref(false)
const barLoading = ref(false)
const mapChartRef = ref(null)
const barChartRef = ref(null)
let mapChart = null
let barChart = null

// 筛选表单
const filterForm = reactive({
    compareType: 'month',
    periodA: '',
    periodB: ''
})

// 保存各对比类型的值
const savedFilters = reactive({
    month: { periodA: '', periodB: '' },
    year: { periodA: '', periodB: '' }
})

// 数据
const chartData = ref(null)
const periodAName = ref('')
const periodBName = ref('')
const isCompareMode = ref(false)

// ==================== 辅助函数 ====================
const getDefaultPeriod = (type) => {
    const now = new Date()
    if (type === 'month') {
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }
    return `${now.getFullYear()}`
}

// 安全获取数值
const safeNumber = (value) => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
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

// 省份名称映射：后端短名 → 地图标准全名
const provinceMap = {
    "上海": "上海市",
    "北京": "北京市",
    "天津": "天津市",
    "重庆": "重庆市",
    "河北": "河北省",
    "山西": "山西省",
    "辽宁": "辽宁省",
    "吉林": "吉林省",
    "黑龙江": "黑龙江省",
    "江苏": "江苏省",
    "浙江": "浙江省",
    "安徽": "安徽省",
    "福建": "福建省",
    "江西": "江西省",
    "山东": "山东省",
    "河南": "河南省",
    "湖北": "湖北省",
    "湖南": "湖南省",
    "广东": "广东省",
    "海南": "海南省",
    "四川": "四川省",
    "贵州": "贵州省",
    "云南": "云南省",
    "陕西": "陕西省",
    "甘肃": "甘肃省",
    "青海": "青海省",
    "台湾": "台湾省",
    "内蒙古": "内蒙古自治区",
    "广西": "广西壮族自治区",
    "西藏": "西藏自治区",
    "宁夏": "宁夏回族自治区",
    "新疆": "新疆维吾尔自治区",
    "香港": "香港特别行政区",
    "澳门": "澳门特别行政区"
}
// 新增状态
const mapPeriod = ref('A')

// 切换地图显示周期
const switchMapPeriod = () => {
    renderMap()
}

// 修改 renderMap 方法
const renderMap = () => {
    if (!mapChartRef.value || !chartData.value) return
    if (mapChart) mapChart.dispose()

    mapChart = echarts.init(mapChartRef.value)

    const data = chartData.value.regionData || []

    // 根据当前选中的周期选择数据
    let mapData, periodName
    if (isCompareMode.value && mapPeriod.value === 'B') {
        mapData = data.map(item => ({
            name: provinceMap[item.province] || item.province,
            value: safeNumber(item.amount_b || 0)
        }))
        periodName = periodBName.value
    } else {
        mapData = data.map(item => ({
            name: provinceMap[item.province] || item.province,
            value: safeNumber(item.amount_a)
        }))
        periodName = periodAName.value
    }

    const values = mapData.map(item => item.value)
    const maxValue = values.length > 0 ? Math.max(...values) : 100000

    const option = {
        title: {
            text: '',
            left: 'center',
            top: 5,
            textStyle: { fontSize: 16, fontWeight: 'bold' }
        },
        tooltip: {
            trigger: 'item',
            formatter: (params) => {
                const val = safeNumber(params.value)
                return `${params.name}<br/>销售额: ¥${val.toFixed(2)}`
            }
        },
        visualMap: {
            min: 0,
            max: maxValue || 100000,
            left: 'left',
            top: 'bottom',
            text: ['高', '低'],
            calculable: true,
            inRange: { color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'] }
        },
        series: [{
            name: periodName,
            type: 'map',
            map: 'china',
            roam: true,
            zoom: 1.2,
            label: {
                show: true,
                fontSize: 10,
                formatter: (params) => {
                    return params.name.length > 3 ? params.name.substring(0, 3) : params.name
                }
            },
            emphasis: {
                label: { show: true, fontSize: 12 }
            },
            data: mapData
        }]
    }

    mapChart.setOption(option)
}

// 渲染横向柱状图
const renderBarChart = () => {
    if (!barChartRef.value || !chartData.value) return
    if (barChart) barChart.dispose()

    barChart = echarts.init(barChartRef.value)

    const data = chartData.value.regionData || []
    // 按周期A销售额降序排序，并确保数值安全
    const sortedData = [...data].map(item => ({
        ...item,
        amount_a: safeNumber(item.amount_a),
        amount_b: safeNumber(item.amount_b || 0)
    })).sort((a, b) => b.amount_a - a.amount_a)

    const provinces = sortedData.map(item => item.province)
    const amountA = sortedData.map(item => item.amount_a)
    const amountB = sortedData.map(item => item.amount_b)

    const seriesData = [
        {
            name: periodAName.value,
            type: 'bar',
            data: amountA,
            itemStyle: { color: '#409eff', borderRadius: [0, 4, 4, 0] },
            label: {
                show: true,
                position: 'right',
                formatter: (params) => {
                    const val = safeNumber(params.value)
                    if (val >= 10000) return (val / 10000).toFixed(1) + '万'
                    return val.toFixed(0)
                }
            }
        }
    ]

    // 对比模式下添加第二组数据
    if (isCompareMode.value) {
        seriesData.push({
            name: periodBName.value,
            type: 'bar',
            data: amountB,
            itemStyle: { color: '#f59e0b', borderRadius: [0, 4, 4, 0] },
            label: {
                show: true,
                position: 'right',
                formatter: (params) => {
                    const val = safeNumber(params.value)
                    if (val >= 10000) return (val / 10000).toFixed(1) + '万'
                    return val.toFixed(0)
                }
            }
        })
    }

    const option = {
        title: {
            text: '',
            left: 'center',
            top: 5,
            textStyle: { fontSize: 14 }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                let result = params[0].name + '<br/>'
                params.forEach(p => {
                    const val = safeNumber(p.value)
                    result += `${p.marker} ${p.seriesName}: ¥${val.toFixed(2)}<br/>`
                })
                return result
            }
        },
        legend: {
            data: isCompareMode.value ? [periodAName.value, periodBName.value] : [periodAName.value],
            left: 'right',
            top: 0
        },
        grid: {
            left: '12%',
            right: '8%',
            top: '12%',
            bottom: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: '销售额(元)',
            axisLabel: {
                formatter: (value) => {
                    if (value >= 10000) return (value / 10000).toFixed(1) + '万'
                    return value
                }
            }
        },
        yAxis: {
            type: 'category',
            data: provinces,
            name: '省份',
            axisLabel: {
                fontSize: 11,
                rotate: 0
            },
            inverse: true // 关键：反转 Y 轴，让第一个数据（最高值）显示在顶部
        },
        series: seriesData
    }

    barChart.setOption(option)
}

// 加载数据
const loadData = async () => {
    if (!filterForm.periodA) {
        ElMessage.warning('请选择时间周期')
        return
    }

    mapLoading.value = true
    barLoading.value = true

    try {
        const params = {
            type: filterForm.compareType,
            period_a: filterForm.periodA,
            period_b: filterForm.periodB || ''
        }
        const res = await getRegionSalesAnalysis(params)
        if (res.data.code === 200) {
            chartData.value = res.data.data
            // 确保 regionData 存在
            if (!chartData.value.regionData) {
                chartData.value.regionData = []
            }
            periodAName.value = res.data.data.period_a_name || filterForm.periodA
            periodBName.value = res.data.data.period_b_name || ''
            isCompareMode.value = !!filterForm.periodB && filterForm.periodB !== filterForm.periodA

            // 渲染地图和柱状图
            await nextTick()
            renderMap()
            renderBarChart()
        } else {
            ElMessage.error(res.data.message || '加载数据失败')
        }
    } catch (error) {
        console.error('加载数据失败:', error)
        ElMessage.error('加载数据失败')
    } finally {
        mapLoading.value = false
        barLoading.value = false
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

    loadData()
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
    loadData()
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
    loadData()
}

// 导出
const exportData = () => {
    ElMessage.info('导出功能开发中')
}

// 窗口大小变化
const handleResize = () => {
    if (mapChart) mapChart.resize()
    if (barChart) barChart.resize()
}

// 监听地图容器大小变化
watch([mapChartRef, barChartRef], () => {
    setTimeout(() => {
        if (mapChart) mapChart.resize()
        if (barChart) barChart.resize()
    }, 100)
})

onMounted(async () => {
    await registerChinaMap()
    initDefaultValues()
    loadData()
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (mapChart) mapChart.dispose()
    if (barChart) barChart.dispose()
})
</script>

<style scoped>
.region-sales-analysis {
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
    flex: 1;
    min-width: 400px;
    background: white;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
}

.map-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 8px;
}

.map-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.map-legend {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #909399;
}

.legend-gradient {
    width: 100px;
    height: 12px;
    background: linear-gradient(90deg, #e0f3f8, #abd9e9, #74add1, #4575b4, #313695);
    border-radius: 6px;
}

.map-container {
    flex: 1;
    width: 100%;
    min-height: 500px;
}

.right-panel {
    width: 450px;
    flex-shrink: 0;
    background: white;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
}

.rank-header {
    margin-bottom: 16px;
    padding: 0 8px;
}

.rank-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.bar-container {
    flex: 1;
    width: 100%;
    min-height: 500px;
}

.map-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}
</style>