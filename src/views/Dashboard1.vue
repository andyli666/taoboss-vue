<template>
  <div class="trade-dashboard">
    <!-- 头部卡片 -->
    <div class="header-card">
      <div class="header-top">
        <div>
          <h1>
            <span class="h1-emoji">💰</span>
            <span class="h1-text">订单数据统计看板</span>
          </h1>
          <div class="sub">按付款时间统计 | 支持实时/天/月/年区间范围统计</div>
        </div>
        <div class="range-hint">📌 {{ rangeLabel }}</div>
      </div>
      <el-divider />

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-group">
          <el-radio-group v-model="granularity" size="default" @change="onGranularityChange">
            <el-radio-button label="realtime">实时</el-radio-button>
            <el-radio-button label="day">按天</el-radio-button>
            <el-radio-button label="month">按月</el-radio-button>
            <el-radio-button label="year">按年</el-radio-button>
          </el-radio-group>

          <template v-if="granularity === 'day'">
            <el-date-picker v-model="dayRange" type="daterange" range-separator="至" start-placeholder="开始日期"
              end-placeholder="结束日期" :clearable="false" :shortcuts="dayShortcuts" format="YYYY-MM-DD"
              value-format="YYYY-MM-DD" style="width: 320px" @change="refreshStats" />
          </template>

          <template v-if="granularity === 'month'">
            <el-date-picker v-model="monthRange" type="monthrange" range-separator="至" start-placeholder="开始月份"
              end-placeholder="结束月份" :clearable="false" :shortcuts="monthShortcuts" format="YYYY-MM"
              value-format="YYYY-MM" style="width: 300px" @change="refreshStats" />
          </template>

          <template v-if="granularity === 'year'">
            <el-select v-model="yearStart" placeholder="起始年份" style="width: 120px" @change="refreshStats">
              <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
            </el-select>
            <span style="color: #6c86a3"> — </span>
            <el-select v-model="yearEnd" placeholder="结束年份" style="width: 120px" @change="refreshStats">
              <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
            </el-select>
          </template>

          <el-button type="primary" @click="refreshStats" :icon="Refresh">刷新统计</el-button>
        </div>
        <!-- <div class="badge-tip">📊 点击卡片切换图表趋势</div> -->
      </div>
    </div>

    <!-- KPI 卡片区 -->
    <div class="stats-grid">
      <div v-for="metric in metrics" :key="metric.key" class="stat-card"
        :class="{ 'stat-card-active': activeChartMetric === metric.key }" @click="setActiveMetric(metric.key)">
        <div class="stat-title">
          <span class="stat-icon">{{ metric.icon }}</span>
          {{ metric.title }}
        </div>
        <div class="stat-value">
          <span v-if="metric.key === 'paidTrades'">{{ formatNumber(aggregated.totalPaidTrades) }}</span>
          <span v-else-if="metric.key === 'paidAmount'">¥{{ aggregated.totalPaidAmount.toFixed(2) }}</span>
          <span v-else-if="metric.key === 'avgTradePrice'">¥{{ avgTradePrice }}</span>
          <span v-else-if="metric.key === 'confirmedAmount'">¥{{ aggregated.totalConfirmedAmount.toFixed(2) }}</span>
          <span v-else-if="metric.key === 'unconfirmedAmount'">¥{{ aggregated.totalUnconfirmedAmount.toFixed(2)
          }}</span>
          <span v-else-if="metric.key === 'cost'">¥{{ aggregated.totalCost.toFixed(2) }}</span>
          <span v-else-if="metric.key === 'profit'">¥{{ aggregated.totalProfit.toFixed(2) }}</span>
        </div>
        <div class="stat-unit">{{ metric.unit }}</div>
        <div class="stat-sub">
          <span v-if="metric.key === 'profit'">毛利率 {{ marginRate }}%</span>
          <span v-else>{{ metric.sub }}</span>
        </div>
      </div>
    </div>

    <!-- 左右结构：图表 + 表格 -->
    <div class="insight-row">
      <!-- 左侧：ECharts 图表 -->
      <div class="chart-box">
        <div class="section-title">
          📊 {{ chartTitle }} 趋势
          <span v-if="granularity === 'realtime'" class="realtime-badge">实时数据(今日分时/小时级)</span>
          <span v-else>(按{{ granularityText }})</span>
          <!-- <el-tag size="small" type="info" effect="plain">付款时间口径</el-tag> -->
        </div>
        <div ref="chartRef" class="echart-box"></div>
      </div>

      <!-- 右侧：明细表格 -->
      <div class="table-box">
        <div class="section-title">
          📋 周期明细
          <span v-if="granularity === 'realtime'">(今日分时 / 小时级)</span>
          <span v-else>(按{{ granularityText }})</span>
        </div>
        <div class="table-wrapper">
          <el-table :data="periodDetails" border stripe size="small" max-height="400" style="width: 100%">
            <el-table-column prop="period_label" label="周期" min-width="90">
              <template #default="scope">
                <span class="badge-period">{{ scope.row.period_label || scope.row.periodLabel || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="支付订单数" align="right" sortable>
              <template #default="scope">{{ scope.row.count.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="amount" label="付款金额(¥)" align="right" sortable>
              <template #default="scope">¥{{ scope.row.amount.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="cost" label="货品成本(¥)" align="right">
              <template #default="scope">¥{{ scope.row.cost.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="profit" label="毛利(¥)" align="right">
              <template #default="scope">
                <span :style="{ color: scope.row.profit >= 0 ? '#10b981' : '#ef4444' }">
                  ¥{{ scope.row.profit.toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <!-- <el-table-column prop="confirmedAmount" label="确认收货金额(¥)" align="right">
              <template #default="scope">¥{{ scope.row.confirmedAmount.toFixed(2) }}</template>
            </el-table-column> -->
          </el-table>
          <div v-if="periodDetails.length === 0" class="empty-state">所选周期内无付款订单数据</div>
        </div>
      </div>
    </div>

    <!-- <footer>统计口径：仅已付款订单（按付款时间）。支持实时(今日分时)、天/月/年区间范围，点击卡片切换图表展示的指标趋势。</footer> -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { getTradeStatistics } from '@/api/trade'
// ECharts 按需引入
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

dayjs.extend(utc)
dayjs.extend(customParseFormat)

// ==================== 常量定义 ====================
const metrics = [
  { key: 'paidTrades', title: '支付订单数', icon: '✅', unit: '笔', sub: '已付款订单总数' },
  { key: 'paidAmount', title: '付款金额', icon: '💰', unit: '元', sub: '订单销售金额' },
  { key: 'avgTradePrice', title: '客单价', icon: '🧾', unit: '元/单', sub: '付款金额÷订单数' },
  { key: 'cost', title: '货品成本', icon: '📦', unit: '元', sub: '已付款订单成本' },
  { key: 'profit', title: '毛利', icon: '📈', unit: '元', sub: '毛利率展示' },
  { key: 'confirmedAmount', title: '已确认收货金额', icon: '📦', unit: '元', sub: '交易完成' },
  { key: 'unconfirmedAmount', title: '未确认收货金额', icon: '⏳', unit: '元', sub: '已发货未确认' }
]

const dayShortcuts = [
  { text: '今天', value: () => { const today = new Date(); return [today, today]; } },
  { text: '昨天', value: () => { const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); return [yesterday, yesterday]; } },
  { text: '最近7天', value: () => { const end = new Date(); const start = new Date(); start.setTime(start.getTime() - 7 * 24 * 3600 * 1000); return [start, end]; } },
  { text: '最近30天', value: () => { const end = new Date(); const start = new Date(); start.setTime(start.getTime() - 30 * 24 * 3600 * 1000); return [start, end]; } },
  { text: '本月', value: () => [dayjs().startOf('month').toDate(), dayjs().endOf('month').toDate()] },
  { text: '上个月', value: () => [dayjs().subtract(1, 'month').startOf('month').toDate(), dayjs().subtract(1, 'month').endOf('month').toDate()] }
]

const monthShortcuts = [
  { text: '今年至今', value: () => [dayjs().startOf('year').toDate(), dayjs().endOf('year').toDate()] },
  { text: '最近6个月', value: () => [dayjs().subtract(5, 'month').startOf('month').toDate(), dayjs().endOf('month').toDate()] },
  { text: '去年', value: () => [dayjs().subtract(1, 'year').startOf('year').toDate(), dayjs().subtract(1, 'year').endOf('year').toDate()] }
]

// ==================== 模拟数据生成 ====================
const generateMockTrades = () => {
  const trades = []
  const startDate = new Date(2021, 0, 1).getTime()
  const endDate = new Date(2025, 11, 31).getTime()
  const tradeCount = Math.floor(Math.random() * 1300) + 1800

  for (let i = 0; i < tradeCount; i++) {
    const createTimestamp = startDate + Math.random() * (endDate - startDate)
    const payDelayHours = Math.random() * 72
    let payTimestamp = createTimestamp + payDelayHours * 3600 * 1000
    payTimestamp = Math.min(payTimestamp, endDate)

    let amount = 0
    const base = Math.exp(Math.random() * 3.4)
    amount = Number((base * 22 + 18).toFixed(2))
    if (Math.random() < 0.12) amount = amount * (Math.random() * 2.2 + 1.2)
    amount = Math.min(amount, 4800)
    amount = Number(amount.toFixed(2))

    const payAge = Date.now() - payTimestamp
    let confirmStatus = 'unconfirmed'
    if (payAge > 12 * 24 * 3600 * 1000) confirmStatus = Math.random() < 0.85 ? 'confirmed' : 'unconfirmed'
    else if (payAge > 5 * 24 * 3600 * 1000) confirmStatus = Math.random() < 0.6 ? 'confirmed' : 'unconfirmed'
    else confirmStatus = Math.random() < 0.25 ? 'confirmed' : 'unconfirmed'

    let costRatio = 0.35 + Math.random() * 0.38
    costRatio = Math.min(0.75, costRatio)
    const cost = Number((amount * costRatio).toFixed(2))

    trades.push({
      id: `ORD${100000 + i}`,
      amount,
      createTime: createTimestamp,
      payTime: payTimestamp,
      confirmStatus,
      cost
    })
  }
  trades.sort((a, b) => a.payTime - b.payTime)
  return trades
}

let globalTrades = []
let chartInstance = null

// ==================== 响应式状态 ====================
const granularity = ref('realtime')
const dayRange = ref([])
const monthRange = ref([])
const yearStart = ref(null)
const yearEnd = ref(null)
const activeChartMetric = ref('paidTrades')

const aggregated = ref({
  totalPaidTrades: 0,
  totalPaidAmount: 0,
  totalConfirmedAmount: 0,
  totalUnconfirmedAmount: 0,
  totalCost: 0,
  totalProfit: 0
})
const periodDetails = ref([])
const rangeLabel = ref('加载中...')

const chartRef = ref(null)

// ==================== 计算属性 ====================
const yearOptions = computed(() => {
  const currentYear = dayjs().year()
  const years = []
  for (let y = 2021; y <= currentYear + 1; y++) years.push(y)
  return years
})

const avgTradePrice = computed(() => {
  if (aggregated.value.totalPaidTrades === 0) return '0.00'
  return (aggregated.value.totalPaidAmount / aggregated.value.totalPaidTrades).toFixed(2)
})

const marginRate = computed(() => {
  if (aggregated.value.totalPaidAmount === 0) return '0.0'
  return ((aggregated.value.totalProfit / aggregated.value.totalPaidAmount) * 100).toFixed(1)
})

const granularityText = computed(() => {
  const map = { realtime: '实时', day: '天', month: '月', year: '年' }
  return map[granularity.value]
})

const chartTitle = computed(() => {
  const map = {
    paidTrades: '支付订单数',
    paidAmount: '付款金额',
    avgTradePrice: '客单价',
    confirmedAmount: '已确认收货金额',
    unconfirmedAmount: '未确认收货金额',
    cost: '货品成本',
    profit: '毛利'
  }
  return map[activeChartMetric.value] || '支付订单数'
})

// ==================== 辅助函数 ====================
const formatNumber = (num) => num.toLocaleString()

const getCurrentTimeRange = () => {
  if (granularity.value === 'realtime') {
    const start = dayjs().startOf('day').valueOf()
    const end = dayjs().valueOf()
    return { start, end }
  } else if (granularity.value === 'day') {
    if (!dayRange.value || dayRange.value.length !== 2) return null
    const [startStr, endStr] = dayRange.value
    const start = dayjs(startStr).startOf('day').valueOf()
    const end = dayjs(endStr).endOf('day').valueOf()
    return { start, end }
  } else if (granularity.value === 'month') {
    if (!monthRange.value || monthRange.value.length !== 2) return null
    const [startMonth, endMonth] = monthRange.value
    const start = dayjs(startMonth).startOf('month').valueOf()
    const end = dayjs(endMonth).endOf('month').valueOf()
    return { start, end }
  } else {
    if (!yearStart.value || !yearEnd.value) return null
    const start = dayjs(`${yearStart.value}-01-01`).startOf('year').valueOf()
    const end = dayjs(`${yearEnd.value}-12-31`).endOf('year').valueOf()
    return { start, end }
  }
}

const filterTradesByTimeRange = () => {
  const range = getCurrentTimeRange()
  if (!range) return []
  const { start, end } = range
  return globalTrades.filter(trade => trade.payTime !== null && trade.payTime >= start && trade.payTime <= end)
}

const renderChart = () => {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.dispose()

  if (periodDetails.value.length === 0) {
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center' }
    })
    return
  }

  // 获取周期标签（兼容 period_label 和 periodLabel）
  const labels = periodDetails.value.map(d => d.period_label || d.periodLabel || '-')
  let dataKey = ''
  let seriesName = ''
  let yAxisName = ''

  switch (activeChartMetric.value) {
    case 'paidTrades': dataKey = 'count'; seriesName = '支付订单数'; yAxisName = '订单数 (笔)'; break
    case 'paidAmount': dataKey = 'amount'; seriesName = '付款金额'; yAxisName = '金额 (元)'; break
    case 'avgTradePrice':
      const avgData = periodDetails.value.map(d => d.count > 0 ? d.amount / d.count : 0)
      chartInstance = echarts.init(chartRef.value)
      chartInstance.setOption({
        tooltip: { trigger: 'axis', valueFormatter: (value) => '¥' + (value || 0).toFixed(2) },
        xAxis: { type: 'category', data: labels, name: '周期', axisLabel: { rotate: labels.length > 15 ? 30 : 0 } },
        yAxis: { type: 'value', name: '元/单' },
        series: [{ name: '客单价', type: 'line', data: avgData, smooth: true, lineStyle: { color: '#8b5cf6', width: 2.5 }, areaStyle: { opacity: 0.1, color: '#8b5cf6' }, symbol: 'circle', symbolSize: 6 }],
        grid: { outerBounds: {top: 30, bottom: 20, left: 60, right: 30} }
      })
      return
    case 'confirmedAmount': dataKey = 'confirmed_amount'; seriesName = '已确认收货金额'; yAxisName = '金额 (元)'; break
    case 'unconfirmedAmount': dataKey = 'unconfirmed_amount'; seriesName = '未确认收货金额'; yAxisName = '金额 (元)'; break
    case 'cost': dataKey = 'cost'; seriesName = '货品成本'; yAxisName = '金额 (元)'; break
    case 'profit': dataKey = 'profit'; seriesName = '毛利'; yAxisName = '金额 (元)'; break
    default: dataKey = 'count'; seriesName = '支付订单数'; yAxisName = '订单数 (笔)'
  }

  const chartData = periodDetails.value.map(d => d[dataKey])
  const colorMap = {
    paidTrades: '#3b82f6',
    paidAmount: '#f59e0b',
    confirmedAmount: '#10b981',
    unconfirmedAmount: '#f97316',
    cost: '#8b5cf6',
    profit: '#ec489a'
  }
  const lineColor = colorMap[activeChartMetric.value] || '#3b82f6'

  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (value) => seriesName.includes('订单') ? (value || 0) + ' 笔' : '¥' + (value || 0).toFixed(2) },
    xAxis: { type: 'category', data: labels, name: '周期', axisLabel: { rotate: labels.length > 15 ? 30 : 0 } },
    yAxis: { type: 'value', name: yAxisName },
    series: [{
      name: seriesName,
      type: 'line',
      data: chartData,
      smooth: true,
      lineStyle: { color: lineColor, width: 2.5 },
      areaStyle: { opacity: 0.1, color: lineColor },
      symbol: 'circle',
      symbolSize: 6
    }],
    grid: { outerBounds: { top: 30, bottom: 20, left: 60, right: 40 }}
  })
}

// 刷新看板
const refreshStats = async () => {
  // 参数校验
  if (granularity.value === 'day' && (!dayRange.value || dayRange.value.length !== 2)) {
    ElMessage.warning('请选择完整的起止日期范围')
    return
  }
  if (granularity.value === 'month' && (!monthRange.value || monthRange.value.length !== 2)) {
    ElMessage.warning('请选择完整的起止月份范围')
    return
  }
  if (granularity.value === 'year' && (!yearStart.value || !yearEnd.value)) {
    ElMessage.warning('请选择起始年份和结束年份')
    return
  }

  // 构建请求参数
  const params = {
    granularity: granularity.value,
    time_field: 'pay_time'  // 或 'created'
  }

  if (granularity.value === 'day') {
    params.start_date = dayRange.value[0]
    params.end_date = dayRange.value[1]
  } else if (granularity.value === 'month') {
    params.start_date = monthRange.value[0]
    params.end_date = monthRange.value[1]
  } else if (granularity.value === 'year') {
    params.start_date = yearStart.value.toString()
    params.end_date = yearEnd.value.toString()
  }

  try {
    // 调用真实 API（会自动携带 token）
    const response = await getTradeStatistics(params)

    // 根据您的接口返回结构调整
    const data = response.data.data  // 因为您的响应拦截器返回的是 response，实际数据在 response.data.data

    // 更新聚合数据
    aggregated.value = {
      totalPaidTrades: data.aggregated.total_paid_trades,
      totalPaidAmount: data.aggregated.total_paid_amount,
      totalConfirmedAmount: data.aggregated.total_confirmed_amount,
      totalUnconfirmedAmount: data.aggregated.total_unconfirmed_amount,
      totalCost: data.aggregated.total_cost,
      totalProfit: data.aggregated.total_profit
    }

    // 更新明细数据
    periodDetails.value = data.period_details

    // 更新标签
    rangeLabel.value = data.range_label

    await nextTick()
    renderChart()

  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取数据失败，请稍后重试')
  }
}

const setActiveMetric = (metric) => {
  activeChartMetric.value = metric
  renderChart()
}

const onGranularityChange = () => {
  if (granularity.value === 'day' && (!dayRange.value || dayRange.value.length === 0)) {
    const end = new Date()
    const start = new Date()
    start.setTime(start.getTime() - 30 * 24 * 3600 * 1000)
    dayRange.value = [dayjs(start).format('YYYY-MM-DD'), dayjs(end).format('YYYY-MM-DD')]
  }
  if (granularity.value === 'month' && (!monthRange.value || monthRange.value.length === 0)) {
    monthRange.value = [dayjs().startOf('year').format('YYYY-MM'), dayjs().endOf('year').format('YYYY-MM')]
  }
  if (granularity.value === 'year') {
    if (!yearStart.value) yearStart.value = 2023
    if (!yearEnd.value) yearEnd.value = 2024
  }
  refreshStats()
}

const handleResize = () => {
  if (chartInstance) chartInstance.resize()
}

onMounted(() => {
  globalTrades = generateMockTrades()
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 30 * 24 * 3600 * 1000)
  dayRange.value = [dayjs(start).format('YYYY-MM-DD'), dayjs(end).format('YYYY-MM-DD')]
  monthRange.value = [dayjs().startOf('year').format('YYYY-MM'), dayjs().endOf('year').format('YYYY-MM')]
  yearStart.value = 2023
  yearEnd.value = 2024
  refreshStats()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) chartInstance.dispose()
})
</script>

<style scoped>
.trade-dashboard {
  max-width: 1600px;
  margin: 0 auto;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  padding: 0 28px;
}

.header-card {
  background: white;
  border-radius: 28px;
  padding: 0 28px 20px 28px;
  margin-bottom: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.05);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.h1 {
  margin-top: 0;
}

.h1-emoji {
  font-size: 1.85rem;
  display: inline-block;
  margin-right: 8px;
}

.h1-text {
  font-size: 1.85rem;
  font-weight: 600;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, #1e293b, #2d3a4e);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.sub {
  color: #5b6e8c;
  font-size: 0.9rem;
}

.range-hint {
  background: #f1f5f9;
  border-radius: 32px;
  padding: 5px 14px;
  font-size: 0.75rem;
  color: #334155;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.badge-tip {
  font-size: 0.7rem;
  background: #eef2ff;
  padding: 5px 12px;
  border-radius: 30px;
  color: #2563eb;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 16px;
  border: 1px solid #edf2f7;
  transition: all 0.2s;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
}

.stat-card-active {
  border: 2px solid #3b82f6;
  background: linear-gradient(145deg, #ffffff, #fafcff);
  box-shadow: 0 8px 20px -8px rgba(59, 130, 246, 0.25);
}

.stat-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 600;
  color: #5b6e8c;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  font-size: 1rem;
}

.stat-value {
  font-size: 1.7rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-unit {
  font-size: 0.7rem;
  font-weight: 500;
  color: #5b6e8c;
}

.stat-sub {
  font-size: 0.65rem;
  color: #6c86a3;
  margin-top: 6px;
  border-top: 1px dashed #eef2f6;
  padding-top: 5px;
}

/* 左右结构布局 */
.insight-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 24px;
}

.chart-box {
  flex: 2;
  min-width: 300px;
  background: white;
  border-radius: 24px;
  padding: 20px;
  border: 1px solid #edf2f7;
}

.table-box {
  flex: 3;
  min-width: 400px;
  background: white;
  border-radius: 24px;
  padding: 20px;
  border: 1px solid #edf2f7;
}

.table-wrapper {
  overflow-x: auto;
}

.section-title {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  border-left: 4px solid #3b82f6;
  padding-left: 12px;
}

.echart-box {
  width: 100%;
  height: 350px;
}

.realtime-badge {
  font-size: 0.7rem;
  background: #10b98120;
  padding: 2px 8px;
  border-radius: 30px;
  color: #10b981;
}

.badge-period {
  background: #eef2ff;
  color: #1e40af;
  border-radius: 30px;
  font-size: 0.7rem;
  padding: 2px 10px;
  font-weight: 500;
  display: inline-block;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

footer {
  text-align: center;
  margin-top: 16px;
  font-size: 0.7rem;
  color: #8ba0bc;
}

@media (max-width: 900px) {
  .insight-row {
    flex-direction: column;
  }

  .chart-box,
  .table-box {
    flex: auto;
    width: 100%;
  }

  .stat-value {
    font-size: 1.3rem;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}
</style>