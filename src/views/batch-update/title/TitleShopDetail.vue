<template>
    <el-dialog v-model="dialogVisible" title="修改记录" width="1150" draggable @opened="handleOpened">
        <el-tabs type="border-card" v-model="activeName" @tab-change="handleTabChange">
            <el-tab-pane label="成功" name="success">
                <div class="mt-5 flex">
                    <div class="flex recover-switch">
                        <span class="switch-label">排除之前恢复成功的</span>
                        <el-switch v-model="form.exceptRecovered" size="small" />
                    </div>
                    <div>
                        <el-button type="success" size="small" @click="recoverSelected">恢复选中</el-button>
                        <el-button type="primary" size="small" @click="recoverAll">全部恢复</el-button>
                    </div>
                </div>
                <el-table :data="tableDataSuccess" row-key="id" size="small" ref="tableRefSuccess">
                    <el-table-column type="selection" width="55" :reserve-selection="true" />
                    <el-table-column type="index" width="55" label="序号" />
                    <el-table-column label="商品信息" width="350">
                        <template #default="scope">
                            <div class="flex-center">
                                <div>
                                    <a :href="getItemWirelessUrl(scope.row.numIid)" target="_blank">
                                        <el-image :src="scope.row.picUrl + '_60x60.jpg'" style="width:60px">
                                            <template #error>&nbsp;</template>
                                        </el-image>
                                    </a>
                                </div>
                                <div class="ml-5">
                                    <el-row>{{ scope.row.title }}</el-row>
                                    <el-row>
                                        <span>ID:{{ scope.row.numIid }}</span>
                                        <span v-if="scope.row.recoverNum > 0" class="ml-5 h">已恢复成功{{ scope.row.recoverNum }}次</span>
                                    </el-row>
                                </div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column property="title" label="原标题" min-width="150">
                        <template #default="scope">
                            <div class="text-gray">{{ scope.row.title }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column property="newTitle" label="修改后标题" min-width="150">
                        <template #default="scope">
                            <div class="h">
                                <el-row>{{ scope.row.newTitle }}</el-row>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="最近一次恢复信息" min-width="80">
                        <template #default="scope">
                            <div v-if="scope.row.msg" class="msg-cell">
                                <el-tooltip :content="scope.row.msg" placement="top" :show-after="300">
                                    <span class="msg-text">{{ scope.row.msg }}</span>
                                </el-tooltip>
                                <el-tooltip content="复制" placement="top" :show-after="200">
                                    <el-icon class="copy-icon" @click="copyText(scope.row.msg)">
                                        <DocumentCopy />
                                    </el-icon>
                                </el-tooltip>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
                <el-pagination @current-change="handleCurrentChangeSuccess" @size-change="handleSizeChangeSuccess"
                    :current-page="currentPageSuccess" v-model:page-size="pageSizeSuccess" :page-sizes="[10, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper" :total="totalSuccess" size="small">
                </el-pagination>
            </el-tab-pane>
            <el-tab-pane label="出错" name="fail">
                <div class="mb-15">
                    <el-button type="success" size="small" @click="retrySelected">重试选中</el-button>
                    <el-button type="primary" size="small" @click="retryAll">全部重试</el-button>
                </div>
                <el-table :data="tableDataFail" row-key="id" size="small" ref="tableRefFail">
                    <el-table-column type="selection" width="55" :reserve-selection="true" />
                    <el-table-column type="index" width="55" label="序号" />
                    <el-table-column label="商品信息" width="350">
                        <template #default="scope">
                            <div class="flex-center">
                                <div>
                                    <a :href="getItemWirelessUrl(scope.row.numIid)" target="_blank">
                                        <el-image :src="scope.row.picUrl + '_60x60.jpg'" style="width:60px">
                                            <template #error>&nbsp;</template>
                                        </el-image>
                                    </a>
                                </div>
                                <div class="ml-5">
                                    <el-row>{{ scope.row.title }}</el-row>
                                    <el-row>ID:{{ scope.row.numIid }}</el-row>
                                </div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column property="title" label="原标题">
                        <template #default="scope">
                            <div class="text-gray">{{ scope.row.title }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column property="newTitle" label="修改后标题">
                        <template #default="scope">
                            <div class="h">
                                <el-row>{{ scope.row.newTitle }}</el-row>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="出错原因" min-width="150">
                        <template #default="scope">
                            <div class="msg-cell">
                                <el-tooltip :content="scope.row.msg" placement="top" :show-after="300">
                                    <span class="msg-text">{{ scope.row.msg }}</span>
                                </el-tooltip>
                                <el-tooltip content="复制" placement="top" :show-after="200">
                                    <el-icon class="copy-icon" @click="copyText(scope.row.msg)">
                                        <DocumentCopy />
                                    </el-icon>
                                </el-tooltip>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
                <el-pagination @current-change="handleCurrentChangeFail" @size-change="handleSizeChangeFail"
                    :current-page="currentPageFail" v-model:page-size="pageSizeFail" :page-sizes="[10, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper" :total="totalFail" size="small">
                </el-pagination>
            </el-tab-pane>
            <el-tab-pane label="跳过" name="skip">
                <el-table :data="tableDataSkip" row-key="id" size="small">
                    <el-table-column type="index" width="55" label="序号" />
                    <el-table-column label="商品信息" width="350">
                        <template #default="scope">
                            <div class="flex-center">
                                <div>
                                    <a :href="getItemWirelessUrl(scope.row.numIid)" target="_blank">
                                        <el-image :src="scope.row.picUrl + '_60x60.jpg'" style="width:60px">
                                            <template #error>&nbsp;</template>
                                        </el-image>
                                    </a>
                                </div>
                                <div class="ml-5">
                                    <el-row>{{ scope.row.title }}</el-row>
                                    <el-row>ID:{{ scope.row.numIid }}</el-row>
                                </div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column property="title" label="原标题">
                        <template #default="scope">
                            <div class="text-gray">{{ scope.row.title }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column property="newTitle" label="修改后标题">
                        <template #default="scope">
                            <div class="h">
                                {{ scope.row.newTitle }}
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column property="msg" label="跳过原因" min-width="150" show-overflow-tooltip />
                </el-table>
                <el-pagination @current-change="handleCurrentChangeSkip" @size-change="handleSizeChangeSkip"
                    :current-page="currentPageSkip" v-model:page-size="pageSizeSkip" :page-sizes="[10, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper" :total="totalSkip" size="small">
                </el-pagination>
            </el-tab-pane>
        </el-tabs>
    </el-dialog>

</template>

<script setup>
import { reactive, ref, useTemplateRef } from 'vue'
import request from '@/utils/request'
import { getItemWirelessUrl, copyText } from '@/utils/index'
import { DocumentCopy } from '@element-plus/icons-vue'

const activeName = ref('success')
const dialogVisible = ref(false)
defineExpose({
    dialogVisible
})

const props = defineProps({
    recordId: Number
})

// 成功列表
const tableDataSuccess = ref([])
const currentPageSuccess = ref(1)
const pageSizeSuccess = ref(10)
const totalSuccess = ref(0)
const tableRefSuccess = useTemplateRef('tableRefSuccess')

const getShopRecordDetailsSuccess = () => {
    request.post('/api/v1/batch-update-title/get-shop-record-details', {
        recordId: props.recordId,
        status: 1,
        page: currentPageSuccess.value,
        pageSize: pageSizeSuccess.value
    }).then(response => {
        tableDataSuccess.value = response.data.data.rows
        totalSuccess.value = response.data.data.total
    }).catch(() => {
        // 错误已由 request.js 拦截器提示，避免重复弹
    })
}

const handleCurrentChangeSuccess = (val) => {
    currentPageSuccess.value = val
    getShopRecordDetailsSuccess()
}
const handleSizeChangeSuccess = () => {
    getShopRecordDetailsSuccess()
}

// 失败列表
const tableDataFail = ref([])
const currentPageFail = ref(1)
const pageSizeFail = ref(10)
const totalFail = ref(0)
const tableRefFail = useTemplateRef('tableRefFail')

const getShopRecordDetailsFail = () => {
    request.post('/api/v1/batch-update-title/get-shop-record-details', {
        recordId: props.recordId,
        status: 0,
        page: currentPageFail.value,
        pageSize: pageSizeFail.value
    }).then(response => {
        tableDataFail.value = response.data.data.rows
        totalFail.value = response.data.data.total
    }).catch(() => {
        // 错误已由 request.js 拦截器提示，避免重复弹
    })
}

const handleCurrentChangeFail = (val) => {
    currentPageFail.value = val
    getShopRecordDetailsFail()
}
const handleSizeChangeFail = () => {
    getShopRecordDetailsFail()
}

// 跳过列表
const tableDataSkip = ref([])
const currentPageSkip = ref(1)
const pageSizeSkip = ref(10)
const totalSkip = ref(0)

const getShopRecordDetailsSkip = () => {
    request.post('/api/v1/batch-update-title/get-shop-record-details', {
        recordId: props.recordId,
        status: -1,
        page: currentPageSkip.value,
        pageSize: pageSizeSkip.value
    }).then(response => {
        tableDataSkip.value = response.data.data.rows
        totalSkip.value = response.data.data.total
    }).catch(() => {
        // 错误已由 request.js 拦截器提示，避免重复弹
    })
}

const handleCurrentChangeSkip = (val) => {
    currentPageSkip.value = val
    getShopRecordDetailsSkip()
}
const handleSizeChangeSkip = () => {
    getShopRecordDetailsSkip()
}

const handleTabChange = (name) => {
    if (name === 'success') {
        getShopRecordDetailsSuccess()
    } else if (name === 'fail') {
        getShopRecordDetailsFail()
    } else if (name === 'skip') {
        getShopRecordDetailsSkip()
    }
}

const handleOpened = () => {
    // 每次打开都重置状态并重新加载，避免残留上一条记录的数据
    activeName.value = 'success'
    currentPageSuccess.value = 1
    currentPageFail.value = 1
    currentPageSkip.value = 1
    tableDataSuccess.value = []
    tableDataFail.value = []
    tableDataSkip.value = []
    tableRefSuccess.value?.clearSelection()
    tableRefFail.value?.clearSelection()
    getShopRecordDetailsSuccess()
}

// 恢复/重试：走异步任务模式（create-task），提交后由父组件弹进度框并轮询
const emit = defineEmits(['task-created'])

const form = reactive({
    exceptRecovered: false
})

const submitActionTask = (action, rows) => {
    const reqData = {
        action,
        recordId: props.recordId
    }
    if (rows) {
        reqData.detailIds = rows.map(r => r.id)
    }
    if (action === 'recover') {
        reqData.exceptRecovered = form.exceptRecovered
    }
    request.post('/api/v1/batch-update-title/create-task', reqData).then(response => {
        if (response.data.code === 0) {
            dialogVisible.value = false
            emit('task-created', response.data.data.taskId)
        } else {
            ElMessage.error(response.data.msg || '任务创建失败')
        }
    }).catch(() => {
        // 错误提示由 request.js 拦截器统一弹出（后端 msg），此处不重复提示
    })
}

// 恢复选中
const recoverSelected = () => {
    const rows = tableRefSuccess.value.getSelectionRows()
    if (!rows.length) {
        ElMessage.error('选中商品不能为空')
        return
    }
    ElMessageBox.confirm(
        '确定恢复' + rows.length + '个商品？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        }
    ).then(() => {
        submitActionTask('recover', rows)
    }).catch(() => { })
}

// 全部恢复
const recoverAll = () => {
    ElMessageBox.confirm(
        '确定全部恢复？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        }
    ).then(() => {
        submitActionTask('recover', null)
    }).catch(() => { })
}

// 重试相关
// 重试选中
const retrySelected = () => {
    const rows = tableRefFail.value.getSelectionRows()
    if (!rows.length) {
        ElMessage.error('选中商品不能为空')
        return
    }
    ElMessageBox.confirm(
        '确定重试' + rows.length + '个商品？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        }
    ).then(() => {
        submitActionTask('retry', rows)
    }).catch(() => { })
}

// 全部重试
const retryAll = () => {
    ElMessageBox.confirm(
        '确定全部重试？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        }
    ).then(() => {
        submitActionTask('retry', null)
    }).catch(() => { })
}
</script>

<style scoped>
.flex-center {
    display: flex;
    align-items: center;
}

.el-pagination {
    margin-top: 15px;
}

.mt-5 {
    margin-top: 5px;
}
.mb-15 {
    margin-bottom: 15px;
}
.ml-5 {
    margin-left: 5px;
}
.h {
    font-weight: 500;
}
.text-gray {
    color: #909399;
}
.flex {
    display: flex;
    align-items: center;
    gap: 15px;
}
.recover-switch {
    gap: 8px;
    flex-shrink: 0;
}
.switch-label {
    white-space: nowrap;
    font-size: 12px;
    color: #606266;
    line-height: 24px;
}

.msg-cell {
    display: flex;
    align-items: center;
    min-width: 0;
}

.msg-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.copy-icon {
    flex-shrink: 0;
    margin-left: 4px;
    color: #909399;
    cursor: pointer;
}

.copy-icon:hover {
    color: #409eff;
}
</style>
