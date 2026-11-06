<template>
    <el-divider content-position="left">修改范围</el-divider>
    <FormShop ref="formShopRef" @form-change="formShopChange" />

    <el-divider content-position="left">修改内容</el-divider>
    <el-alert class="content-tip" type="info" show-icon :closable="false" title="请在需要修改的内容前打√" />

    <div class="content-list">
        <!-- 库存扣减方式 -->
        <div class="content-row">
            <el-checkbox v-model="updateContentForm.subStock.enabled" class="content-check">
                库存扣减方式
            </el-checkbox>
            <div class="content-control">
                <el-radio-group v-model="updateContentForm.subStock.mode"
                    :disabled="!updateContentForm.subStock.enabled" class="mr-30">
                    <el-radio value="unified">统一替换</el-radio>
                    <el-radio value="replace">选择替换</el-radio>
                </el-radio-group>
                <template v-if="updateContentForm.subStock.mode === 'unified'">
                    <span class="row-label">统一改为</span>
                    <el-select v-model="updateContentForm.subStock.unifiedValue" style="width:160px"
                        :disabled="!updateContentForm.subStock.enabled">
                        <el-option label="拍下减库存" value="1" />
                        <el-option label="付款减库存" value="0" />
                    </el-select>
                </template>
                <template v-else>
                    <span class="row-label">将当前是</span>
                    <el-select v-model="updateContentForm.subStock.currentValue" placeholder="请选择"
                        style="width:160px" :disabled="!updateContentForm.subStock.enabled"
                        @change="onSubStockCurrentChange">
                        <el-option label="拍下减库存" value="1" />
                        <el-option label="付款减库存" value="0" />
                    </el-select>
                    <span class="row-label">的修改为</span>
                    <el-select v-model="updateContentForm.subStock.targetValue" placeholder="请选择"
                        style="width:160px" :disabled="!updateContentForm.subStock.enabled"
                        @change="onSubStockTargetChange">
                        <el-option label="拍下减库存" value="1" />
                        <el-option label="付款减库存" value="0" />
                    </el-select>
                </template>
            </div>
        </div>

        <!-- 保修服务 -->
        <div class="content-row">
            <el-checkbox v-model="updateContentForm.warranty.enabled" class="content-check">
                保修服务
            </el-checkbox>
            <div class="content-control">
                <el-radio-group v-model="updateContentForm.warranty.value"
                    :disabled="!updateContentForm.warranty.enabled">
                    <el-radio value="0">无</el-radio>
                    <el-radio value="1">有</el-radio>
                </el-radio-group>
            </div>
        </div>

        <!-- 服务承诺【7天退货】 -->
        <div class="content-row">
            <div class="content-check-wrap">
                <el-checkbox v-model="updateContentForm.sevenDayOptional.enabled" class="content-check">
                    服务承诺【7天退货】
                </el-checkbox>
                <el-tooltip :content="sevenDayTip" placement="top" :show-after="200">
                    <el-icon class="tip-icon">
                        <QuestionFilled />
                    </el-icon>
                </el-tooltip>
            </div>
            <div class="content-control">
                <el-radio-group v-model="updateContentForm.sevenDayOptional.value"
                    :disabled="!updateContentForm.sevenDayOptional.enabled">
                    <el-radio value="false">否</el-radio>
                    <el-radio value="true">是</el-radio>
                </el-radio-group>
            </div>
        </div>

        <!-- 物流体积 -->
        <div class="content-row">
            <el-checkbox v-model="updateContentForm.deliverVolumn.enabled" class="content-check">
                物流体积(m³)
            </el-checkbox>
            <div class="content-control">
                <el-input v-model="updateContentForm.deliverVolumn.value" placeholder="请输入" clearable
                    style="width:200px" :disabled="!updateContentForm.deliverVolumn.enabled"
                    @input="onDeliverVolumnInput" />
                <span class="gray-tip">（留空表示清空已设置的物流体积；只能输入正数，最多6位小数）</span>
            </div>
        </div>

        <!-- 物流重量 -->
        <div class="content-row">
            <el-checkbox v-model="updateContentForm.deliverWeight.enabled" class="content-check">
                物流重量(kg)
            </el-checkbox>
            <div class="content-control">
                <el-input v-model="updateContentForm.deliverWeight.value" placeholder="请输入" clearable
                    style="width:200px" :disabled="!updateContentForm.deliverWeight.enabled"
                    @input="onDeliverWeightInput" />
                <span class="gray-tip">（留空表示清空已设置的物流重量；只能输入正数，最多3位小数）</span>
            </div>
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

    <div class="btn-wrap">
        <el-button type="primary" @click="preview" :loading="loadingPreview">预览修改结果</el-button>
        <el-button type="primary" @click="startUpdate" :disabled="tableDataPreview.length == 0">
            {{ executeForm.executeMode === 'scheduled' ? '创建定时任务' : '开始修改' }}
        </el-button>
    </div>

    <el-divider content-position="left">预览修改结果</el-divider>
    <el-table size="small"
        :data="tableDataPreview.slice((currentPagePreview - 1) * pageSizePreview, currentPagePreview * pageSizePreview)"
        width="100%">
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
                        <el-row>ID:{{ scope.row.numIid }} 状态:{{ getApproveStatus(scope.row.approveStatus) }}</el-row>
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="修改内容" min-width="300">
            <template #default="scope">
                <div v-if="scope.row.changes && scope.row.changes.length">
                    <div v-for="(change, index) in scope.row.changes" :key="index" class="change-line">
                        <span class="change-name">{{ change.propName }}：</span>
                        <span class="text-gray">{{ change.oldValue || '空' }}</span>
                        <span class="change-arrow">→</span>
                        <span class="h">{{ change.newValue || '空' }}</span>
                    </div>
                </div>
                <div v-else class="text-gray">-</div>
                <div v-if="!scope.row.hasChange" class="gray-tip">{{ scope.row.skipMsg || '内容没有变化，将跳过' }}</div>
            </template>
        </el-table-column>
        <el-table-column label="修改状态" width="100">
            <template #default="scope">
                <el-tag v-if="scope.row.hasChange" type="success" size="small">待修改</el-tag>
                <el-tag v-else type="info" size="small">无变化</el-tag>
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
                <el-tag
                    :type="{ pending: 'warning', running: 'primary', complete: 'success', partial: 'warning', failed: 'danger', cancel: 'info' }[scope.row.status] || 'info'"
                    size="small">
                    {{ {
                        pending: '待执行', running: '执行中', complete: '已完成', partial: '部分成功', failed: '已失败', cancel: '已取消'
                    }[scope.row.status] || scope.row.status }}
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

    <OtherShopDetail ref="shopRecordDetailRef" :recordId="recordId" @task-created="handleTaskCreated" />
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref, useTemplateRef, watch } from 'vue'
import FormShop from '../components/FormShop.vue'
import OtherShopDetail from './OtherShopDetail.vue'
import { getItemWirelessUrl, getApproveStatus } from '@/utils/index'
import request from '@/utils/request'
import { useIndexMethod } from '@/composables/useIndexMethod'
import { Refresh, QuestionFilled } from '@element-plus/icons-vue'

const props = defineProps({
    quotaStatus: { type: Object, required: true }
})
const emit = defineEmits(['refreshQuota'])

const sevenDayTip = '你的选择只是其中一个因素，最终以类目和属性条件来确定是否支持7天，淘宝平台会自动判断。例如该商品在淘宝后台中是必须支持的，就算这边选择了“否”也是无法修改的'

// ========== 修改内容 ==========
const updateContentForm = reactive({
    subStock: {
        enabled: false,
        mode: 'unified',
        unifiedValue: '1',
        currentValue: '',
        targetValue: ''
    },
    warranty: { enabled: false, value: '0' },
    sevenDayOptional: { enabled: false, value: 'false' },
    deliverVolumn: { enabled: false, value: '' },
    deliverWeight: { enabled: false, value: '' }
})

// 选择替换：任一选项改变后，另一个自动变为相反的值（1=拍下减库存，0=付款减库存）
const onSubStockCurrentChange = (value) => {
    updateContentForm.subStock.targetValue = value === '1' ? '0' : '1'
}
const onSubStockTargetChange = (value) => {
    updateContentForm.subStock.currentValue = value === '1' ? '0' : '1'
}

// 物流体积/重量输入过滤：只允许正数，过滤非法字符，限制小数位数
const sanitizeDecimal = (value, maxDecimals) => {
    let v = String(value ?? '').replace(/[^\d.]/g, '')
    const firstDot = v.indexOf('.')
    if (firstDot !== -1) {
        const int = v.slice(0, firstDot)
        const dec = v.slice(firstDot + 1).replace(/\./g, '').slice(0, maxDecimals)
        v = int + '.' + dec
    }
    return v
}
const onDeliverVolumnInput = (value) => {
    updateContentForm.deliverVolumn.value = sanitizeDecimal(value, 6)
}
const onDeliverWeightInput = (value) => {
    updateContentForm.deliverWeight.value = sanitizeDecimal(value, 3)
}

const executeForm = reactive({
    executeMode: 'immediate',
    taskTime: '',
    repeat: 0
})

// ========== 预览 ==========
const loadingPreview = ref(false)
const formShopRef = useTemplateRef('formShopRef')
const tableDataPreview = ref([])

const checkUpdateContent = () => {
    const form = updateContentForm
    if (!form.subStock.enabled && !form.warranty.enabled && !form.sevenDayOptional.enabled
        && !form.deliverVolumn.enabled && !form.deliverWeight.enabled) {
        ElMessage.error('请至少勾选一个要修改的内容')
        return false
    }

    if (form.subStock.enabled) {
        if (form.subStock.mode === 'unified') {
            if (form.subStock.unifiedValue === '' || form.subStock.unifiedValue === null) {
                ElMessage.error('请选择库存扣减方式统一改为的值')
                return false
            }
        } else {
            if (form.subStock.currentValue === '' || form.subStock.targetValue === '') {
                ElMessage.error('请选择库存扣减方式的「将当前是」和「的修改为」')
                return false
            }
            if (form.subStock.currentValue === form.subStock.targetValue) {
                ElMessage.error('库存扣减方式的「将当前是」和「的修改为」不能相同')
                return false
            }
        }
    }

    if (form.deliverVolumn.enabled && form.deliverVolumn.value !== '' && !(Number(form.deliverVolumn.value) > 0)) {
        ElMessage.error('物流体积必须为大于0的正数')
        return false
    }
    if (form.deliverWeight.enabled && form.deliverWeight.value !== '' && !(Number(form.deliverWeight.value) > 0)) {
        ElMessage.error('物流重量必须为大于0的正数')
        return false
    }

    return true
}

const preview = async () => {
    if (!checkUpdateContent()) {
        return
    }
    loadingPreview.value = true
    try {
        const response = await request.post('/api/v1/batch-update-other/preview', {
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

watch(updateContentForm, () => {
    tableDataPreview.value = []
}, { deep: true })

const formShopChange = () => {
    tableDataPreview.value = []
}

// ========== 开始修改 ==========
const dialogProgressVisible = ref(false)
const percentage = ref(0)
const saveCompleteMsg = ref('')
const progressStats = reactive({ total: 0, success: 0, fail: 0, skip: 0 })
const currentTaskId = ref(null)
const pollTimer = ref(null)

const getUpdatableCount = () => {
    let count = 0
    tableDataPreview.value.forEach(row => {
        if (row.hasChange) {
            count++
        }
    })
    return count
}

const startUpdate = () => {
    if (!checkUpdateContent()) {
        return
    }
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
        if (taskTime <= new Date()) {
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

    let msg = '即将修改<span class="h-b">' + updatableCount + '</span>个商品的其他属性'
    if (props.quotaStatus.dailyLimit > 0) {
        msg += '，批量改其他属性今日限额<span class="h-b">' + props.quotaStatus.dailyLimit + '</span>个'
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
            const response = await request.get('/api/v1/batch-update-other/task-progress', {
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
    progressStats.total = 0
    progressStats.success = 0
    progressStats.fail = 0
    progressStats.skip = 0
    try {
        const response = await request.post('/api/v1/batch-update-other/create-task', {
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
        const response = await request.post('/api/v1/batch-update-other/create-scheduled-task', {
            filterForm: formShopRef.value.form,
            updateContentForm: updateContentForm,
            taskTime: executeForm.taskTime,
            repeat: executeForm.repeat
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

// ========== 修改记录 ==========
const tableDataRecord = ref([])
const currentPageRecord = ref(1)
const pageSizeRecord = ref(10)
const totalRecord = ref(0)
const getShopRecord = () => {
    request.post('/api/v1/batch-update-other/get-shop-record', {
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
    if (recordTimer) {
        return
    }
    recordTimer = setInterval(() => {
        if (!document.hidden) {
            getShopRecord()
        }
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
.content-tip {
    margin-bottom: 10px;
}

.content-list {
    margin-bottom: 15px;
}

.content-row {
    display: flex;
    align-items: center;
    min-height: 42px;
    padding: 4px 10px;
}

.content-row:nth-child(even) {
    background-color: #fafafa;
}

.content-check {
    width: 210px;
    flex-shrink: 0;
    margin-right: 0;
}

.content-check-wrap {
    display: flex;
    align-items: center;
    gap: 5px;
    width: 210px;
    flex-shrink: 0;
}

.content-check-wrap .content-check {
    width: auto;
}

.content-control {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.row-label {
    color: #606266;
    font-size: 14px;
    white-space: nowrap;
}

.tip-icon {
    color: #909399;
    cursor: help;
}

.gray-tip {
    color: #909399;
    font-size: 12px;
}

.form-group {
    margin-bottom: 15px;
    padding: 10px 0;
    border-bottom: 1px dashed #ebeef5;
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

.change-line {
    line-height: 1.8;
}

.change-name {
    color: #606266;
}

.change-arrow {
    margin: 0 5px;
    color: #909399;
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

.h {
    font-weight: 500;
    color: #FF9900;
}

.text-gray {
    color: #909399;
}
</style>
