<template>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="1050" @opened="handleOpened">
        <el-table :data="tableData" size="small">
            <el-table-column property="datetime" label="修改时间" width="150" />
            <el-table-column property="title" label="原导购标题">
                <template #default="scope">
                    <div class="h text-gray">{{ scope.row.title }}</div>
                </template>
            </el-table-column>
            <el-table-column property="newTitle" label="修改后导购标题" />
            <el-table-column label="状态" width="100">
                <template #default="scope">
                    <el-tag v-if="scope.row.status == 'success'" type="success" size="small">成功</el-tag>
                    <template v-else>
                        <el-tag type="danger" size="small">失败</el-tag>
                        <el-tooltip v-if="scope.row.msg" :content="scope.row.msg" placement="top" :show-after="200">
                            <el-icon class="ml-5 fail-icon"><WarningFilled /></el-icon>
                        </el-tooltip>
                    </template>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
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
</template>
<script setup>
import { ref } from 'vue'
import request from '@/utils/request'
import { WarningFilled } from '@element-plus/icons-vue'

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
    request.post('/api/v1/batch-update-shop-title/get-list-details', {
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
    // 每次打开都重置分页并重新加载，避免残留上次的数据
    currentPage.value = 1
    getDetails()
}

// 恢复
const emit = defineEmits(['recovered'])
const recover = (row) => {
    ElMessageBox.confirm(
        '确定恢复原导购标题？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        }
    ).then(() => {
        doRecover(row)
    }).catch(() => { })
}
const doRecover = (row) => {
    row.loading = true
    request.post('/api/v1/batch-update-shop-title/recover-list-detail', {
        id: row.id
    }).then(response => {
        row.loading = false
        if (response.data.code === 0) {
            row.recovered = true // 本地立即置为已恢复，按钮切换为已恢复
            ElMessage.success('恢复成功')
            emit('recovered', row.title)
            getDetails()
        } else {
            ElMessage.error(response.data.msg || '恢复失败')
        }
    }).catch(() => {
        // 错误已由拦截器提示，只复位状态
        row.loading = false
    })
}

// 重试（失败记录重新执行改导购标题）
const retry = (row) => {
    ElMessageBox.confirm(
        '确定重新执行修改导购标题？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(() => {
        doRetry(row)
    }).catch(() => { })
}
const doRetry = (row) => {
    row.loading = true
    request.post('/api/v1/batch-update-shop-title/retry-list-detail', {
        id: row.id
    }).then(response => {
        row.loading = false
        if (response.data.code === 0) {
            ElMessage.success('重试成功')
            getDetails()
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

.ml-5 {
    margin-left: 5px;
}

.text-gray {
    color: #909399;
}

.fail-icon {
    color: #e6a23c;
    font-size: 14px;
    vertical-align: middle;
    cursor: pointer;
}
</style>
