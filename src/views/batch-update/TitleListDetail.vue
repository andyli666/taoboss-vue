<template>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="1050" @opened="handleOpened">
        <el-table :data="tableData" size="small">
            <el-table-column property="datetime" label="修改时间" width="150" />
            <el-table-column property="title" label="原标题">
                <template #default="scope">
                    <div class="h">{{ scope.row.title }} </div>
                </template>
            </el-table-column>
            <el-table-column property="new_title" label="修改后" />
            <el-table-column label="操作" width="115">
                <template #default="scope">
                    <el-button type="primary" size="small" plain @click="recover(scope.row)"
                        :loading="scope.row.loading">
                        {{ scope.row.loading ? '恢复中' : '恢复原标题' }}
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
    request.post('/api/batch-update-title/get-list-details', {
        numIid: props.numIid,
        page: currentPage.value,
        pageSize: pageSize.value
    }).then(response => {
        tableData.value = response.data.data.rows
        total.value = response.data.data.total
    }).catch((error) => {
        ElMessage.error(error)
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

// 恢复原标题
const emit = defineEmits(['recovered'])
const recover = (row) => {
    ElMessageBox.confirm(
        '确定恢复原标题？',
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
    request.post('/api/batch-update-title/recover-list-detail', {
        id: row.id
    }).then(response => {
        row.loading = false
        if (response.data.status) {
            ElMessage.success('恢复成功')
            emit('recovered', row.title)
        } else {
            ElMessage.error(response.data.msg)
        }
    }).catch((error) => {
        row.loading = false
        ElMessage.error(error)
    })
}
</script>
<style scoped>
.el-pagination {
    margin-top: 15px;
}
</style>
