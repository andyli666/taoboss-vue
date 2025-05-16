<template>
    <el-dialog v-model="dialogVisible" title="任务执行明细" width="850" :close-on-click-modal="false">
        <el-table :data="tableData">
            <el-table-column type="index" width="55" label="序号" />
            <el-table-column property="num_iid" label="商品ID" width="150" />
            <el-table-column property="pic_url" label="主图" width="100">
                <template #default="scope">
                    <el-image :src="scope.row.pic_url" style="width:50px">
                        <template #error>&nbsp;</template>
                    </el-image>
                </template>
            </el-table-column>
            <el-table-column property="title" label="标题" />
            <el-table-column property="properties_name" label="sku" width="150" />
            <el-table-column property="quantity" label="执行库存" width="100" />
            <el-table-column property="datetime" label="执行时间" width="200" />
            <el-table-column property="status" label="执行结果" width="50">
                <template #default="scope">
                    <div v-if="scope.row.repeat == 1">成功</div>
                    <div v-else-if="scope.row.repeat == 2">出错</div>
                </template>
            </el-table-column>
            <el-table-column property="msg" label="出错信息" width="300" show-overflow-tooltip />
        </el-table>
        <el-pagination @current-change="handleCurrentChange" :current-page="currentPage" :page-size="pageSize"
            layout="prev, pager, next" :total="total">
        </el-pagination>
    </el-dialog>
</template>
<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)// 每页显示的数据条数
const total = ref(0)// 总数据条数

const dialogVisible = ref(false)
defineExpose({
    dialogVisible
})

const { taskId } = defineProps(['taskId'])

const getDetail = () => {
    if (taskId) {
        axios.post('/api/ItemTimingUpdateQuantity/getTaskDetail', {
            id: taskId,
            page: currentPage.value,
            page_size: pageSize.value,
        }).then(response => {
            tableData.value = response.data.rows
            total.value = response.data.total
        }).catch(function (error) {
            console.log(error)
        })
    }
}
const handleCurrentChange = (val) => {
    currentPage.value = val
    getDetail()
}

watch(() => taskId, () => {
    console.log('newTaskId'+taskId)
    getDetail()
})
</script>
<style scoped>
.el-pagination {
    margin-top: 16px;
}
</style>