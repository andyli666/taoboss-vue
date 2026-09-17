<template>
    <el-dialog v-model="dialogVisible" title="修改记录" width="1150" draggable @opened="handleOpened">
        <el-tabs type="border-card" v-model="activeName" @tab-change="handleTabChange">
            <el-tab-pane label="成功" name="success">
                <div class="mt-5 flex">
                    <div>
                        <el-form :inline="true" :model="form" label-width="auto" style="max-width:180px" size="small">
                            <el-form-item label="排除之前恢复成功的">
                                <el-switch v-model="form.exceptRecovered" />
                            </el-form-item>
                        </el-form>
                    </div>
                    <div>
                        <el-button type="success" size="small" @click="recoverSelected">恢复选中</el-button>
                        <el-button type="primary" size="small" @click="recoverAll">全部恢复</el-button>
                    </div>
                </div>
                <el-table :data="tableDataSuccess" row-key="id" size="small" ref="tableRefSuccess">
                    <el-table-column type="selection" width="55" :reserve-selection="true" />
                    <el-table-column property="pic_url" label="原标题">
                        <template #default="scope">
                            <div class="flex-center">
                                <div>
                                    <a :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank">
                                        <el-image :src="scope.row.pic_url + '_60x60.jpg'" style="width:60px">
                                            <template #error>&nbsp;</template>
                                        </el-image>
                                    </a>
                                </div>
                                <div class="ml-5">
                                    <el-row>{{ scope.row.title }}</el-row>
                                    <el-row>
                                        <span>ID:{{ scope.row.num_iid }}</span>
                                        <span v-if="scope.row.recover_num > 0" class="ml-5 h">已恢复{{
                                            scope.row.recover_num }}次</span>
                                    </el-row>
                                </div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column property="new_title" label="修改后">
                        <template #default="scope">
                            <div class="h">
                                <el-row>{{ scope.row.new_title }}</el-row>
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
                    <el-table-column property="pic_url" label="原标题">
                        <template #default="scope">
                            <div class="flex-center">
                                <div>
                                    <a :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank">
                                        <el-image :src="scope.row.pic_url + '_60x60.jpg'" style="width:60px">
                                            <template #error>&nbsp;</template>
                                        </el-image>
                                    </a>
                                </div>
                                <div class="ml-5">
                                    <el-row>{{ scope.row.title }}</el-row>
                                    <el-row>ID:{{ scope.row.num_iid }}</el-row>
                                </div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column property="new_title" label="修改后">
                        <template #default="scope">
                            <div class="h">
                                <el-row>{{ scope.row.new_title }}</el-row>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column property="msg" label="出错原因" width="150" show-overflow-tooltip />
                </el-table>
                <el-pagination @current-change="handleCurrentChangeFail" @size-change="handleSizeChangeFail"
                    :current-page="currentPageFail" v-model:page-size="pageSizeFail" :page-sizes="[10, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper" :total="totalFail" size="small">
                </el-pagination>
            </el-tab-pane>
            <el-tab-pane label="跳过" name="skip">
                <el-table :data="tableDataSkip" row-key="id" size="small">
                    <el-table-column property="pic_url" label="原标题">
                        <template #default="scope">
                            <div class="flex-center">
                                <div>
                                    <a :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank">
                                        <el-image :src="scope.row.pic_url + '_60x60.jpg'" style="width:60px">
                                            <template #error>&nbsp;</template>
                                        </el-image>
                                    </a>
                                </div>
                                <div class="ml-5">
                                    <el-row>{{ scope.row.title }}</el-row>
                                    <el-row>ID:{{ scope.row.num_iid }}</el-row>
                                </div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column property="new_title" label="修改后">
                        <template #default="scope">
                            <div class="h">
                                {{ scope.row.new_title }}
                            </div>
                            <div v-if="scope.row.new_title == scope.row.title" class="red">
                                标题没有变化
                            </div>
                            <div v-if="getLength(scope.row.new_title) > 60" class="red">
                                标题不能超过30个汉字或60个字符，已超{{ getLength(scope.row.new_title) - 60 }}个字符
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
                <el-pagination @current-change="handleCurrentChangeSkip" @size-change="handleSizeChangeSkip"
                    :current-page="currentPageSkip" v-model:page-size="pageSizeSkip" :page-sizes="[10, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper" :total="totalSkip" size="small">
                </el-pagination>
            </el-tab-pane>
        </el-tabs>
    </el-dialog>
    <el-dialog v-model="dialogProgressVisibleRecoverSelected" title="恢复进度" width="800" :close-on-click-modal="false">
        <el-progress :text-inside="true" :stroke-width="26" :percentage="percentageRecoverSelected" />
        <div class="percent-tip">
            <div>{{ saveCompleteMsgRecoverSelected }}</div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="dialogProgressVisibleRecoverSelected = false">确定</el-button>
            </div>
        </template>
    </el-dialog>
    <el-dialog v-model="dialogProgressVisibleRecoverAll" title="恢复进度" width="800" :close-on-click-modal="false">
        <el-progress :text-inside="true" :stroke-width="26" :percentage="percentageRecoverAll" />
        <div class="percent-tip">
            <div>{{ saveCompleteMsgRecoverAll }}</div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="dialogProgressVisibleRecoverAll = false">确定</el-button>
            </div>
        </template>
    </el-dialog>
    <el-dialog v-model="dialogProgressVisibleRetrySelected" title="重试进度" width="800" :close-on-click-modal="false">
        <el-progress :text-inside="true" :stroke-width="26" :percentage="percentageRetrySelected" />
        <div class="percent-tip">
            <div>{{ saveCompleteMsgRetrySelected }}</div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="dialogProgressVisibleRetrySelected = false">确定</el-button>
            </div>
        </template>
    </el-dialog>
    <el-dialog v-model="dialogProgressVisibleRetryAll" title="重试进度" width="800" :close-on-click-modal="false">
        <el-progress :text-inside="true" :stroke-width="26" :percentage="percentageRetryAll" />
        <div class="percent-tip">
            <div>{{ saveCompleteMsgRetryAll }}</div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="dialogProgressVisibleRetryAll = false">确定</el-button>
            </div>
        </template>
    </el-dialog>
</template>
<script setup>
import { reactive, ref, useTemplateRef } from 'vue'
import request from '@/utils/request'
import { getItemWirelessUrl, getLength } from '@/utils/index'
import { fetchEventSource } from '@microsoft/fetch-event-source'

const activeName = ref('success')
const dialogVisible = ref(false)
defineExpose({
    dialogVisible
})
const props = defineProps({
    recordId: Number
})

const tableDataSuccess = ref([])
const currentPageSuccess = ref(1)
const pageSizeSuccess = ref(10)
const totalSuccess = ref(0)
const getShopRecordDetailsSuccess = () => {
    request.post('/api/batch-update-title/get-shop-record-details', {
        recordId: props.recordId,
        status: 1,
        page: currentPageSuccess.value,
        pageSize: pageSizeSuccess.value
    }).then(response => {
        tableDataSuccess.value = response.data.data.rows
        totalSuccess.value = response.data.data.total
    }).catch((error) => {
        ElMessage.error(error)
    })
}
const handleCurrentChangeSuccess = (val) => {
    currentPageSuccess.value = val
    getShopRecordDetailsSuccess()
}
const handleSizeChangeSuccess = (val) => {
    getShopRecordDetailsSuccess()
}
const handleOpened = () => {
    getShopRecordDetailsSuccess()
}

const tableDataFail = ref([])
const currentPageFail = ref(1)
const pageSizeFail = ref(10)
const totalFail = ref(0)
const getShopRecordDetailsFail = () => {
    request.post('/api/batch-update-title/get-shop-record-details', {
        recordId: props.recordId,
        status: 0,
        page: currentPageFail.value,
        pageSize: pageSizeFail.value
    }).then(response => {
        tableDataFail.value = response.data.data.rows
        totalFail.value = response.data.data.total
    }).catch((error) => {
        ElMessage.error(error)
    })
}
const handleCurrentChangeFail = (val) => {
    currentPageFail.value = val
    getShopRecordDetailsFail()
}
const handleSizeChangeFail = (val) => {
    getShopRecordDetailsFail()
}

const tableDataSkip = ref([])
const currentPageSkip = ref(1)
const pageSizeSkip = ref(10)
const totalSkip = ref(0)
const getShopRecordDetailsSkip = () => {
    request.post('/api/batch-update-title/get-shop-record-details', {
        recordId: props.recordId,
        status: -1,
        page: currentPageSkip.value,
        pageSize: pageSizeSkip.value
    }).then(response => {
        tableDataSkip.value = response.data.data.rows
        totalSkip.value = response.data.data.total
    }).catch((error) => {
        ElMessage.error(error)
    })
}
const handleCurrentChangeSkip = (val) => {
    currentPageSkip.value = val
    getShopRecordDetailsSkip()
}
const handleSizeChangeSkip = (val) => {
    getShopRecordDetailsSkip()
}

const handleTabChange = (name) => {
    if (name == 'success') {
        getShopRecordDetailsSuccess()
    } else if (name == 'fail') {
        getShopRecordDetailsFail()
    } else if (name == 'skip') {
        getShopRecordDetailsSkip()
    }
}

const form = reactive({
    exceptRecovered: false
})
// 恢复选中
const recoverSelected = () => {
    const rows = tableRefSuccess.value.getSelectionRows()
    if (!rows.length) {
        ElMessage.error('选中商品不能为空')
        return
    }
    ElMessageBox.confirm(
        '确定恢复个' + rows.length + '商品？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        }
    ).then(() => {
        doRecoverSelected(rows)
    }).catch(() => { })
}
const tableRefSuccess = useTemplateRef('tableRefSuccess')
const dialogProgressVisibleRecoverSelected = ref(false)
const percentageRecoverSelected = ref(0)
const saveCompleteMsgRecoverSelected = ref('')
const doRecoverSelected = (rows) => {
    dialogProgressVisibleRecoverSelected.value = true
    percentageRecoverSelected.value = 0
    saveCompleteMsgRecoverSelected.value = ''
    try {
        const ctrl = new AbortController() // 用于中断请求
        fetchEventSource('/api/batch-update-title/recover-shop-record-details', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // 设置token
            },
            method: 'POST',
            body: JSON.stringify({
                rows,
                exceptRecovered: form.exceptRecovered
            }),
            signal: ctrl.signal,
            openWhenHidden: true, // 页面退至后台时保持连接
            onopen: (response) => {
                console.log('连接已打开', response)
            },
            onmessage: (event) => {
                console.log('收到消息:', event.data)
                const data = JSON.parse(event.data)
                if (data.status == 'progress') {
                    percentageRecoverSelected.value = data.progress
                } else if (data.status == 'complete') {
                    saveCompleteMsgRecoverSelected.value = data.message
                    ctrl.abort() // 中断请求
                    percentageRecoverSelected.value = 100
                    getShopRecordDetailsSuccess()
                } else if (data.status == 'error') {
                    ElMessage.error(data.message)
                    ctrl.abort() // 中断请求
                }
            },
            onerror: (error) => {
                console.error('连接发生错误:', error)
                ElMessage.error(error.message)
                ctrl.abort() // 中断请求
            },
            onclose: () => {
                console.log('连接已关闭')
            },
        })
    } catch (err) {
        ElMessage.error(err.message)
        throw new Error('终止连接')
    }
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
        doRecoverAll()
    }).catch(() => { })
}
const dialogProgressVisibleRecoverAll = ref(false)
const percentageRecoverAll = ref(0)
const saveCompleteMsgRecoverAll = ref('')
const doRecoverAll = () => {
    dialogProgressVisibleRecoverAll.value = true
    percentageRecoverAll.value = 0
    saveCompleteMsgRecoverAll.value = ''
    try {
        const ctrl = new AbortController() // 用于中断请求
        fetchEventSource('/api/batch-update-title/recover-shop-record', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // 设置token
            },
            method: 'POST',
            body: JSON.stringify({
                recordId: props.recordId,
                exceptRecovered: form.exceptRecovered
            }),
            signal: ctrl.signal,
            openWhenHidden: true, // 页面退至后台时保持连接
            onopen: (response) => {
                console.log('连接已打开', response)
            },
            onmessage: (event) => {
                console.log('收到消息:', event.data)
                const data = JSON.parse(event.data)
                if (data.status == 'progress') {
                    percentageRecoverAll.value = data.progress
                } else if (data.status == 'complete') {
                    saveCompleteMsgRecoverAll.value = data.message
                    ctrl.abort() // 中断请求
                    percentageRecoverAll.value = 100
                    getShopRecordDetailsSuccess()
                } else if (data.status == 'error') {
                    ElMessage.error(data.message)
                    ctrl.abort() // 中断请求
                }
            },
            onerror: (error) => {
                console.error('连接发生错误:', error)
                ElMessage.error(error.message)
                ctrl.abort() // 中断请求
            },
            onclose: () => {
                console.log('连接已关闭')
            },
        })
    } catch (err) {
        ElMessage.error(err.message)
        throw new Error('终止连接')
    }
}

// 重试选中
const retrySelected = () => {
    const rows = tableRefFail.value.getSelectionRows()
    if (!rows.length) {
        ElMessage.error('选中商品不能为空')
        return
    }
    ElMessageBox.confirm(
        '确定重试个' + rows.length + '商品？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        }
    ).then(() => {
        doRetrySelected(rows)
    }).catch(() => { })
}
const tableRefFail = useTemplateRef('tableRefFail')
const dialogProgressVisibleRetrySelected = ref(false)
const percentageRetrySelected = ref(0)
const saveCompleteMsgRetrySelected = ref('')
const doRetrySelected = (rows) => {
    dialogProgressVisibleRetrySelected.value = true
    percentageRetrySelected.value = 0
    saveCompleteMsgRetrySelected.value = ''
    try {
        const ctrl = new AbortController() // 用于中断请求
        fetchEventSource('/api/batch-update-title/retry-shop-record-details', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // 设置token
            },
            method: 'POST',
            body: JSON.stringify({
                rows
            }),
            signal: ctrl.signal,
            openWhenHidden: true, // 页面退至后台时保持连接
            onopen: (response) => {
                console.log('连接已打开', response)
            },
            onmessage: (event) => {
                console.log('收到消息:', event.data)
                const data = JSON.parse(event.data)
                if (data.status == 'progress') {
                    percentageRetrySelected.value = data.progress
                } else if (data.status == 'complete') {
                    saveCompleteMsgRetrySelected.value = data.message
                    ctrl.abort() // 中断请求
                    percentageRetrySelected.value = 100
                    getShopRecordDetailsFail()
                } else if (data.status == 'error') {
                    ElMessage.error(data.message)
                    ctrl.abort() // 中断请求
                }
            },
            onerror: (error) => {
                console.error('连接发生错误:', error)
                ElMessage.error(error.message)
                ctrl.abort() // 中断请求
            },
            onclose: () => {
                console.log('连接已关闭')
            },
        })
    } catch (err) {
        ElMessage.error(err.message)
        throw new Error('终止连接')
    }
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
        doRetryAll()
    }).catch(() => { })
}
const dialogProgressVisibleRetryAll = ref(false)
const percentageRetryAll = ref(0)
const saveCompleteMsgRetryAll = ref('')
const doRetryAll = () => {
    dialogProgressVisibleRetryAll.value = true
    percentageRetryAll.value = 0
    saveCompleteMsgRetryAll.value = ''
    try {
        const ctrl = new AbortController() // 用于中断请求
        fetchEventSource('/api/batch-update-title/retry-shop-record', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // 设置token
            },
            method: 'POST',
            body: JSON.stringify({
                recordId: props.recordId
            }),
            signal: ctrl.signal,
            openWhenHidden: true, // 页面退至后台时保持连接
            onopen: (response) => {
                console.log('连接已打开', response)
            },
            onmessage: (event) => {
                console.log('收到消息:', event.data)
                const data = JSON.parse(event.data)
                if (data.status == 'progress') {
                    percentageRetryAll.value = data.progress
                } else if (data.status == 'complete') {
                    saveCompleteMsgRetryAll.value = data.message
                    ctrl.abort() // 中断请求
                    percentageRetryAll.value = 100
                    getShopRecordDetailsFail()
                } else if (data.status == 'error') {
                    ElMessage.error(data.message)
                    ctrl.abort() // 中断请求
                }
            },
            onerror: (error) => {
                console.error('连接发生错误:', error)
                ElMessage.error(error.message)
                ctrl.abort() // 中断请求
            },
            onclose: () => {
                console.log('连接已关闭')
            },
        })
    } catch (err) {
        ElMessage.error(err.message)
        throw new Error('终止连接')
    }
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

.dialog-footer {
    padding-right: 15px;
}
</style>