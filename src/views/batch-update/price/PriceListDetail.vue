<template>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="1050" @opened="handleOpened">
        <el-table :data="tableData" size="small">
            <el-table-column property="datetime" label="修改时间" width="150" />
            <el-table-column property="originalText" label="原价格">
                <template #default="scope">
                    <div class="h">{{ scope.row.originalText }}</div>
                </template>
            </el-table-column>
            <el-table-column property="newText" label="修改后" />
            <el-table-column label="状态" width="100">
                <template #default="scope">
                    <el-text v-if="scope.row.status == 'success'" type="success" size="small">成功</el-text>
                    <template v-else>
                        <el-text type="danger" size="small">失败</el-text>
                        <el-tooltip v-if="scope.row.msg" :content="scope.row.msg" placement="top" :show-after="200">
                            <el-icon class="ml-5 fail-icon"><WarningFilled /></el-icon>
                        </el-tooltip>
                    </template>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="115">
                <template #default="scope">
                    <template v-if="scope.row.status == 'success'">
                        <el-button v-if="!scope.row.recovered" type="primary" size="small" plain
                            @click="recover(scope.row)" :loading="scope.row.loading">
                            {{ scope.row.loading ? '恢复中' : '恢复' }}
                        </el-button>
                        <el-text v-else type="info" size="small">已恢复</el-text>
                    </template>
                    <el-button v-else type="warning" size="small" plain
                        @click="retry(scope.row)" :loading="scope.row.loading">
                        {{ scope.row.loading ? '重试中' : '重试' }}
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange" :current-page="currentPage"
            v-model:page-size="pageSize" :page-sizes="[10, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
            :total="total" size="small"></el-pagination>
    </el-dialog>
    <W2AuthDialog />
</template>
<script setup>
import { ref } from 'vue'
import request from '@/utils/request'
import { useW2Auth } from '@/utils/w2auth'
import W2AuthDialog from './W2AuthDialog.vue'

const { ensureW2Auth } = useW2Auth()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

defineExpose({
    dialogVisible,
    dialogTitle
})

const props = defineProps({
    numIid: String
})

const getDetails = () => {
    request.post('/api/v1/batch-update-price/get-list-details', {
        numIid: props.numIid,
        page: currentPage.value,
        pageSize: pageSize.value
    }).then(response => {
        tableData.value = response.data.data.rows
        total.value = response.data.data.total
    }).catch(() => {
        // 错误已由 request.js 拦截器提示（400/网络等），此处不再重复弹
    })
}
const handleCurrentChange = (val) => {
    currentPage.value = val
    getDetails()
}
const handleSizeChange = (val) => {
    pageSize.value = val
    getDetails()
}

const handleOpened = () => {
    getDetails()
}

// 恢复
const emit = defineEmits(['recovered'])
const recover = (row) => {
    ElMessageBox.confirm(
        '确定恢复原价格？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        }
    ).then(async () => {
        // W2 授权预检：有效返回 true 继续执行；失效弹授权弹窗，通过后自动执行回调
        if (!(await ensureW2Auth(() => doRecover(row)))) return
        doRecover(row)
    }).catch(() => { })
}
const doRecover = (row) => {
    row.loading = true
    request.post('/api/v1/batch-update-price/recover-list-detail', {
        id: row.id
    }).then(response => {
        row.loading = false
        if (response.data.code === 0) {
            row.recovered = true // 本地立即置为已恢复，按钮变禁用
            ElMessage.success('恢复成功')
            emit('recovered')
        } else {
            ElMessage.error(response.data.msg || '恢复失败')
        }
    }).catch(() => {
        // 错误已由拦截器提示，只复位状态
        row.loading = false
    })
}

// 重试（失败记录重新执行改价）
const retry = (row) => {
    ElMessageBox.confirm(
        '确定重新执行改价？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(async () => {
        // W2 授权预检：有效返回 true 继续执行；失效弹授权弹窗，通过后自动执行回调
        if (!(await ensureW2Auth(() => doRetry(row)))) return
        doRetry(row)
    }).catch(() => { })
}
const doRetry = (row) => {
    row.loading = true
    request.post('/api/v1/batch-update-price/retry-list-detail', {
        id: row.id
    }).then(response => {
        row.loading = false
        if (response.data.code === 0) {
            row.status = 'success' // 本地立即置为成功，按钮切换为恢复
            ElMessage.success('重试成功')
            emit('recovered')
        } else {
            ElMessage.error(response.data.msg || '重试失败')
        }
    }).catch(() => {
        // 错误已由拦截器提示，只复位状态
        row.loading = false
    })
}
</script>
<style scoped>
.el-pagination {
    margin-top: 15px;
}

.fail-icon {
    color: #e6a23c;
    font-size: 14px;
    vertical-align: middle;
    cursor: pointer;
}
</style>
