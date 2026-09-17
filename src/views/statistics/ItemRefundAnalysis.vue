<template>
    <div class="item-refund-analysis">
        <!-- 页面标题 -->
        <div class="page-header">
            <div>
                <h2>商品退款分析</h2>
                <p class="page-desc">按商品/SKU统计退款订单数、退款金额及退款率</p>
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
                    <el-radio-group v-model="filterForm.periodType" @change="(val) => handlePeriodChange(val)">
                        <el-radio label="day">按天</el-radio>
                        <el-radio label="month">按月</el-radio>
                    </el-radio-group>
                </el-form-item>

                <el-form-item v-if="filterForm.periodType === 'day'" label="日期范围">
                    <el-date-picker v-model="filterForm.dateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD"
                        :shortcuts="dateShortcuts" style="width: 260px" />
                </el-form-item>

                <el-form-item v-else label="月份范围">
                    <el-date-picker v-model="filterForm.monthRange" type="monthrange" range-separator="至"
                        start-placeholder="开始月份" end-placeholder="结束月份" format="YYYY-MM" value-format="YYYY-MM"
                        :shortcuts="monthShortcuts" style="width: 260px" />
                </el-form-item>

                <el-form-item label="商品ID">
                    <el-input v-model="filterForm.num_iid" placeholder="请输入商品ID" clearable style="width: 160px" />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" @click="searchData">查询</el-button>
                    <el-button @click="resetFilter">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 统计表格 -->
        <el-card class="table-card">
            <el-table :data="itemList" border stripe v-loading="loading" style="width: 100%" row-key="num_iid">
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

                <el-table-column prop="order_count" label="销售订单数" width="110" align="right" />
                <el-table-column prop="refund_order_count" label="退款订单数" width="110" align="right">
                    <template #default="{ row }">
                        <span style="color: #f56c6c;">{{ row.refund_order_count }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="refund_rate" label="退款率" width="100" align="right">
                    <template #default="{ row }">
                        <span :style="{ color: row.refund_rate >= 10 ? '#f56c6c' : '#e6a23c' }">
                            {{ row.refund_rate }}%
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="total_amount" label="销售金额" width="120" align="right">
                    <template #default="{ row }">¥{{ formatMoney(row.total_amount) }}</template>
                </el-table-column>
                <el-table-column prop="refund_amount" label="退款金额" width="120" align="right">
                    <template #default="{ row }">¥{{ formatMoney(row.refund_amount) }}</template>
                </el-table-column>
                <el-table-column prop="only_refund_amount" label="仅退款金额" width="120" align="right">
                    <template #default="{ row }">¥{{ formatMoney(row.only_refund_amount) }}</template>
                </el-table-column>
                <el-table-column prop="return_refund_amount" label="退货退款金额" width="130" align="right">
                    <template #default="{ row }">¥{{ formatMoney(row.return_refund_amount) }}</template>
                </el-table-column>
                <el-table-column prop="pre_sale_only_refund" label="售前仅退款" width="120" align="right">
                    <template #default="{ row }">¥{{ formatMoney(row.pre_sale_only_refund) }}</template>
                </el-table-column>
                <el-table-column prop="mid_sale_only_refund" label="售中仅退款" width="120" align="right">
                    <template #default="{ row }">¥{{ formatMoney(row.mid_sale_only_refund) }}</template>
                </el-table-column>
                <el-table-column prop="after_sale_only_refund" label="售后仅退款" width="120" align="right">
                    <template #default="{ row }">¥{{ formatMoney(row.after_sale_only_refund) }}</template>
                </el-table-column>
                <el-table-column prop="mid_sale_return_refund" label="售中退货退款" width="130" align="right">
                    <template #default="{ row }">¥{{ formatMoney(row.mid_sale_return_refund) }}</template>
                </el-table-column>
                <el-table-column prop="after_sale_return_refund" label="售后退货退款" width="130" align="right">
                    <template #default="{ row }">¥{{ formatMoney(row.after_sale_return_refund) }}</template>
                </el-table-column>

                <!-- 展开行：SKU退款明细 -->
                <el-table-column type="expand" fixed="left">
                    <template #default="{ row }">
                        <el-table :data="row.sku_list" border size="small">
                            <el-table-column prop="sku_id" label="SKU ID" width="140" />
                            <el-table-column prop="properties_name" label="属性" min-width="150" />
                            <el-table-column prop="outer_iid" label="SKU商家编码" width="140" />
                            <el-table-column prop="order_count" label="销售订单数" width="100" align="right" />
                            <el-table-column prop="refund_order_count" label="退款订单数" width="100" align="right">
                                <template #default="{ row: sku }">
                                    <span style="color: #f56c6c;">{{ sku.refund_order_count }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column prop="refund_rate" label="退款率" width="100" align="right">
                                <template #default="{ row: sku }">
                                    <span :style="{ color: sku.refund_rate >= 10 ? '#f56c6c' : '#e6a23c' }">
                                        {{ sku.refund_rate }}%
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column prop="total_amount" label="销售金额" width="100" align="right">
                                <template #default="{ row: sku }">¥{{ formatMoney(sku.total_amount) }}</template>
                            </el-table-column>
                            <el-table-column prop="refund_amount" label="退款金额" width="100" align="right">
                                <template #default="{ row: sku }">¥{{ formatMoney(sku.refund_amount) }}</template>
                            </el-table-column>

                            <el-table-column prop="pre_sale_only_refund" label="售前仅退款" width="120" align="right">
                                <template #default="{ row }">¥{{ formatMoney(row.pre_sale_only_refund) }}</template>
                            </el-table-column>
                            <el-table-column prop="mid_sale_only_refund" label="售中仅退款" width="120" align="right">
                                <template #default="{ row }">¥{{ formatMoney(row.mid_sale_only_refund) }}</template>
                            </el-table-column>
                            <el-table-column prop="after_sale_only_refund" label="售后仅退款" width="120" align="right">
                                <template #default="{ row }">¥{{ formatMoney(row.after_sale_only_refund) }}</template>
                            </el-table-column>
                            <el-table-column prop="mid_sale_return_refund" label="售中退货退款" width="130" align="right">
                                <template #default="{ row }">¥{{ formatMoney(row.mid_sale_return_refund) }}</template>
                            </el-table-column>
                            <el-table-column prop="after_sale_return_refund" label="售后退货退款" width="130" align="right">
                                <template #default="{ row }">¥{{ formatMoney(row.after_sale_return_refund) }}</template>
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
import { getItemRefundAnalysis } from '@/api/stat'
import { formatMoney, getItemWirelessUrl, dateShortcuts, monthShortcuts, getDefaultDateRange, getDefaultMonthRange } from '@/utils/index'

const loading = ref(false)

// 保存各周期的筛选值
const savedFilters = reactive({
    day: { dateRange: getDefaultDateRange(), num_iid: '' },
    month: { monthRange: getDefaultMonthRange(), num_iid: '' }
})

const filterForm = reactive({
    periodType: 'day',
    dateRange: getDefaultDateRange(),
    monthRange: getDefaultMonthRange(),
    num_iid: ''
})

const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0
})

const itemList = ref([])

// 切换周期
// 切换周期
const handlePeriodChange = (newType) => {
    const oldType = newType === 'day' ? 'month' : 'day'

    // 保存旧周期的值
    if (oldType === 'day') {
        savedFilters.day.dateRange = [...filterForm.dateRange]
        savedFilters.day.num_iid = filterForm.num_iid
    } else {
        savedFilters.month.monthRange = [...filterForm.monthRange]
        savedFilters.month.num_iid = filterForm.num_iid
    }

    // 恢复新周期的值
    if (newType === 'day') {
        filterForm.dateRange = savedFilters.day.dateRange.length ? [...savedFilters.day.dateRange] : getDefaultDateRange()
        filterForm.monthRange = []
        filterForm.num_iid = savedFilters.day.num_iid
    } else {
        filterForm.monthRange = savedFilters.month.monthRange.length ? [...savedFilters.month.monthRange] : getDefaultMonthRange()
        filterForm.dateRange = []
        filterForm.num_iid = savedFilters.month.num_iid
    }

    pagination.current = 1
    loadData()
}

// 加载数据
const loadData = async () => {
    loading.value = true
    try {
        const params = {
            page: pagination.current,
            page_size: pagination.pageSize,
            period_type: filterForm.periodType,
            num_iid: filterForm.num_iid || ''
        }

        if (filterForm.periodType === 'day') {
            if (filterForm.dateRange && filterForm.dateRange.length === 2) {
                params.start_date = filterForm.dateRange[0]
                params.end_date = filterForm.dateRange[1]
            }
        } else {
            if (filterForm.monthRange && filterForm.monthRange.length === 2) {
                params.start_month = filterForm.monthRange[0]
                params.end_month = filterForm.monthRange[1]
            }
        }

        const res = await getItemRefundAnalysis(params)
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
    pagination.current = 1
    // 保存当前筛选值到对应周期
    if (filterForm.periodType === 'day') {
        savedFilters.day.dateRange = [...filterForm.dateRange]
        savedFilters.day.num_iid = filterForm.num_iid
    } else {
        savedFilters.month.monthRange = [...filterForm.monthRange]
        savedFilters.month.num_iid = filterForm.num_iid
    }
    loadData()
}

const resetFilter = () => {
    filterForm.periodType = 'day'
    filterForm.dateRange = getDefaultDateRange()
    filterForm.monthRange = getDefaultMonthRange()
    filterForm.num_iid = ''

    savedFilters.day.dateRange = getDefaultDateRange()
    savedFilters.day.num_iid = ''
    savedFilters.month.monthRange = getDefaultMonthRange()
    savedFilters.month.num_iid = ''

    pagination.current = 1
    loadData()
}

const exportData = () => {
    ElMessage.info('导出功能开发中')
}

onMounted(() => {
    // 初始化保存的值
    savedFilters.day.dateRange = [...filterForm.dateRange]
    savedFilters.month.monthRange = [...filterForm.monthRange]
    loadData()
})
</script>

<style scoped>
.item-refund-analysis {
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
    gap: 8px;
}

.filter-form .el-form-item {
    margin-right: 15px;
}

/* 调整第一个 radio 的右边距 */
.filter-form .el-radio:first-child {
    margin-right: 15px;
}

.table-card {
    border-radius: 12px;
}

.pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}

/* 商品信息单元格样式 */
.product-info-cell {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 5px 0;
}

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

.product-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

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

.product-id-wrapper {
    font-size: 12px;
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
</style>