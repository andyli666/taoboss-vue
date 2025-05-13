<template>
    <el-form :inline="true" :model="form" @submit.prevent>
        <el-form-item label="任务名称">
            <el-select v-model="task_id" filterable remote reserve-keyword placeholder="Please enter a keyword"
                remote-show-suffix :remote-method="getTasks" :loading="loading" clearable style="width:300px">
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="getDetail">查询</el-button>
        </el-form-item>
    </el-form>
    <el-table :data="tableData">
        <el-table-column type="index" width="55" label="序号" />
        <el-table-column property="num_iid" label="商品ID" width="150" />
        <el-table-column property="pic_url" label="主图" width="100">
            <template #default="scope">
                <el-image :src="scope.row.pic_url" style="width:50px;">
                    <template #error>&nbsp;</template>
                </el-image>
            </template>
        </el-table-column>
        <el-table-column property="title" label="标题" />
        <el-table-column property="properties_name" label="sku" width="100" />
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
</template>
<script setup>
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)// 每页显示的数据条数
const total = ref(0)// 总数据条数

const form = reactive({
    task_id: ''
})
const options = ref([])

const getTasks = (query) => {
    if (query) {
        loading.value = true
        axios.post('/api/ItemTimingUpdateQuantity/getTasks', {
            task_name: query,
            page: 1,
            page_size: 100
        }).then(response => {
            options.value = response.data.rows.map((item) => {
                return { value: item.id, label: item.task_name }
            })
        }).catch(function (error) {
            console.log(error)
        })
    } else {
        options.value = []
    }
}
const handleCurrentChange = (val) => {
    currentPage.value = val
    getDetail()
}

onMounted(() => {
    getDetail()
})
</script>