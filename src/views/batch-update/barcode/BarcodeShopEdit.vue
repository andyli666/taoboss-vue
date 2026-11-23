<template>
    <el-divider content-position="left">修改范围</el-divider>
    <FormShop ref="formShopRef" @form-change="formShopChange" />

    <el-divider content-position="left">修改内容</el-divider>
    <el-form :inline="true" style="width:100%">
        <div class="form-group">
            <div class="mode-row">
                <el-radio v-model="updateContentForm.mode" value="unified">统一改为</el-radio>
                <el-input v-model="updateContentForm.unifiedValue" :disabled="updateContentForm.mode !== 'unified'"
                    placeholder="不填将统一修改为空（即：删除条形码）" clearable style="width:320px" />
            </div>
            <div class="rule-tip">
                请填写正确条码，将有助于平台准确识别您的商品，消费者能更方便找到您的商品，也可以提供更准确、全面的信息导购。
            </div>
            <div class="mode-row mt-10">
                <el-radio v-model="updateContentForm.mode" value="outerId">复制商家编码作为条形码</el-radio>
            </div>
            <div class="rule-tip">
                此功能仅针对商家编码内容就是条形码的商品，如商家编码不是合法条形码将出错
            </div>
        </div>

        <div class="form-group">
            <div class="form-group-title">条形码范围</div>
            <div class="sku-filter-row">
                <el-checkbox v-model="updateContentForm.itemBarcode">商品条形码</el-checkbox>
                <el-checkbox v-model="updateContentForm.skuBarcode">sku条形码</el-checkbox>
                <span class="ignore-switch">
                    <el-switch v-model="updateContentForm.ignoreExisting" />
                    <span class="ignore-label">忽略已有条形码</span>
                </span>
            </div>
            <div class="rule-tip pl-20">开启“忽略已有条形码”后，已有条形码的商品/SKU 将被跳过</div>
        </div>

        <!-- ========== 筛选条件 ========== -->
        <div class="form-group form-group-filter">
            <div class="form-group-title">
                筛选条件
                <span class="gray-tip">（仅在勾选“sku条形码”时生效）</span>
            </div>
            <div class="sku-filter-row">
                <span class="sku-filter-label">SKU名称包含</span>
                <el-input v-model="updateContentForm.skuNameContains" :disabled="!updateContentForm.skuBarcode"
                    placeholder="多个关键字用英文逗号,分隔" clearable style="width:400px" />
                <span class="gray-tip ml-10">（只修改含有关键字的SKU，留空表示全部修改）</span>
            </div>
            <div class="sku-filter-row">
                <span class="sku-filter-label">SKU名称排除</span>
                <el-input v-model="updateContentForm.skuNameExcludes" :disabled="!updateContentForm.skuBarcode"
                    placeholder="多个关键字用英文逗号,分隔" clearable style="width:400px" />
                <span class="gray-tip ml-10">（排除含有关键字的SKU，留空表示不排除）</span>
            </div>
        </div>

        <!-- ========== 执行方式 ========== -->
        <div class="form-group">
            <div class="form-group-title">执行方式</div>
            <div class="sku-filter-row">
                <el-radio-group v-model="executeForm.executeMode">
                    <el-radio value="immediate">立即修改</el-radio>
                    <el-radio value="scheduled">定时修改</el-radio>
                </el-radio-group>
            </div>
            <template v-if="executeForm.executeMode === 'scheduled'">
                <div class="sku-filter-row">
                    <span class="sku-filter-label">任务执行时间</span>
                    <el-date-picker v-model="executeForm.taskTime" type="datetime" placeholder="请选择任务执行时间"
                        style="width:250px" value-format="YYYY-MM-DD HH:mm:ss" />
                </div>
                <div class="sku-filter-row">
                    <span class="sku-filter-label">重复周期</span>
                    <el-radio-group v-model="executeForm.repeat">
                        <el-radio :value="0">不重复，只执行一次</el-radio>
                        <el-radio :value="1">每天</el-radio>
                        <el-radio :value="2">每周</el-radio>
                        <el-radio :value="3">工作日</el-radio>
                        <el-radio :value="4">周末</el-radio>
                    </el-radio-group>
                </div>
            </template>
        </div>
    </el-form>

    <div class="btn-wrap">
        <el-button type="primary" @click="preview" :loading="loadingPreview">预览修改结果</el-button>
        <el-button type="primary" @click="startUpdate" :disabled="updatableCount === 0">
            {{ executeForm.executeMode === 'scheduled' ? '创建定时任务' : '开始修改' }}
        </el-button>
    </div>

    <el-divider content-position="left">预览修改结果</el-divider>
    <el-table size="small"
        :data="tableDataPreview.slice((currentPagePreview - 1) * pageSizePreview, currentPagePreview * pageSizePreview)">
        <el-table-column type="index" width="50" label="序号" :index="indexMethodPreview" />
        <el-table-column property="picUrl" label="商品信息" width="350">
            <template #default="scope">
                <div class="textarea-wrap">
                    <div>
                        <a :href="getItemWirelessUrl(scope.row.numIid)" target="_blank">
                            <el-image :src="scope.row.picUrl + '_60x60.jpg'" style="width:60px">
                                <template #error>&nbsp;</template>
                            </el-image>
                        </a>
                    </div>
                    <div class="ml-5 text-gray">
                        <el-row>{{ scope.row.title }}</el-row>
                        <el-row class="item-meta">ID:{{ scope.row.numIid }} 一口价:{{ Number(scope.row.price || 0).toFixed(2) }}
                            状态:{{
                                getApproveStatus(scope.row.approveStatus)
                            }}</el-row>
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="条形码对象" min-width="210">
            <template #default="scope">
                <div v-if="getBarcodeLines(scope.row).length">
                    <div v-for="line in getBarcodeLines(scope.row)" :key="line.key" class="sku-line">
                        {{ line.label }}
                    </div>
                </div>
                <div v-else class="gray-tip">-</div>
            </template>
        </el-table-column>
        <el-table-column label="原条形码" min-width="130">
            <template #default="scope"> 
                <div v-if="getBarcodeLines(scope.row).length">
                    <div v-for="line in getBarcodeLines(scope.row)" :key="line.key" class="sku-line">
                        {{ line.original || '-' }}
                    </div>
                </div>
                <div v-else class="gray-tip">-</div>
            </template>
        </el-table-column>
        <el-table-column label="修改后条形码" min-width="130">
            <template #default="scope">
                <div v-if="getBarcodeLines(scope.row).length">
                    <div v-for="line in getBarcodeLines(scope.row)" :key="line.key" class="sku-line">
                        <template v-if="line.newValue !== line.original">
                            <span class="h">{{ line.newValue || '-' }}</span>
                            <span v-if="line.newValue === ''" class="gray-tip ml-5">(清空)</span>
                        </template>
                        <template v-else>
                            <span>{{ line.newValue || '-' }}</span>
                            <span class="gray-tip ml-5">(未变化)</span>
                        </template>
                    </div>
                </div>
                <div v-else class="gray-tip">-</div>
            </template>
        </el-table-column>
        <el-table-column label="修改状态" min-width="100">
            <template #default="scope">
                <el-tag v-if="scope.row.hasChange" type="success" size="small">待修改</el-tag>
                <template v-else>
                    <el-tag type="info" size="small">无变化</el-tag>
                    <div class="gray-tip">{{ scope.row.skipMsg || '条形码没有变化，将跳过' }}</div>
                </template>
            </template>
        </el-table-column>
    </el-table>
    <el-pagination @current-change="handleCurrentChangePreview" @size-change="handleSizeChangePreview"
        :current-page="currentPagePreview" v-model:page-size="pageSizePreview" :page-sizes="[10, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper" :total="tableDataPreview.length" size="small" />

    <div class="mt-15">&nbsp;</div>
    <el-divider content-position="left">
        <div class="record-divider-inner">
            修改记录
            <el-tooltip content="刷新修改记录" placement="top">
                <el-icon class="record-refresh" @click="getShopRecord">
                    <Refresh />
                </el-icon>
            </el-tooltip>
        </div>
    </el-divider>
    <el-table size="small" :data="tableDataRecord">
        <el-table-column type="index" width="50" label="序号" />
        <el-table-column property="datetime" label="修改时间" width="150" />
        <el-table-column label="状态" width="80">
            <template #default="scope">
                <el-tag :type="{ pending: 'warning', running: 'primary', complete: 'success', partial: 'warning', failed: 'danger', cancel: 'info' }[scope.row.status] || 'info'"
                    size="small">
                    {{ { pending: '待执行', running: '执行中', complete: '已完成', partial: '部分成功', failed: '已失败', cancel: '已取消' }[scope.row.status] || scope.row.status }}
                </el-tag>
            </template>
        </el-table-column>
        <el-table-column property="updateRangeText" label="修改范围">
            <template #default="scope">
                <div v-html="scope.row.updateRangeText"></div>
            </template>
        </el-table-column>
        <el-table-column property="updateContentText" label="修改内容">
            <template #default="scope">
                <div v-html="scope.row.updateContentText"></div>
            </template>
        </el-table-column>
        <el-table-column property="total" label="总数" width="70" />
        <el-table-column property="success" label="成功" width="70" />
        <el-table-column property="fail" label="出错" width="70" />
        <el-table-column property="skip" label="跳过" width="70" />
        <el-table-column label="操作" width="100">
            <template #default="scope">
                <el-button size="small" plain
                    @click="recordId = scope.row.id; shopRecordDetailRef.dialogVisible = true">查看</el-button>
            </template>
        </el-table-column>
    </el-table>
    <el-pagination @current-change="handleCurrentChangeRecord" @size-change="handleSizeChangeRecord"
        :current-page="currentPageRecord" v-model:page-size="pageSizeRecord" :page-sizes="[10, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper" :total="totalRecord" size="small">
    </el-pagination>

    <el-dialog v-model="dialogProgressVisible" title="修改进度" width="800" :close-on-click-modal="false"
        @closed="getShopRecord">
        <el-progress :text-inside="true" :stroke-width="26" :percentage="percentage" />
        <div class="percent-tip">
            <div class="progress-stats">
                <span>总商品：<b>{{ progressStats.total }}</b></span>
                <span class="stat-success">成功：<b>{{ progressStats.success }}</b></span>
                <span class="stat-fail">失败：<b>{{ progressStats.fail }}</b></span>
                <span class="stat-skip">跳过：<b>{{ progressStats.skip }}</b></span>
            </div>
            <div>{{ saveCompleteMsg }}</div>
            <div v-if="currentTaskId" class="task-bg-tip">
                任务后台执行中，关闭页面不会中断，重新进入本页面可继续查看进度
            </div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button v-if="!currentTaskId" type="primary" @click="dialogProgressVisible = false">确定</el-button>
            </div>
        </template>
    </el-dialog>
    <BarcodeShopDetail ref="shopRecordDetailRef" :recordId="recordId" @task-created="handleTaskCreated" />
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import FormShop from '../components/FormShop.vue'
import BarcodeShopDetail from './BarcodeShopDetail.vue'
import { getItemWirelessUrl, getApproveStatus } from '@/utils/index'
import { validateBarcode } from './barcodeRule'
import request from '@/utils/request'
import { useIndexMethod } from '@/composables/useIndexMethod'

const props = defineProps({
    quotaStatus: { type: Object, required: true }
})
const emit = defineEmits(['refreshQuota'])

// 修改内容
const updateContentForm = reactive({
    mode: 'unified', // unified=统一改为，outerId=复制商家编码作为条形码
    unifiedValue: '',
    itemBarcode: true,
    skuBarcode: true,
    ignoreExisting: false,
    skuNameContains: '',
    skuNameExcludes: ''
})

const formShopRef = useTemplateRef('formShopRef')

// 执行方式：立即修改 / 定时修改
const executeForm = reactive({
    executeMode: 'immediate',
    taskTime: '',
    repeat: 0
})

// 提交给后端的修改内容（SKU筛选条件仅在勾选sku条形码时生效）
const buildUpdateContent = () => ({
    mode: updateContentForm.mode,
    unifiedValue: updateContentForm.mode === 'unified' ? updateContentForm.unifiedValue : '',
    itemBarcode: updateContentForm.itemBarcode,
    skuBarcode: updateContentForm.skuBarcode,
    ignoreExisting: updateContentForm.ignoreExisting,
    skuNameContains: updateContentForm.skuBarcode ? updateContentForm.skuNameContains : '',
    skuNameExcludes: updateContentForm.skuBarcode ? updateContentForm.skuNameExcludes : ''
})

// 修改内容检查（仅做前端可判定的基础格式校验）
const checkUpdateContent = () => {
    if (!updateContentForm.itemBarcode && !updateContentForm.skuBarcode) {
        ElMessage.error('请至少勾选一项条形码范围（商品条形码 / sku条形码）')
        return false
    }
    if (updateContentForm.mode === 'unified' && updateContentForm.unifiedValue !== '') {
        const msg = validateBarcode(updateContentForm.unifiedValue)
        if (msg) {
            ElMessage.error(msg)
            return false
        }
    }
    return true
}

// 预览
const loadingPreview = ref(false)
const tableDataPreview = ref([])
const currentPagePreview = ref(1)
const pageSizePreview = ref(10)

// 预览行内条形码展示行：商品级条形码 + 各SKU条形码
const getBarcodeLines = (row) => {
    const lines = []
    if (updateContentForm.itemBarcode) {
        lines.push({
            key: 'item',
            label: '商品级条形码',
            original: row.originalBarcode ?? '',
            newValue: row.newBarcode ?? ''
        })
    }
    ;(row.newSkus || []).forEach((sku, idx) => {
        lines.push({
            key: 'sku' + idx,
            label: sku.propertiesName || 'SKU',
            original: sku.originalValue ?? '',
            newValue: sku.newValue ?? ''
        })
    })
    return lines
}

async function preview() {
    if (!checkUpdateContent()) {
        return
    }
    loadingPreview.value = true
    try {
        const response = await request.post('/api/v1/batch-update-barcode/preview', {
            filterForm: formShopRef.value.form,
            updateContentForm: buildUpdateContent()
        })
        loadingPreview.value = false
        const d = response.data
        if (d.code === 0) {
            const rows = d.data.rows || []
            // 后端未返回 hasChange 时，前端按条形码是否变化兜底计算
            rows.forEach(row => {
                if (typeof row.hasChange !== 'boolean') {
                    row.hasChange = getBarcodeLines(row).some(line => line.newValue !== line.original)
                }
            })
            tableDataPreview.value = rows
            currentPagePreview.value = 1
            if (!rows.length) {
                ElMessage.warning('没有符合条件的商品')
            }
        } else {
            ElMessage.error(d.msg || '预览失败')
        }
    } catch (error) {
        // 错误已由 request.js 拦截器提示，避免重复弹
        loadingPreview.value = false
    }
}

const handleCurrentChangePreview = (val) => {
    currentPagePreview.value = val
}
const handleSizeChangePreview = () => {
    currentPagePreview.value = 1
}

const indexMethodPreview = (index) => {
    const { newIndex } = useIndexMethod(index, currentPagePreview, pageSizePreview)
    return newIndex.value
}

const updatableCount = computed(() => tableDataPreview.value.filter(row => row.hasChange).length)

// 修改内容/范围改变时需重新预览
watch(updateContentForm, () => {
    tableDataPreview.value = []
}, { deep: true })

const formShopChange = () => {
    tableDataPreview.value = []
}

// 开始修改
const dialogProgressVisible = ref(false)
const percentage = ref(0)
const saveCompleteMsg = ref('')
const progressStats = reactive({ total: 0, success: 0, fail: 0, skip: 0 })
const currentTaskId = ref(null)
const pollTimer = ref(null)

const resetProgress = () => {
    percentage.value = 0
    saveCompleteMsg.value = ''
    progressStats.total = 0
    progressStats.success = 0
    progressStats.fail = 0
    progressStats.skip = 0
}

const stopPolling = () => {
    if (pollTimer.value) {
        clearInterval(pollTimer.value)
        pollTimer.value = null
    }
}

const startPolling = (taskId) => {
    stopPolling()
    pollTimer.value = setInterval(async () => {
        try {
            const response = await request.get('/api/v1/batch-update-barcode/task-progress', {
                params: { task_id: taskId }
            })
            const data = response.data.data
            progressStats.total = data.total || 0
            progressStats.success = data.success || 0
            progressStats.fail = data.fail || 0
            progressStats.skip = data.skip || 0
            if (data.status === 'running') {
                percentage.value = data.progress
            } else if (data.status === 'complete' || data.status === 'error') {
                percentage.value = data.status === 'complete' ? 100 : data.progress
                saveCompleteMsg.value = data.message
                stopPolling()
                currentTaskId.value = null
                emit('refreshQuota')
                getShopRecord()
            }
        } catch (error) {
            console.error('查询任务进度失败:', error)
        }
    }, 2000)
}

const startUpdate = () => {
    if (!checkUpdateContent()) {
        return
    }
    if (!updatableCount.value) {
        ElMessage.error('没有可修改商品')
        return
    }

    if (executeForm.executeMode === 'scheduled') {
        if (!executeForm.taskTime) {
            ElMessage.error('请选择任务执行时间')
            return
        }
        if (new Date(executeForm.taskTime) <= new Date()) {
            ElMessage.error('任务执行时间必须晚于当前时间')
            return
        }
        const repeatText = { 0: '不重复', 1: '每天', 2: '每周', 3: '工作日', 4: '周末' }[executeForm.repeat]
        let msg = '即将创建定时任务：<br />'
        msg += '执行时间：<span class="h-b">' + executeForm.taskTime + '</span><br />'
        msg += '重复周期：<span class="h-b">' + repeatText + '</span><br />'
        msg += '修改商品数：<span class="h-b">' + updatableCount.value + '</span> 个<br />'
        msg += '确定创建？'
        ElMessageBox.confirm(msg, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info',
            dangerouslyUseHTMLString: true
        }).then(() => {
            doCreateScheduledTask()
        }).catch(() => { })
        return
    }

    const count = updatableCount.value
    let msg = ''
    if (updateContentForm.mode === 'outerId') {
        msg = '即将把 <span class="h-b">' + count + '</span> 个商品的条形码改为其商家编码，确定保存修改？'
    } else if (updateContentForm.unifiedValue === '') {
        msg = '即将清空 <span class="h-b">' + count + '</span> 个商品的条形码，确定保存修改？'
    } else {
        const value = updateContentForm.unifiedValue.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        msg = '即将把 <span class="h-b">' + count + '</span> 个商品的条形码统一改为 <span class="h-b">' + value + '</span>，确定保存修改？'
    }
    if (props.quotaStatus.dailyLimit > 0) {
        msg = msg.replace('，确定保存修改？', '')
        msg += '，今日限额<span class="h-b">' + props.quotaStatus.dailyLimit + '</span>个'
        msg += '，已用<span class="h-b">' + props.quotaStatus.dailyUsed + '</span>'
        msg += '，剩余<span class="h-b">' + props.quotaStatus.dailyRemain + '</span>'
        if (props.quotaStatus.dailyRemain < count) {
            msg += '，剩余额度不够本次修改'
            ElMessageBox.alert(msg, '提示', { dangerouslyUseHTMLString: true })
            return
        }
        msg += '，确定保存修改？'
    }
    ElMessageBox.confirm(msg, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
        width: 560,
        dangerouslyUseHTMLString: true
    }).then(() => {
        doStartUpdate()
    }).catch(() => { })
}

const doStartUpdate = async () => {
    resetProgress()
    dialogProgressVisible.value = true
    try {
        const response = await request.post('/api/v1/batch-update-barcode/create-task', {
            filterForm: formShopRef.value.form,
            updateContentForm: buildUpdateContent()
        })
        const d = response.data
        if (d.code === 0) {
            currentTaskId.value = d.data.taskId
            startPolling(d.data.taskId)
        } else {
            dialogProgressVisible.value = false
            ElMessage.error(d.msg || '任务创建失败')
        }
    } catch (error) {
        // 错误已由 request.js 拦截器提示，避免重复弹
        dialogProgressVisible.value = false
    }
}

// 创建定时任务
const doCreateScheduledTask = async () => {
    try {
        const response = await request.post('/api/v1/batch-update-barcode/create-scheduled-task', {
            filterForm: formShopRef.value.form,
            updateContentForm: {
                ...buildUpdateContent(),
                executeMode: 'scheduled',
                taskTime: executeForm.taskTime,
                repeat: executeForm.repeat
            }
        })
        const d = response.data
        if (d.code === 0) {
            ElMessageBox.alert('定时任务创建成功', '提示', {
                type: 'success',
                callback: () => {
                    tableDataPreview.value = []
                    getShopRecord()
                    emit('refreshQuota')
                }
            })
        } else {
            ElMessage.error(d.msg || '创建失败')
        }
    } catch (error) {
        // 错误已由 request.js 拦截器提示，避免重复弹
    }
}

// 获取范围修改记录（分页）
const tableDataRecord = ref([])
const currentPageRecord = ref(1)
const pageSizeRecord = ref(10)
const totalRecord = ref(0)
const getShopRecord = () => {
    request.post('/api/v1/batch-update-barcode/get-shop-record', {
        page: currentPageRecord.value,
        pageSize: pageSizeRecord.value
    }).then(response => {
        tableDataRecord.value = response.data.data.rows || []
        totalRecord.value = response.data.data.total || 0
        const hasActive = (response.data.data.activeCount || 0) > 0
        if (hasActive) {
            startRecordTimer()
        } else {
            stopRecordTimer()
        }
    }).catch(() => {
        // 错误已由 request.js 拦截器提示，避免重复弹
    })
}
const handleCurrentChangeRecord = (val) => {
    currentPageRecord.value = val
    getShopRecord()
}
const handleSizeChangeRecord = () => {
    currentPageRecord.value = 1
    getShopRecord()
}

const recordId = ref()
const shopRecordDetailRef = useTemplateRef('shopRecordDetailRef')

let recordTimer = null

const startRecordTimer = () => {
    if (recordTimer) return
    recordTimer = setInterval(() => {
        if (!document.hidden) getShopRecord()
    }, 30000)
}

const stopRecordTimer = () => {
    if (recordTimer) {
        clearInterval(recordTimer)
        recordTimer = null
    }
}

// 记录详情里发起的重试任务，复用本页进度弹窗
const handleTaskCreated = (taskId) => {
    resetProgress()
    currentTaskId.value = taskId
    dialogProgressVisible.value = true
    startPolling(taskId)
}

onMounted(() => {
    getShopRecord()
})

onUnmounted(() => {
    stopPolling()
    stopRecordTimer()
})
</script>

<style scoped>
.el-pagination {
    margin-top: 15px;
}

.record-divider-inner {
    display: flex;
    align-items: center;
    gap: 8px;
}

.record-refresh {
    cursor: pointer;
    color: #909399;
    transition: color 0.2s;
}

.record-refresh:hover {
    color: #409eff;
}

.task-bg-tip {
    color: #909399;
    font-size: 12px;
    margin-top: 5px;
}

.textarea-wrap {
    display: flex;
    align-items: center;
}

.btn-wrap {
    display: flex;
    justify-content: center;
}

.btn-wrap .el-button:first-of-type {
    margin-left: -100px;
}

.btn-wrap .el-button+.el-button {
    margin-left: 50px;
}

.percent-tip {
    margin-top: 10px;
    line-height: 2em;
}

.progress-stats {
    display: flex;
    gap: 24px;
}

.progress-stats .stat-success b {
    color: #67c23a;
}

.progress-stats .stat-fail b {
    color: #f56c6c;
}

.progress-stats .stat-skip b {
    color: #909399;
}

.dialog-footer {
    padding-right: 15px;
}

.form-group {
    margin-bottom: 15px;
    padding: 10px 0;
    border-bottom: 1px dashed #ebeef5;
}

.form-group:last-child {
    border-bottom: none;
}

.form-group-title {
    color: #303133;
    margin-bottom: 10px;
    font-size: 14px;
}

.mode-row {
    display: flex;
    align-items: center;
    gap: 5px;
    padding-left: 20px;
}

.ignore-switch {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: 20px;
}

.ignore-label {
    font-size: 13px;
    color: #606266;
}

.rule-tip {
    color: #909399;
    font-size: 12px;
    padding-left: 40px;
    margin-top: 5px;
    line-height: 1.6;
}

.rule-tip.pl-20 {
    padding-left: 20px;
}

.sku-filter-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    padding-left: 20px;
    margin-bottom: 10px;
}

.sku-filter-row:last-child {
    margin-bottom: 0;
}

.sku-filter-label {
    display: inline-block;
    color: #606266;
    font-size: 14px;
    flex-shrink: 0;
    text-align: left;
}

.form-group-filter .sku-filter-label {
    font-size: 13px;
}

.form-group-filter :deep(.el-input) {
    font-size: 13px;
}

.sku-line {
    line-height: 1.8;
    font-size: 12px;
    color: #606266;
}

.item-meta {
    font-size: 12px;
    color: #909399;
}

.gray-tip {
    color: #909399;
    font-size: 12px;
}

.ml-5 {
    margin-left: 5px;
}

.ml-10 {
    margin-left: 10px;
}

.mt-10 {
    margin-top: 10px;
}

.mt-15 {
    margin-top: 15px;
}

.h-b {
    font-weight: bold;
    color: #409EFF;
}

.h {
    color: #FF9900;
}

.text-gray {
    color: #909399;
}
</style>
