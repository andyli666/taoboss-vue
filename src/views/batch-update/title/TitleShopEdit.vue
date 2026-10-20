<template>
    <el-divider content-position="left">修改范围</el-divider>
    <FormShop ref="formShopRef" @form-change="formShopChange" />

    <el-divider content-position="left">修改内容</el-divider>
    <el-form :inline="true" :model="updateContentForm" label-width="auto" style="width:100%">
        <div v-for="(domain, index) in updateContentForm.domains" :key="domain.key">
            <el-form-item :label="'将关键字' + (index + 1)">
                <el-input v-model="domain.findWordValue" placeholder="输入关键字" clearable style="width:300px" />
            </el-form-item>
            <el-form-item label="替换为">
                <el-input v-model="domain.replaceWordValue" placeholder="不填将替换为空，可以输入空格" clearable
                    style="width:300px" />
                <el-button v-if="index == 0" :icon="Plus" class="ml-5" size="small"
                    @click="addDomain">添加一行</el-button>
                <el-button v-else :icon="Minus" class="ml-5" size="small" @click="removeDomain(domain)" />
            </el-form-item>
        </div>
        <div>
            <el-form-item label="添加前缀">
                <el-input v-model="updateContentForm.prefix" clearable style="width:300px" />
            </el-form-item>
            <el-form-item label="添加后缀">
                <el-input v-model="updateContentForm.suffix" clearable style="width:300px" />
            </el-form-item>
        </div>
        <div>
            <el-form-item label="在标题第" style="margin-right: 10px;">
                <el-select v-model="updateContentForm.addIndex" style="width:100px">
                    <el-option v-for="n in 29" :label="n" :value="n" />
                </el-select>
            </el-form-item>
            <el-form-item label="个字后添加">
                <el-input v-model="updateContentForm.addWord" clearable style="width:300px" />
            </el-form-item>
        </div>

        <!-- ========== 第三组：执行方式 ========== -->
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
                    <el-date-picker v-model="executeForm.taskTime" type="datetime"
                        placeholder="请选择任务执行时间" style="width:250px"
                        value-format="YYYY-MM-DD HH:mm:ss" />
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
        <el-button type="primary" @click="startUpdate" :disabled="tableDataPreview.length == 0">
            {{ executeForm.executeMode === 'scheduled' ? '创建定时任务' : '开始修改' }}
        </el-button>
    </div>

    <el-divider content-position="left">预览修改结果</el-divider>
    <el-table size="small"
        :data="tableDataPreview.slice((currentPagePreview - 1) * pageSizePreview, currentPagePreview * pageSizePreview)" width="100%">
        <el-table-column type="index" width="55" label="序号" :index="indexMethodPreview" />
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
                        <el-row>ID:{{ scope.row.numIid }} 状态:{{
                            getApproveStatus(scope.row.approveStatus)
                        }}</el-row>
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column property="title" label="原标题" width="300">
            <template #default="scope">
                <div class="text-gray">{{ scope.row.title }}</div>
            </template>
        </el-table-column>
        <el-table-column property="newTitle" label="修改后标题">
            <template #default="scope">
                <div v-if="scope.row.newTitle == scope.row.title" class="red">
                    标题没有变化，将跳过修改
                </div>
                <div v-else class="h">
                    {{ scope.row.newTitle }}
                </div>
                <div v-if="scope.row.newTitleLength > 60" class="red">
                    标题不能超过30个汉字或60个字符，已超{{ scope.row.newTitleLength - 60 }}个字符
                </div>
            </template>
        </el-table-column>
        <el-table-column label="修改状态">
            <template #default="scope">
                <el-tag v-if="scope.row.hasChange" type="success" size="small">待修改</el-tag>
                <el-tag v-else type="info" size="small">无变化</el-tag>
                <div v-if="!scope.row.hasChange" class="gray-tip">{{ scope.row.skipMsg || '标题没有变化，将跳过' }}</div>
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
                <el-button v-if="!currentTaskId" type="primary"
                    @click="dialogProgressVisible = false">确定</el-button>
            </div>
        </template>
    </el-dialog>
    <TitleShopDetail ref="shopRecordDetailRef" :recordId="recordId" @task-created="handleTaskCreated" />
</template>

<script setup>
import { onMounted, onUnmounted, ref, useTemplateRef, reactive, watch } from 'vue'
import FormShop from '../components/FormShop.vue'
import TitleShopDetail from './TitleShopDetail.vue'
import { getItemWirelessUrl, getApproveStatus } from '@/utils/index'
import request from '@/utils/request'
import { useIndexMethod } from '@/composables/useIndexMethod'
import { Refresh, Plus, Minus } from '@element-plus/icons-vue'

const props = defineProps({
    quotaStatus: { type: Object, required: true }
})
const emit = defineEmits(['refreshQuota'])

// 修改内容表单
const updateContentForm = reactive({
    domains: [{ key: 1, findWordValue: '', replaceWordValue: '' }],
    prefix: '',
    suffix: '',
    addIndex: '1',
    addWord: ''
})

// 动态添加表单项
const addDomain = () => {
    if (updateContentForm.domains.length >= 15) {
        ElMessage.error('最多支持15行')
        return
    }
    updateContentForm.domains.push({
        key: Date.now(),
        findWordValue: '',
        replaceWordValue: ''
    })
}
// 动态删除表单项
const removeDomain = (item) => {
    const index = updateContentForm.domains.indexOf(item)
    if (index !== -1) {
        updateContentForm.domains.splice(index, 1)
    }
}

const executeForm = reactive({
    executeMode: 'immediate',
    taskTime: '',
    repeat: 0
})

// 修改内容检查
const checkUpdateContent = () => {
    if (updateContentForm.domains.length == 1
        && updateContentForm.domains[0].findWordValue == ''
        && updateContentForm.domains[0].replaceWordValue == ''
        && updateContentForm.prefix.trim() == ''
        && updateContentForm.suffix.trim() == ''
        && updateContentForm.addWord == ''
    ) {
        ElMessage.error('修改内容不能为空')
        return false
    }
    for (let i = 0; i < updateContentForm.domains.length; i++) {
        if (updateContentForm.domains[i].replaceWordValue != '' && updateContentForm.domains[i].findWordValue == '') {
            ElMessage.error('关键字' + (i + 1) + '不能为空')
            return false
        }
        if (updateContentForm.domains[i].findWordValue != '' && updateContentForm.domains[i].findWordValue == updateContentForm.domains[i].replaceWordValue) {
            ElMessage.error('关键字' + (i + 1) + '和替换内容不能相同')
            return false
        }
    }
    if (updateContentForm.prefix != '' && updateContentForm.prefix.trim() == '') {
        ElMessage.error('前缀不能为空格')
        return false
    }
    if (updateContentForm.suffix != '' && updateContentForm.suffix.trim() == '') {
        ElMessage.error('后缀不能为空格')
        return false
    }
    return true
}

// 预览
const loadingPreview = ref(false)
const formShopRef = useTemplateRef('formShopRef')
const tableDataPreview = ref([])

async function preview() {
    if (!checkUpdateContent()) {
        return
    }
    loadingPreview.value = true
    try {
        const response = await request.post('/api/v1/batch-update-title/preview', {
            filterForm: formShopRef.value.form,
            updateContentForm: updateContentForm
        })
        loadingPreview.value = false
        if (response.data.code === 0) {
            tableDataPreview.value = response.data.data.rows || []
            if (tableDataPreview.value.length === 0) {
                ElMessage.warning('没有符合条件的商品')
            }
        } else {
            ElMessage.error(response.data.msg || '预览失败')
        }
    } catch (error) {
        // 错误已由 request.js 拦截器提示，避免重复弹
        loadingPreview.value = false
    }
}

const currentPagePreview = ref(1)
const pageSizePreview = ref(10)
const handleCurrentChangePreview = (val) => {
    currentPagePreview.value = val
}
const handleSizeChangePreview = (val) => {
    pageSizePreview.value = val
}

const indexMethodPreview = (index) => {
    const { newIndex } = useIndexMethod(index, currentPagePreview, pageSizePreview)
    return newIndex.value
}

// 修改内容改变时需重新预览
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

const startUpdate = () => {
    const updatableCount = getUpdatableCount()
    if (!updatableCount) {
        ElMessage.error('没有可修改商品')
        return
    }

    if (executeForm.executeMode === 'scheduled') {
        if (!executeForm.taskTime) {
            ElMessage.error('请选择任务执行时间')
            return
        }
        const taskTime = new Date(executeForm.taskTime)
        const now = new Date()
        if (taskTime <= now) {
            ElMessage.error('任务执行时间必须晚于当前时间')
            return
        }
        const repeatText = { 0: '不重复', 1: '每天', 2: '每周', 3: '工作日', 4: '周末' }[executeForm.repeat]
        let msg = `即将创建定时任务：<br />`
        msg += `执行时间：<span class="h-b">${executeForm.taskTime}</span><br />`
        msg += `重复周期：<span class="h-b">${repeatText}</span><br />`
        msg += `修改商品数：<span class="h-b">${updatableCount}</span> 个<br />`
        msg += `确定创建？`
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

    let msg = '即将修改<span class="h-b">' + updatableCount + '</span>个商品标题'
    if (props.quotaStatus.dailyLimit > 0) {
        msg += '，批量改标题今日限额<span class="h-b">' + props.quotaStatus.dailyLimit + '</span>个'
        msg += '，已用<span class="h-b">' + props.quotaStatus.dailyUsed + '</span>'
        msg += '，剩余<span class="h-b">' + props.quotaStatus.dailyRemain + '</span>'
        if (props.quotaStatus.dailyRemain < updatableCount) {
            msg += '，剩余额度不够本次修改'
            ElMessageBox.alert(msg, '提示', { dangerouslyUseHTMLString: true })
            return
        }
    } else {
        msg += '，今日不限量'
    }
    msg += '，确定保存修改？'
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

// 获取可修改商品总数
const getUpdatableCount = () => {
    let count = 0
    tableDataPreview.value.forEach(val => {
        if (val.hasChange) {
            count++
        }
    })
    return count
}

const currentTaskId = ref(null)
const pollTimer = ref(null)

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
            const response = await request.get('/api/v1/batch-update-title/task-progress', {
                params: { task_id: taskId }
            })
            const data = response.data.data
            progressStats.total = data.total || 0
            progressStats.success = data.success || 0
            progressStats.fail = data.fail || 0
            progressStats.skip = data.skip || 0
            if (data.status === 'running') {
                percentage.value = data.progress
            } else if (data.status === 'complete') {
                percentage.value = 100
                saveCompleteMsg.value = data.message
                stopPolling()
                currentTaskId.value = null
                getShopRecord()
                emit('refreshQuota')
            } else if (data.status === 'error') {
                percentage.value = data.progress
                saveCompleteMsg.value = data.message
                stopPolling()
                currentTaskId.value = null
                getShopRecord()
                emit('refreshQuota')
            }
        } catch (error) {
            console.error('查询任务进度失败:', error)
        }
    }, 2000)
}

const doStartUpdate = async () => {
    dialogProgressVisible.value = true
    percentage.value = 0
    saveCompleteMsg.value = ''
    try {
        const response = await request.post('/api/v1/batch-update-title/create-task', {
            filterForm: formShopRef.value.form,
            updateContentForm: updateContentForm
        })
        if (response.data.code === 0) {
            currentTaskId.value = response.data.data.taskId
            getShopRecord()
            startPolling(response.data.data.taskId)
        } else {
            dialogProgressVisible.value = false
            ElMessage.error(response.data.msg || '任务创建失败')
        }
    } catch (error) {
        // 错误已由 request.js 拦截器提示，避免重复弹
        dialogProgressVisible.value = false
    }
}

const handleTaskCreated = (taskId) => {
    dialogProgressVisible.value = true
    percentage.value = 0
    saveCompleteMsg.value = ''
    progressStats.total = 0
    progressStats.success = 0
    progressStats.fail = 0
    progressStats.skip = 0
    currentTaskId.value = taskId
    getShopRecord()
    startPolling(taskId)
}

const doCreateScheduledTask = async () => {
    try {
        const response = await request.post('/api/v1/batch-update-title/create-scheduled-task', {
            filterForm: formShopRef.value.form,
            updateContentForm: {
                ...updateContentForm,
                executeMode: 'scheduled',
                taskTime: executeForm.taskTime,
                repeat: executeForm.repeat
            }
        })
        if (response.data.code === 0) {
            ElMessageBox.alert('定时任务创建成功', '提示', {
                type: 'success',
                callback: () => {
                    tableDataPreview.value = []
                    getShopRecord()
                }
            })
        } else {
            ElMessage.error(response.data.msg || '创建失败')
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
    request.post('/api/v1/batch-update-title/get-shop-record', {
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

onMounted(() => {
    getShopRecord()
})

onUnmounted(() => {
    stopPolling()
    stopRecordTimer()
})

defineExpose({ getShopRecord })
</script>

<style scoped>
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

.el-pagination {
    margin-top: 15px;
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

.task-bg-tip {
    color: #909399;
    font-size: 12px;
    margin-top: 8px;
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

.gray-tip {
    color: #909399;
    font-size: 12px;
}

.ml-5 {
    margin-left: 5px;
}

.mt-15 {
    margin-top: 15px;
}

.h-b {
    font-weight: bold;
    color: #409EFF;
}

.red {
    color: #F56C6C;
}

.h {
    font-weight: 500;
}

.text-gray {
    color: #909399;
}
</style>
