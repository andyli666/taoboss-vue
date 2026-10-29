<template>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="1180" @opened="handleOpened">
        <el-table :data="tableData" size="small">
            <el-table-column type="index" width="55" label="序号" />
            <el-table-column label="商品信息" width="300">
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
            <el-table-column label="SKU属性" min-width="100">
                <template #default="scope">
                    <template v-if="scope.row.changes && scope.row.changes.length">
                        <div v-for="(change, idx) in scope.row.changes" :key="idx">
                            {{ change.propName || '-' }}
                        </div>
                    </template>
                    <div v-else>{{ scope.row.skuName || '-' }}</div>
                </template>
            </el-table-column>
            <el-table-column label="原SKU名称" min-width="180">
                <template #default="scope">
                    <template v-if="scope.row.changes && scope.row.changes.length">
                        <div v-for="(change, idx) in scope.row.changes" :key="idx" class="text-gray">
                            {{ change.oldValue === '' || change.oldValue == null ? '-' : change.oldValue }}
                        </div>
                    </template>
                    <div v-else class="text-gray">{{ scope.row.originalValue || '-' }}</div>
                </template>
            </el-table-column>
            <el-table-column label="修改后SKU名称" min-width="180">
                <template #default="scope">
                    <template v-if="scope.row.changes && scope.row.changes.length">
                        <div v-for="(change, idx) in scope.row.changes" :key="idx" class="h">
                            {{ change.newValue === '' || change.newValue == null ? '-' : change.newValue }}
                        </div>
                    </template>
                    <div v-else class="h">{{ scope.row.newValue || '-' }}</div>
                </template>
            </el-table-column>
            <el-table-column label="状态" width="50">
                <template #default="scope">
                    <el-text v-if="scope.row.status == 'success'" type="success" size="small">成功</el-text>
                    <el-text v-else type="danger" size="small">失败</el-text>
                </template>
            </el-table-column>
            <el-table-column label="出错原因" min-width="100">
                <template #default="scope">
                    <div v-if="scope.row.status != 'success'" class="msg-cell">
                        <el-tooltip :content="scope.row.msg" placement="top" :show-after="300">
                            <span class="msg-text">{{ scope.row.msg }}</span>
                        </el-tooltip>
                        <el-tooltip content="复制" placement="top" :show-after="200">
                            <el-icon class="copy-icon" @click="copyText(scope.row.msg)">
                                <DocumentCopy />
                            </el-icon>
                        </el-tooltip>
                    </div>
                    <div v-else class="text-gray">-</div>
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
</template>
<script setup>
import { ref } from 'vue'
import request from '@/utils/request'
import { getItemWirelessUrl, copyText } from '@/utils/index'
import { DocumentCopy } from '@element-plus/icons-vue'

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
    numIid: [String, Number]
})

const getDetails = () => {
    request.post('/api/v1/batch-update-sku-prop-name/get-list-details', {
        numIid: props.numIid,
        status: '',
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
    currentPage.value = 1
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
        '确定恢复原SKU名称？',
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
    request.post('/api/v1/batch-update-sku-prop-name/recover-list-detail', {
        ids: [row.id]
    }).then(response => {
        row.loading = false
        if (response.data.code === 0) {
            row.recovered = true // 本地立即置为已恢复，按钮切换为已恢复
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

// 重试（失败记录重新执行改SKU名称）
const retry = (row) => {
    ElMessageBox.confirm(
        '确定重新执行修改SKU名称？',
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
    request.post('/api/v1/batch-update-sku-prop-name/retry-list-detail', {
        ids: [row.id]
    }).then(response => {
        row.loading = false
        if (response.data.code === 0) {
            row.status = 'success' // 本地立即置为成功，按钮切换为恢复
            row.msg = ''
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

.flex-center {
    display: flex;
    align-items: center;
}

.ml-5 {
    margin-left: 5px;
}

.h {
    color: #FF9900;
}

.text-gray {
    color: #909399;
}

.sku-sub {
    font-size: 12px;
    color: #999;
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
