<template>
    <div class="item-sales-analysis">
        <!-- 页面标题 -->
        <div class="page-header">
            <div>
                <h2>商品销售分析</h2>
                <p class="page-desc">按商品/SKU统计销量、销售额、成本及利润</p>
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
                <el-form-item label="时间类型">
                    <el-radio-group v-model="filterForm.timeType" @change="handleTimeTypeChange">
                        <el-radio label="day">按天</el-radio>
                        <el-radio label="month">按月</el-radio>
                    </el-radio-group>
                </el-form-item>

                <el-form-item v-if="filterForm.timeType === 'day'" label="日期范围">
                    <el-date-picker v-model="filterForm.dateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD"
                        :shortcuts="dateShortcuts" style="width: 230px" />
                </el-form-item>

                <el-form-item v-else label="月份范围">
                    <el-date-picker v-model="filterForm.monthRange" type="monthrange" range-separator="至"
                        start-placeholder="开始月份" end-placeholder="结束月份" format="YYYY-MM" value-format="YYYY-MM"
                        :shortcuts="monthShortcuts" style="width: 230px" />
                </el-form-item>

                <el-form-item label="商品ID">
                    <el-input v-model="filterForm.num_iid" placeholder="请输入商品ID" clearable style="width: 160px" />
                </el-form-item>

                <el-form-item label="商家编码">
                    <el-input v-model="filterForm.outer_iid" placeholder="请输入商家编码" clearable style="width: 160px" />
                </el-form-item>

                <el-form-item label="特殊标记">
                    <el-select v-model="filterForm.isSpecial" placeholder="全部" clearable style="width: 120px">
                        <el-option label="正常订单" :value="0" />
                        <el-option label="特殊订单" :value="1" />
                    </el-select>
                </el-form-item>

                <el-form-item>
                    <div class="button-group">
                        <el-button type="primary" @click="searchData">查询</el-button>
                        <el-button @click="resetFilter">重置</el-button>
                    </div>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 统计表格 -->
        <el-card class="table-card">
            <el-table :data="itemList" border stripe v-loading="loading" style="width: 100%" row-key="num_iid"
                @sort-change="handleSortChange">

                <!-- 商品信息列 -->
                <el-table-column label="商品信息" min-width="360" align="left">
                    <template #default="{ row }">
                        <div class="product-info-cell">
                            <div class="product-image">
                                <a :href="getItemWirelessUrl(row.num_iid)" target="_blank" @click.stop>
                                    <el-image :src="row.pic_url" fit="cover" style="width: 60px; height: 60px"
                                        :lazy="true">
                                        <template #error>
                                            <div class="image-placeholder-small">无图</div>
                                        </template>
                                    </el-image>
                                </a>
                            </div>
                            <div class="product-details">
                                <a :href="getItemWirelessUrl(row.num_iid)" target="_blank" class="product-title-link"
                                    @click.stop :title="row.title">
                                    {{ row.title || '-' }}
                                </a>
                                <div class="product-id-wrapper">
                                    <span class="id-label">商品ID：</span>
                                    <span>{{ row.num_iid || '-' }}</span>
                                    <span class="id-label" style="margin-left: 12px;">商家编码：</span>
                                    <span>{{ row.outer_iid || '-' }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="order_count" label="订单数量" width="110" align="right" sortable="custom" />
                <el-table-column prop="quantity" label="销售数量" width="110" align="right" sortable="custom" />
                <el-table-column prop="avg_price" label="平均成交价" width="130" align="right" sortable="custom">
                    <template #default="{ row }">{{ formatMoney(row.avg_price) }}</template>
                </el-table-column>
                <el-table-column prop="total_amount" label="销售金额" width="110" align="right" sortable="custom">
                    <template #default="{ row }">{{ formatMoney(row.total_amount) }}</template>
                </el-table-column>
                <el-table-column prop="cost_price" label="成本" width="100" align="right" sortable="custom">
                    <template #default="{ row }">{{ formatMoney(row.cost_price) }}</template>
                </el-table-column>
                <el-table-column prop="total_profit" label="利润" width="110" align="right" sortable="custom">
                    <template #default="{ row }">
                        <strong :style="{ color: row.total_profit >= 0 ? '#67c23a' : '#f56c6c' }">
                            {{ formatMoney(row.total_profit) }}
                        </strong>
                    </template>
                </el-table-column>
                <el-table-column prop="profit_rate" label="利润率" width="100" align="right" sortable="custom">
                    <template #default="{ row }">
                        <span :style="{ color: row.profit_rate >= 0 ? '#67c23a' : '#f56c6c' }">
                            {{ row.profit_rate }}%
                        </span>
                    </template>
                </el-table-column>

                <!-- 展开行：SKU明细 -->
                <el-table-column type="expand" fixed="left">
                    <template #default="{ row }">
                        <el-table :data="row.sku_list" border size="small">
                            <el-table-column prop="sku_id" label="SKU ID" width="140" />
                            <el-table-column prop="properties_name" label="属性" min-width="150" />
                            <el-table-column prop="outer_iid" label="SKU商家编码" width="140" />
                            <el-table-column prop="quantity" label="销售数量" width="100" align="right" />
                            <el-table-column prop="amount" label="销售金额" width="100" align="right">
                                <template #default="{ row: sku }">{{ formatMoney(sku.amount) }}</template>
                            </el-table-column>
                            <el-table-column prop="goods_cost" label="成本" width="100" align="right">
                                <template #default="{ row: sku }">{{ formatMoney(sku.goods_cost) }}</template>
                            </el-table-column>
                            <el-table-column prop="profit" label="利润" width="100" align="right">
                                <template #default="{ row: sku }">
                                    <span :style="{ color: sku.profit >= 0 ? '#67c23a' : '#f56c6c' }">
                                        {{ formatMoney(sku.profit) }}
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column prop="profit_rate" label="利润率" width="100" align="right">
                                <template #default="{ row: sku }">
                                    <span :style="{ color: sku.profit_rate >= 0 ? '#67c23a' : '#f56c6c' }">
                                        {{ sku.profit_rate }}%
                                    </span>
                                </template>
                            </el-table-column>
                        </el-table>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
                <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.pageSize"
                    :page-sizes="[20, 50, 100]" :total="pagination.total"
                    layout="total, sizes, prev, pager, next, jumper" @size-change="loadData"
                    @current-change="loadData" />
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { getItemSalesAnalysis } from '@/api/stat'
import { formatMoney, getItemWirelessUrl, dateShortcuts, monthShortcuts, getDefaultDateRange, getDefaultMonthRange } from '@/utils/index'
import dayjs from 'dayjs'

const loading = ref(false)

const filterForm = reactive({
    timeType: 'day',
    dateRange: getDefaultDateRange(),
    monthRange: getDefaultMonthRange(),
    num_iid: '',
    outer_iid: '',
    isSpecial: ''
})

const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0
})

const itemList = ref([])

const handleTimeTypeChange = () => {
    const currentType = filterForm.timeType
    const previousType = currentType === 'day' ? 'month' : 'day'

    // 保存当前类型的筛选值
    if (previousType === 'day') {
        savedFilters.day.dateRange = [...filterForm.dateRange]
        savedFilters.day.num_iid = filterForm.num_iid
        savedFilters.day.outer_iid = filterForm.outer_iid
        savedFilters.day.isSpecial = filterForm.isSpecial
    } else {
        savedFilters.month.monthRange = [...filterForm.monthRange]
        savedFilters.month.num_iid = filterForm.num_iid
        savedFilters.month.outer_iid = filterForm.outer_iid
        savedFilters.month.isSpecial = filterForm.isSpecial
    }

    // 切换到目标类型，恢复目标类型的筛选值
    if (currentType === 'day') {
        filterForm.dateRange = [...savedFilters.day.dateRange]
        filterForm.num_iid = savedFilters.day.num_iid
        filterForm.outer_iid = savedFilters.day.outer_iid
        filterForm.isSpecial = savedFilters.day.isSpecial
        filterForm.monthRange = []  // 清空月份范围
    } else {
        filterForm.monthRange = [...savedFilters.month.monthRange]  // 🔥 恢复月份范围
        filterForm.num_iid = savedFilters.month.num_iid
        filterForm.outer_iid = savedFilters.month.outer_iid
        filterForm.isSpecial = savedFilters.month.isSpecial
        filterForm.dateRange = []  // 清空日期范围
    }

    pagination.current = 1
    loadData()
}

const loadData = async () => {
    // 按月查询时，必须选择月份范围
    if (filterForm.timeType === 'month' && (!filterForm.monthRange || filterForm.monthRange.length === 0)) {
        ElMessage.warning('请先选择月份范围')
        return
    }
    loading.value = true
    try {
        // 更新保存的值
        if (filterForm.timeType === 'day') {
            savedFilters.day.dateRange = [...filterForm.dateRange]
            savedFilters.day.num_iid = filterForm.num_iid
            savedFilters.day.outer_iid = filterForm.outer_iid
            savedFilters.day.isSpecial = filterForm.isSpecial
        } else {
            savedFilters.month.monthRange = [...filterForm.monthRange]
            savedFilters.month.num_iid = filterForm.num_iid
            savedFilters.month.outer_iid = filterForm.outer_iid
            savedFilters.month.isSpecial = filterForm.isSpecial
        }

        const params = {
            page: pagination.current,
            page_size: pagination.pageSize,
            time_type: filterForm.timeType,
            num_iid: filterForm.num_iid,
            outer_iid: filterForm.outer_iid,
            is_special: filterForm.isSpecial,
            sort_field: sortParams.sort_field,
            sort_order: sortParams.sort_order
        }

        if (filterForm.timeType === 'day') {
            params.start_date = filterForm.dateRange?.[0]
            params.end_date = filterForm.dateRange?.[1]
        } else {
            params.start_month = filterForm.monthRange?.[0]
            params.end_month = filterForm.monthRange?.[1]
        }

        const res = await getItemSalesAnalysis(params)
        if (res.data.code === 200) {
            itemList.value = res.data.data.list || []
            pagination.total = res.data.data.total || 0
        }
    } catch (error) {
        ElMessage.error('加载失败')
    } finally {
        loading.value = false
    }
}

const searchData = () => {
    // 更新保存的值
    if (filterForm.timeType === 'day') {
        savedFilters.day.dateRange = [...filterForm.dateRange]
        savedFilters.day.num_iid = filterForm.num_iid
        savedFilters.day.outer_iid = filterForm.outer_iid
        savedFilters.day.isSpecial = filterForm.isSpecial
    } else {
        savedFilters.month.monthRange = [...filterForm.monthRange]
        savedFilters.month.num_iid = filterForm.num_iid
        savedFilters.month.outer_iid = filterForm.outer_iid
        savedFilters.month.isSpecial = filterForm.isSpecial
    }
    pagination.current = 1
    loadData()
}

// 保存各时间类型的筛选值
const savedFilters = reactive({
    day: {
        dateRange: getDefaultDateRange(),
        num_iid: '',
        outer_iid: '',
        isSpecial: ''
    },
    month: {
        monthRange: getDefaultMonthRange(),
        num_iid: '',
        outer_iid: '',
        isSpecial: ''
    }
})

const resetFilter = () => {
    filterForm.timeType = 'day'
    filterForm.dateRange = getDefaultDateRange()
    filterForm.monthRange = getDefaultMonthRange()
    filterForm.num_iid = ''
    filterForm.outer_iid = ''
    filterForm.isSpecial = ''
    // 同时重置保存的值
    savedFilters.day.dateRange = getDefaultDateRange()
    savedFilters.day.num_iid = ''
    savedFilters.day.outer_iid = ''
    savedFilters.day.isSpecial = ''
    savedFilters.month.monthRange = getDefaultMonthRange()
    savedFilters.month.num_iid = ''
    savedFilters.month.outer_iid = ''
    savedFilters.month.isSpecial = ''
    pagination.current = 1
    loadData()
}

// 排序状态
const sortParams = reactive({
    sort_field: 'total_amount',
    sort_order: 'desc'
})

// 排序变化处理
const handleSortChange = ({ prop, order }) => {
    if (order === 'ascending') {
        sortParams.sort_field = prop
        sortParams.sort_order = 'asc'
    } else if (order === 'descending') {
        sortParams.sort_field = prop
        sortParams.sort_order = 'desc'
    } else {
        // 取消排序时恢复默认
        sortParams.sort_field = 'total_amount'
        sortParams.sort_order = 'desc'
    }
    pagination.current = 1
    loadData()
}

const exportData = () => {
    ElMessage.info('导出功能开发中')
}

onMounted(() => {
    loadData()
})
</script>

<style scoped>
.item-sales-analysis {
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
    margin-right: 0;
}

.filter-form .el-radio {
    margin-right: 8px;
}

.table-card {
    border-radius: 12px;
}

.pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}

/* 商品信息单元格样式 - 左右布局 */
.product-info-cell {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 5px 0;
}

/* 左侧图片样式 */
.product-image {
    flex-shrink: 0;
    width: 60px;
    height: 60px;
    overflow: hidden;
    border-radius: 4px;
    background-color: #f5f5f5;
    border: 1px solid #ebeef5;
}

.product-image .el-image {
    width: 60px;
    height: 60px;
}

/* 右侧详情区域 - 上下布局 */
.product-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

/* 商品标题超链接样式 */
.product-title-link {
    color: #409eff;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    display: inline-block;
    word-break: break-word;
}

.product-title-link:hover {
    color: #66b1ff;
    text-decoration: underline;
}

/* 商品ID样式 - 小字体 */
.product-id {
    font-size: 13px;
    color: #909399;
    font-family: monospace;
}

.id-label {
    color: #c0c4cc;
}

.image-placeholder-small {
    width: 60px;
    height: 60px;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c0c4cc;
    font-size: 12px;
}

.product-id-wrapper {
    font-size: 12px;
    color: #909399;
    font-family: monospace;
}

.button-group {
    display: flex;
    margin-left: 15px;
}
</style>