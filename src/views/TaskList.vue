<template>
    <el-form :inline="true" :model="form" @submit.prevent>
        <el-form-item label="任务名称">
            <el-input v-model="form.task_name" clearable @keyup.enter="getTasks" />
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="getTasks" native-type="submit">查询</el-button>
        </el-form-item>
    </el-form>
    <el-table :data="tableData" row-key="id">
        <el-table-column type="index" width="55" label="序号" />
        <el-table-column property="task_name" label="名称" width="500" />
        <el-table-column property="task_time" label="任务执行时间" width="200" />
        <el-table-column property="repeat" label="是否重复" width="100">
            <template #default="scope">
                <div v-if="scope.row.repeat == 0">否</div>
                <div v-else-if="scope.row.repeat == 1">每天</div>
                <div v-else-if="scope.row.repeat == 2">每周</div>
                <div v-else-if="scope.row.repeat == 3">工作日</div>
                <div v-else-if="scope.row.repeat == 4">周末</div>
            </template>
        </el-table-column>
        <el-table-column property="remark" label="备注" width="300" show-overflow-tooltip />
        <el-table-column label="操作" width="150">
            <template #default="scope">
                <el-button size="small" type="primary" link>查看任务执行明细</el-button>
            </template>
        </el-table-column>
    </el-table>
    <el-pagination @current-change="handleCurrentChange" :current-page="currentPage" :page-size="pageSize"
        layout="prev, pager, next" :total="total">
    </el-pagination>
</template>
<script setup>
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)// 每页显示的数据条数
const total = ref(0)// 总数据条数

const form = reactive({
    task_name: ''
})

const getTasks = () => {
    axios.post('/api/ItemTimingUpdateQuantity/getTasks', {
        task_name: form.task_name,
        page: currentPage.value,
        page_size: pageSize.value
    }).then(response => {
        tableData.value = response.data.rows
        total.value = response.data.total
    }).catch(function (error) {
        console.log(error)
    })
}
const handleCurrentChange = (val) => {
    currentPage.value = val
    getTasks()
}

onMounted(() => {
    getTasks()
})
</script>