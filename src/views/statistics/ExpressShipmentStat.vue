<template>
    <div class="express-shipment-stat">
        <!-- 页面标题 -->
        <div class="page-header">
            <div>
                <h2>快递发货量统计</h2>
                <p class="page-desc">按日/月/年统计各快递公司的发货单量</p>
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
                <el-form-item label="统计周期">
                    <el-radio-group v-model="filterForm.periodType">
                        <el-radio label="day">按天</el-radio>
                        <el-radio label="month">按月</el-radio>
                        <el-radio label="year">按年</el-radio>
                    </el-radio-group>
                </el-form-item>

                <el-form-item v-if="filterForm.periodType === 'day'" label="日期范围">
                    <el-date-picker v-model="filterForm.dateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD"
                        :shortcuts="dateShortcuts" style="width: 260px" />
                </el-form-item>

                <el-form-item v-else-if="filterForm.periodType === 'month'" label="月份范围">
                    <el-date-picker v-model="filterForm.monthRange" type="monthrange" range-separator="至"
                        start-placeholder="开始月份" end-placeholder="结束月份" format="YYYY-MM" value-format="YYYY-MM"
                        :shortcuts="monthShortcuts" style="width: 260px" />
                </el-form-item>

                <el-form-item v-else label="年份范围">
                    <el-date-picker v-model="filterForm.yearRange" type="yearrange" range-separator="至"
                        start-placeholder="开始年份" end-placeholder="结束年份" format="YYYY" value-format="YYYY"
                        :shortcuts="yearShortcuts" style="width: 260px" />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" @click="searchData">查询</el-button>
                    <el-button @click="resetFilter">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 快递卡片统计 -->
        <div class="stats-grid">
            <el-card v-for="company in companyList" :key="company.logistics_company" class="stat-card"
                :class="{ 'active-card': activeCompany === company.logistics_company }"
                @click="selectCompany(company.logistics_company)">
                <div class="stat-card-content">
                    <div class="stat-card-icon">
                        <img :src="getLogisticsLogo(company.logistics_company)" @error="handleImageError"
                            class="company-logo" />
                    </div>
                    <div class="stat-card-info">
                        <div class="stat-card-title">
                            <span class="title-label">快递名称：</span>
                            <span class="title-value">{{ company.logistics_company }}</span>
                        </div>
                        <div class="stat-card-value">
                            <span class="value-number">{{ company.total_count }}</span>
                            <span class="value-unit">票</span>
                        </div>
                    </div>
                </div>
            </el-card>

            <el-card v-if="companyList.length === 0" class="stat-card empty-card">
                <div class="empty-tip">暂无数据</div>
            </el-card>
        </div>

        <!-- 明细表格 -->
        <el-card class="table-card">
            <template #header>
                <div class="card-header">
                    <span>发货明细{{ activeCompanyName ? ` - ${activeCompanyName}` : '' }}</span>
                    <div class="summary-info">
                        合计：{{ totalCount }} 票
                    </div>
                </div>
            </template>

            <el-table :data="detailList" border stripe v-loading="loading" style="width: 100%">
                <el-table-column v-if="filterForm.periodType === 'day'" prop="period" label="日期" width="120" />
                <el-table-column v-else-if="filterForm.periodType === 'month'" prop="period" label="月份" width="100" />
                <el-table-column v-else prop="period" label="年份" width="100" />
                <el-table-column prop="logistics_company" label="快递公司" width="150" />
                <el-table-column prop="count" label="发货票数" width="120" align="right" />
                <el-table-column prop="percentage" label="占比" width="100" align="right">
                    <template #default="{ row }">{{ row.percentage }}%</template>
                </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
                <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.pageSize"
                    :page-sizes="[20, 50, 100]" :total="pagination.total"
                    layout="total, sizes, prev, pager, next, jumper" @size-change="loadDetailData"
                    @current-change="loadDetailData" />
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { getExpressShipmentStat } from '@/api/stat'
import { dateShortcuts, monthShortcuts, yearShortcuts, getDefaultDateRange, getDefaultMonthRange, getDefaultYearRange } from '@/utils/index'

// 状态
const loading = ref(false)
const activeCompany = ref('')

// 保存各周期的筛选值
const savedFilters = reactive({
    day: { dateRange: getDefaultDateRange() },
    month: { monthRange: getDefaultMonthRange() },
    year: { yearRange: getDefaultYearRange() }
})

// 筛选表单
const filterForm = reactive({
    periodType: 'day',
    dateRange: getDefaultDateRange(),
    monthRange: getDefaultMonthRange(),
    yearRange: getDefaultYearRange()
})

// 分页
const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0
})

// 快递公司列表
const companyList = ref([])
// 明细列表
const detailList = ref([])
// 总票数
const totalCount = ref(0)

const activeCompanyName = computed(() => activeCompany.value || '全部')

// 获取快递Logo（前端静态资源）
const getLogisticsLogo = (companyName) => {
    const logoMap = {
        '中通快递': '/logo/zhongtongkuaidi.svg',
        '圆通速递': '/logo/yuantongsudi.svg',
        '申通快递': '/logo/shengtongkuaidi.svg',
        '韵达快递': '/logo/yundakuaidi.svg',
        '顺丰速运': '/logo/sf.svg',
        '邮政国内小包': '/logo/youzhengkuaidi.svg',
        '极兔速递': '/logo/jitusudi.svg',
        'EMS': '/logo/ems.svg',
        '菜鸟速递': '/logo/cainiaosudi.svg',
    }
    return logoMap[companyName] || '/logo/default.svg'
}

const handleImageError = (event) => {
    event.target.src = '/logo/default.svg'
}

// 选择快递公司
const selectCompany = (company) => {
    if (activeCompany.value === company) {
        activeCompany.value = ''
    } else {
        activeCompany.value = company
    }
    pagination.current = 1
    loadDetailData()
}

// 加载卡片数据
const loadCardData = async () => {
    try {
        const params = { period_type: filterForm.periodType, type: 'card' }
        addTimeParams(params)

        // 如果没有时间参数，不请求
        if (filterForm.periodType === 'day' && (!params.start_date || !params.end_date)) {
            companyList.value = []
            return
        }
        if (filterForm.periodType === 'month' && (!params.start_month || !params.end_month)) {
            companyList.value = []
            return
        }
        if (filterForm.periodType === 'year' && (!params.start_year || !params.end_year)) {
            companyList.value = []
            return
        }

        const res = await getExpressShipmentStat(params)
        if (res.data.code === 200) {
            companyList.value = res.data.data.list || []
        }
    } catch (error) {
        ElMessage.error('加载统计数据失败')
    }
}

// 加载明细数据
const loadDetailData = async () => {
    loading.value = true
    try {
        const params = {
            period_type: filterForm.periodType,
            type: 'detail',
            page: pagination.current,
            page_size: pagination.pageSize,
            logistics_company: activeCompany.value || ''
        }
        addTimeParams(params)

        // 如果没有时间参数，不请求
        if (filterForm.periodType === 'day' && (!params.start_date || !params.end_date)) {
            companyList.value = []
            return
        }
        if (filterForm.periodType === 'month' && (!params.start_month || !params.end_month)) {
            companyList.value = []
            return
        }
        if (filterForm.periodType === 'year' && (!params.start_year || !params.end_year)) {
            companyList.value = []
            return
        }

        const res = await getExpressShipmentStat(params)
        if (res.data.code === 200) {
            detailList.value = res.data.data.list || []
            pagination.total = res.data.data.total || 0
            totalCount.value = res.data.data.total_count || 0
        }
    } catch (error) {
        ElMessage.error('加载明细失败')
    } finally {
        loading.value = false
    }
}

// 添加时间参数
const addTimeParams = (params) => {
    if (filterForm.periodType === 'day') {
        if (filterForm.dateRange && filterForm.dateRange.length === 2) {
            params.start_date = filterForm.dateRange[0]
            params.end_date = filterForm.dateRange[1]
        }
    } else if (filterForm.periodType === 'month') {
        if (filterForm.monthRange && filterForm.monthRange.length === 2) {
            params.start_month = filterForm.monthRange[0]
            params.end_month = filterForm.monthRange[1]
        }
    } else {
        if (filterForm.yearRange && filterForm.yearRange.length === 2) {
            params.start_year = filterForm.yearRange[0]
            params.end_year = filterForm.yearRange[1]
        }
    }
}

const loadData = async () => {
    await loadCardData()
    await loadDetailData()
}

const searchData = () => {
    pagination.current = 1
    activeCompany.value = ''
    loadData()
}

const resetFilter = () => {
    filterForm.periodType = 'day'
    filterForm.dateRange = getDefaultDateRange()
    filterForm.monthRange = []
    filterForm.yearRange = []
    savedFilters.day.dateRange = getDefaultDateRange()
    savedFilters.month.monthRange = []
    savedFilters.year.yearRange = []
    activeCompany.value = ''
    pagination.current = 1
    loadData()
}

const exportData = () => {
    ElMessage.info('导出功能开发中')
}

// 监听周期类型变化
watch(() => filterForm.periodType, (newType, oldType) => {
    if (!oldType) return  // 初始化时跳过
    
    // 1. 保存旧周期的值
    if (oldType === 'day') {
        savedFilters.day.dateRange = filterForm.dateRange ? [...filterForm.dateRange] : []
    } else if (oldType === 'month') {
        savedFilters.month.monthRange = filterForm.monthRange ? [...filterForm.monthRange] : []
    } else if (oldType === 'year') {
        savedFilters.year.yearRange = filterForm.yearRange ? [...filterForm.yearRange] : []
    }
    
    // 2. 恢复新周期的值
    if (newType === 'day') {
        filterForm.dateRange = savedFilters.day.dateRange.length ? [...savedFilters.day.dateRange] : getDefaultDateRange()
        filterForm.monthRange = []
        filterForm.yearRange = []
    } else if (newType === 'month') {
        filterForm.monthRange = savedFilters.month.monthRange.length ? [...savedFilters.month.monthRange] : getDefaultMonthRange()
        filterForm.dateRange = []
        filterForm.yearRange = []
    } else if (newType === 'year') {
        filterForm.yearRange = savedFilters.year.yearRange.length ? [...savedFilters.year.yearRange] : getDefaultYearRange()
        filterForm.dateRange = []
        filterForm.monthRange = []
    }
    
    activeCompany.value = ''
    pagination.current = 1
    loadData()
})

onMounted(() => {
    // 初始化所有默认值
    filterForm.dateRange = getDefaultDateRange()
    filterForm.monthRange = getDefaultMonthRange()
    filterForm.yearRange = getDefaultYearRange()
    savedFilters.day.dateRange = getDefaultDateRange()
    savedFilters.month.monthRange = getDefaultMonthRange()
    savedFilters.year.yearRange = getDefaultYearRange()
    loadData()
})
</script>

<style scoped>
.express-shipment-stat {
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

/* 卡片网格 - 自适应宽度 */
.stats-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
}

.stat-card {
    cursor: pointer;
    transition: all 0.3s;
    border-radius: 12px;
    width: auto;
    flex: 0 0 auto;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.active-card {
    border: 2px solid #409eff;
    background-color: #ecf5ff;
}

.stat-card-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
}

.stat-card-icon {
    flex-shrink: 0;
}

.company-logo {
    width: 85px;
    /* height: 40px; */
    object-fit: contain;
}

.stat-card-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.stat-card-title {
    display: flex;
    align-items: baseline;
    gap: 4px;
    white-space: nowrap;
}

.stat-card-value {
    display: flex;
    align-items: baseline;
    gap: 2px;
    white-space: nowrap;
}

.title-label {
    font-size: 12px;
    color: #909399;
}

.title-value {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}

.value-number {
    font-size: 22px;
    font-weight: 700;
    color: #409eff;
}

.value-unit {
    font-size: 12px;
    color: #909399;
}

.empty-card {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
}

.empty-tip {
    color: #909399;
    font-size: 14px;
}

.table-card {
    border-radius: 12px;
    width: 100%;
}

.table-card :deep(.el-table) {
    width: 100% !important;
}

.table-card :deep(.el-table__header-wrapper table),
.table-card :deep(.el-table__body-wrapper table) {
    width: 100% !important;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.summary-info {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
}

.pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}

/* 响应式 */
@media (max-width: 768px) {
    .stats-grid {
        gap: 12px;
    }
    
    .stat-card-content {
        padding: 10px 12px;
    }
    
    .value-number {
        font-size: 18px;
    }
}
</style>