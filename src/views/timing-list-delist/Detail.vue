<template>
    <el-dialog v-model="dialogVisible" title="任务执行明细" width="1000">
        <el-form :inline="true" :model="form" @submit.prevent size="small" style="max-width:1000px">
            <el-form-item label="商品">
                <el-input v-model="form.title" clearable @keyup.enter="getDetail" placeholder="商品ID或标题"
                    style="width: 200px" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="getDetail">查询</el-button>
            </el-form-item>
        </el-form>
        <el-table :data="tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)" size="small">
            <!-- <el-table-column type="index" width="55" label="序号" /> -->
            <el-table-column property="pic_url" label="商品" width="350">
                <template #default="scope">
                    <el-row>
                        <el-col :span="4">
                            <a :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank">
                                <el-image :src="scope.row.pic_url" style="width:50px">
                                    <template #error>&nbsp;</template>
                                </el-image>
                            </a>
                        </el-col>
                        <el-col :span="20">
                            [{{ scope.row.num_iid }}]
                            {{ scope.row.title }}
                        </el-col>
                    </el-row>
                </template>
            </el-table-column>
            <el-table-column property="action" label="执行操作" width="80">
                <template #default="scope">
                    <div v-if="scope.row.action == 1">下架</div>
                    <div v-else-if="scope.row.action == 0">上架</div>
                </template>
            </el-table-column>
            <el-table-column property="datetime" label="执行时间" width="150" />
            <el-table-column property="status" label="执行结果" width="80">
                <template #default="scope">
                    <div v-if="scope.row.status == 1"><el-text type="success" size="small">成功</el-text></div>
                    <div v-else-if="scope.row.status == 2">出错</div>
                </template>
            </el-table-column>
            <el-table-column property="msg" label="出错信息" show-overflow-tooltip />
        </el-table>
        <el-pagination @current-change="handleCurrentChange" :current-page="currentPage" :page-size="pageSize"
            layout="prev, pager, next" :total="tableData.length">
        </el-pagination>
    </el-dialog>
</template>
<script setup>
import { ref, watch, reactive } from 'vue'
import request from '@/utils/request'
import { getItemWirelessUrl } from '@/utils/index'

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)// 每页显示的数据条数

const dialogVisible = ref(false)
defineExpose({
    dialogVisible
})

const { taskId } = defineProps(['taskId'])

const form = reactive({
    title: ''
})

const getDetail = () => {
    if (taskId) {
        request.post('/api/timing-list-delist/get-details', {
            id: taskId,
            title: form.title
        }).then(response => {
            if (response.data.status == 1) {
                tableData.value = response.data.rows
            } else {
                ElMessage.error(response.data.info)
            }
        }).catch((error) => {
            ElMessage.error(error)
        })
    }
}
const handleCurrentChange = (val) => {
    currentPage.value = val
}

watch(() => taskId, () => {
    // console.log('newTaskId' + taskId)
    getDetail()
})
</script>
<style scoped>
.el-pagination {
    margin-top: 16px;
}
</style>