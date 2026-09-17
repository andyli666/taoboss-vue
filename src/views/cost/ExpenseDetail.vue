<template>
    <div class="expense-detail">
        <!-- 页面标题 -->
        <div class="page-header">
            <div>
                <h2>支出明细</h2>
                <p class="page-desc">导入支付宝/微信流水，自动识别订单支出费用，以更准确计算订单利润</p>
            </div>
            <div class="header-actions">
                <el-button type="primary" @click="showAlipayImport = true">
                    <el-icon>
                        <Upload />
                    </el-icon>
                    导入支付宝流水
                </el-button>
                <el-button type="success" @click="showWechatImport = true">
                    <el-icon>
                        <Upload />
                    </el-icon>
                    导入微信支付流水
                </el-button>
            </div>
        </div>

        <!-- 统计卡片 -->
        <el-row :gutter="16" class="stat-row">
            <el-col :span="6">
                <el-card class="stat-card">
                    <div class="stat-title">总支出</div>
                    <div class="stat-value">¥{{ totalExpense.toFixed(2) }}</div>
                </el-card>
            </el-col>
            <el-col :span="4">
                <el-card class="stat-card">
                    <div class="stat-title">服务费</div>
                    <div class="stat-value">¥{{ serviceExpense.toFixed(2) }}</div>
                </el-card>
            </el-col>
            <el-col :span="4">
                <el-card class="stat-card">
                    <div class="stat-title">营销费</div>
                    <div class="stat-value">¥{{ marketingExpense.toFixed(2) }}</div>
                </el-card>
            </el-col>
            <el-col :span="5">
                <el-card class="stat-card">
                    <div class="stat-title">物流费</div>
                    <div class="stat-value">¥{{ logisticsExpense.toFixed(2) }}</div>
                </el-card>
            </el-col>
            <el-col :span="5">
                <el-card class="stat-card">
                    <div class="stat-title">其他支出</div>
                    <div class="stat-value">¥{{ otherExpense.toFixed(2) }}</div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 说明提示 -->
        <el-alert title="说明" type="info" :closable="false" show-icon style="margin-bottom: 16px">
            <!-- 总支出 = 服务费 + 营销费 + 物流费 + 其他支出（保险费、保证金、未识别的费用等） -->
            显示最近 3 次支付宝和 3 次微信导入记录，下次导入时可参考 <strong>「入账日期范围」</strong> 选择起始时间，避免重复导入
        </el-alert>

        <!-- ====== 最近导入记录 ====== -->
        <el-card class="import-history-card" style="margin-bottom: 16px;">
            <template #header>
                <div class="card-header">
                    <span>📋 最近导入记录</span>
                    <el-button type="primary" link size="small" @click="loadImportHistory">
                        <el-icon>
                            <Refresh />
                        </el-icon>
                        刷新
                    </el-button>
                </div>
            </template>

            <el-table :data="importHistory" border stripe v-loading="historyLoading" style="width: 100%" size="small">
                <el-table-column prop="import_time" label="导入时间" width="170" />
                <el-table-column prop="source_label" label="来源" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.source === 'alipay' ? 'primary' : 'success'" size="small">
                            {{ row.source_label }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="source_file" label="文件名" min-width="200" show-overflow-tooltip />
                <el-table-column prop="record_count" label="记录数" width="100" align="center" />
                <el-table-column label="入账日期范围" min-width="220">
                    <template #default="{ row }">
                        {{ row.fee_date_start }} ~ {{ row.fee_date_end }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                    <template #default="{ row }">
                        <el-button type="primary" link size="small" @click="copyDateRange(row)">
                            复制日期范围
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 支出列表 -->
        <el-card class="expense-list-card">
            <template #header>
                <div class="card-header">
                    <span>支出明细列表</span>
                    <div class="filter-bar">
                        <el-select v-model="filterSource" placeholder="全部来源" clearable style="width: 120px">
                            <el-option label="支付宝" value="alipay" />
                            <el-option label="微信支付" value="wechat" />
                        </el-select>
                        <el-input v-model="filterTid" placeholder="订单号" clearable style="width: 185px" />
                        <el-date-picker v-model="filterDate" type="daterange" range-separator="至"
                            start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD"
                            value-format="YYYY-MM-DD" style="width: 260px" />
                        <div class="button-group">
                            <el-button type="primary" @click="loadExpenses">查询</el-button>
                            <el-button @click="resetFilter">重置</el-button>
                        </div>
                    </div>
                </div>
            </template>

            <el-table :data="expenseList" border stripe v-loading="loading" style="width: 100%">
                <el-table-column prop="serial_no" label="流水号" width="180" show-overflow-tooltip />
                <el-table-column prop="tid" label="订单号" width="185" show-overflow-tooltip />
                <el-table-column prop="fee_name" label="费用名称" width="140" />
                <el-table-column prop="amount" label="金额(元)" width="100" align="right">
                    <template #default="{ row }">
                        ¥{{ row.amount.toFixed(2) }}
                    </template>
                </el-table-column>
                <el-table-column prop="fee_date" label="入账时间" width="160" />
                <el-table-column prop="source" label="来源" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.source === 'alipay' ? 'primary' : 'success'" size="small">
                            {{ row.source === 'alipay' ? '支付宝' : '微信支付' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
            </el-table>

            <!-- 分页 -->
            <div class="pagination-wrapper">
                <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.pageSize"
                    :page-sizes="[20, 50, 100]" :total="pagination.total"
                    layout="total, sizes, prev, pager, next, jumper" @size-change="loadExpenses"
                    @current-change="loadExpenses" />
            </div>
        </el-card>

        <!-- 导入支付宝流水弹窗 -->
        <el-dialog v-model="showAlipayImport" title="导入支付宝流水" width="780px">
            <div class="import-content">
                <el-tabs v-model="alipayActiveTab">
                    <!-- ====== 操作步骤（纯截图） ====== -->
                    <el-tab-pane label="📖 流水导出步骤" name="steps">
                        <div class="steps-wrapper">
                            <el-image src="/images/alipay-import-guide.jpg" fit="contain"
                                style="width: 100%; border-radius: 8px; cursor: pointer;"
                                :preview-src-list="['/images/alipay-import-guide.jpg']" preview-teleported />
                            <div class="steps-tip">
                                💡 点击图片可放大查看
                            </div>
                        </div>
                    </el-tab-pane>

                    <!-- ====== 上传文件 ====== -->
                    <el-tab-pane label="📤 上传文件" name="upload">
                        <el-alert title="导入说明" type="info" :closable="false" show-icon>
                            <template #default>
                                <ul>
                                    <li>支持 .xlsx, .xls 格式</li>
                                    <li>支付宝导出的 .zip 文件请先<strong>解压</strong>后，再上传其中的 Excel 文件</li>
                                    <li>系统会自动识别列名，列顺序不重要</li>
                                    <li>系统会自动识别费用类型并关联订单</li>
                                </ul>
                            </template>
                        </el-alert>

                        <div class="upload-area">
                            <el-upload ref="alipayUploadRef" drag :http-request="customUploadAlipay"
                                :before-upload="beforeUpload" accept=".xlsx,.xls">
                                <el-icon class="upload-icon">
                                    <UploadFilled />
                                </el-icon>
                                <div class="upload-text">将文件拖到此处，或点击上传</div>
                                <div class="upload-hint">支持 .xlsx, .xls 格式</div>
                            </el-upload>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </div>
            <template #footer>
                <el-button @click="showAlipayImport = false">关闭</el-button>
            </template>
        </el-dialog>

        <!-- 导入微信支付流水弹窗 -->
        <el-dialog v-model="showWechatImport" title="导入微信支付流水" width="780px">
            <div class="import-content">
                <el-tabs v-model="wechatActiveTab">
                    <!-- ====== 操作步骤（两张截图） ====== -->
                    <el-tab-pane label="📖 流水导出步骤" name="steps">
                        <div class="steps-wrapper">
                            <div class="steps-images">
                                <div class="step-image-item">
                                    <el-image src="/images/wechat-import-guide-1.jpg" fit="contain"
                                        style="width: 100%; border-radius: 8px; cursor: pointer;"
                                        :preview-src-list="['/images/wechat-import-guide-1.jpg', '/images/wechat-import-guide-2.jpg']"
                                        preview-teleported />
                                    <div class="step-image-label">图1：千牛工作台点击财务 → 点击收支记录</div>
                                </div>
                                <div class="step-image-item">
                                    <el-image src="/images/wechat-import-guide-2.jpg" fit="contain"
                                        style="width: 100%; border-radius: 8px; cursor: pointer;"
                                        :preview-src-list="['/images/wechat-import-guide-1.jpg', '/images/wechat-import-guide-2.jpg']"
                                        preview-teleported />
                                    <div class="step-image-label">图2：选择日期范围 → 点击导出</div>
                                </div>
                            </div>
                            <div class="steps-tip">
                                💡 点击图片可放大查看
                            </div>
                        </div>
                    </el-tab-pane>

                    <!-- ====== 上传文件 ====== -->
                    <el-tab-pane label="📤 上传文件" name="upload">
                        <el-alert title="导入说明" type="info" :closable="false" show-icon>
                            <template #default>
                                <ul>
                                    <li>支持 .xlsx, .xls 格式</li>
                                    <li>系统会自动识别列名，列顺序不重要</li>
                                    <li>系统会自动识别费用类型并关联订单</li>
                                </ul>
                            </template>
                        </el-alert>

                        <div class="upload-area">
                            <el-upload ref="wechatUploadRef" drag :http-request="customUploadWechat"
                                :before-upload="beforeUpload" accept=".xlsx,.xls">
                                <el-icon class="upload-icon">
                                    <UploadFilled />
                                </el-icon>
                                <div class="upload-text">将文件拖到此处，或点击上传</div>
                                <div class="upload-hint">支持 .xlsx, .xls 格式</div>
                            </el-upload>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </div>
            <template #footer>
                <el-button @click="showWechatImport = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Upload, UploadFilled, Refresh } from '@element-plus/icons-vue'
import { importAlipay, importWechat, getExpenseList, getImportHistory } from '@/api/expense'

// 支付宝导入弹窗标签页
const alipayActiveTab = ref('upload')
// 微信导入弹窗标签页
const wechatActiveTab = ref('upload')

const loading = ref(false)
const showAlipayImport = ref(false)
const showWechatImport = ref(false)

// 筛选条件
const filterSource = ref('')
const filterTid = ref('')
const filterDate = ref([])

// 分页
const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0
})

// 支出列表
const expenseList = ref([])

// 统计数据
const totalExpense = ref(0)
const serviceExpense = ref(0)
const marketingExpense = ref(0)
const logisticsExpense = ref(0)
const otherExpense = ref(0)

// 加载支出列表
const loadExpenses = async () => {
    loading.value = true
    try {
        const params = {
            page: pagination.current,
            page_size: pagination.pageSize,
            source: filterSource.value,
            tid: filterTid.value,
            start_date: filterDate.value?.[0],
            end_date: filterDate.value?.[1]
        }
        const res = await getExpenseList(params)
        if (res.data.code === 200) {
            expenseList.value = res.data.data.list || []
            pagination.total = res.data.data.total || 0
            totalExpense.value = res.data.data.total_expense || 0
            serviceExpense.value = res.data.data.service_expense || 0
            marketingExpense.value = res.data.data.marketing_expense || 0
            logisticsExpense.value = res.data.data.logistics_expense || 0
            otherExpense.value = res.data.data.other_expense || 0
        }
    } catch (error) {
        ElMessage.error('加载失败')
    } finally {
        loading.value = false
    }
}

// 重置筛选
const resetFilter = () => {
    filterSource.value = ''
    filterTid.value = ''
    filterDate.value = []
    pagination.current = 1
    loadExpenses()
}

// 上传前校验
const beforeUpload = (file) => {
    // 检查文件扩展名
    const fileName = file.name.toLowerCase()
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')

    if (!isExcel) {
        ElMessage.error('请上传 Excel 文件（.xlsx 或 .xls），支付宝导出的 .zip 文件请先解压后，再上传其中的 Excel 文件')
        return false
    }

    // 检查文件类型
    const isExcelType = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel'
    if (!isExcelType) {
        ElMessage.error('请上传 Excel 文件（.xlsx 或 .xls）')
        return false
    }
    return true
}

// 导入支付宝流水
const customUploadAlipay = async (options) => {
    const formData = new FormData()
    formData.append('file', options.file)

    try {
        const res = await importAlipay(formData)
        if (res.data.code === 200) {
            const data = res.data.data || {}
            let msg = `导入完成：新增 ${data.insert || 0} 条，更新 ${data.update || 0} 条，失败 ${data.fail || 0} 条`
            if (data.fail > 0 && data.errors && data.errors.length > 0) {
                msg += `\n错误：${data.errors.slice(0, 3).join('; ')}`
            }
            ElMessageBox.alert(msg, '导入结果', {
                confirmButtonText: '确定',
                type: data.fail > 0 ? 'warning' : 'success'
            })
            showAlipayImport.value = false
            loadExpenses()
            loadImportHistory()
        } else {
            ElMessage.error(res.data.msg || '导入失败')
        }
    } catch (error) {
        ElMessage.error('上传失败，请稍后重试')
    }
}

// 导入微信支付流水
const customUploadWechat = async (options) => {
    const formData = new FormData()
    formData.append('file', options.file)

    try {
        const res = await importWechat(formData)
        if (res.data.code === 200) {
            const data = res.data.data || {}
            let msg = `导入完成：新增 ${data.insert || 0} 条，更新 ${data.update || 0} 条，失败 ${data.fail || 0} 条`
            if (data.fail > 0 && data.errors && data.errors.length > 0) {
                msg += `\n错误：${data.errors.slice(0, 3).join('; ')}`
            }
            ElMessageBox.alert(msg, '导入结果', {
                confirmButtonText: '确定',
                type: data.fail > 0 ? 'warning' : 'success'
            })
            showWechatImport.value = false
            loadExpenses()
            loadImportHistory()
        } else {
            ElMessage.error(res.data.msg || '导入失败')
        }
    } catch (error) {
        ElMessage.error('上传失败，请稍后重试')
    }
}

// 导入历史
const importHistory = ref([])
const historyLoading = ref(false)

// 加载导入历史
const loadImportHistory = async () => {
    historyLoading.value = true
    try {
        const res = await getImportHistory()
        if (res.data.code === 200) {
            importHistory.value = res.data.data || []
        }
    } catch (error) {
        console.error('加载导入历史失败:', error)
    } finally {
        historyLoading.value = false
    }
}

// 复制日期范围
const copyDateRange = (row) => {
    const text = `${row.fee_date_start} ~ ${row.fee_date_end}`
    navigator.clipboard?.writeText(text).then(() => {
        ElMessage.success('已复制日期范围')
    }).catch(() => {
        // 降级方案
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        ElMessage.success('已复制日期范围')
    })
}

onMounted(() => {
    loadExpenses()
    loadImportHistory()
})
</script>

<style scoped>
.expense-detail {
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

.stat-row {
    margin-bottom: 20px;
}

.stat-card {
    border-radius: 12px;
}

.stat-title {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
}

.stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
}

.expense-list-card {
    border-radius: 12px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
}

.filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}

.button-group {
    display: flex;
    gap: 8px;
}

.button-group .el-button {
    margin-left: 0 !important;
}

.pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}

.import-content ul {
    margin: 8px 0 0 20px;
    padding: 0;
}

.import-content li {
    margin: 4px 0;
    color: #606266;
}

.upload-area {
    margin-top: 20px;
}

.upload-icon {
    font-size: 48px;
    color: #c0c4cc;
    margin-bottom: 12px;
}

.upload-text {
    font-size: 14px;
    color: #606266;
    margin-bottom: 4px;
}

.upload-hint {
    font-size: 12px;
    color: #909399;
}

.steps-wrapper {
    padding: 8px 4px;
}

.steps-tip {
    text-align: center;
    font-size: 13px;
    color: #909399;
    margin-top: 12px;
}

.import-content :deep(.el-tabs__item) {
    font-size: 14px;
}

.import-content :deep(.el-tabs__content) {
    padding-top: 16px;
}

.steps-images {
    display: flex;
    gap: 16px;
}

.step-image-item {
    flex: 1;
}

.step-image-label {
    text-align: center;
    font-size: 13px;
    color: #606266;
    margin-top: 8px;
    font-weight: 500;
}

.steps-tip {
    text-align: center;
    font-size: 13px;
    color: #909399;
    margin-top: 12px;
}

.import-history-card {
    border-radius: 12px;
}
</style>