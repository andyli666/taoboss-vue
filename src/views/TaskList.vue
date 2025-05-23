<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>定时修改库存 </el-breadcrumb-item>
        <el-breadcrumb-item>任务列表</el-breadcrumb-item>
    </el-breadcrumb>
    <el-form :inline="true" :model="form" @submit.prevent style="margin:20px 0">
        <el-form-item label="任务名称">
            <el-input v-model="form.task_name" clearable @keyup.enter="getTasks" />
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="getTasks">查询</el-button>
        </el-form-item>
    </el-form>
    <el-table :data="tableData" row-key="id">
        <el-table-column type="index" width="55" label="序号" />
        <el-table-column property="task_name" label="名称" width="300" />
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
        <el-table-column property="status" label="任务状态" width="100">
            <template #default="scope">
                <div v-if="scope.row.status == 0">待执行</div>
                <div v-else-if="scope.row.status == 1">已完成</div>
                <div v-else-if="scope.row.status == 2">系统暂停</div>
                <div v-else-if="scope.row.status == 3">人工暂停</div>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
            <template #default="scope">
                <el-button v-if="scope.row.status == 0" size="small" type="primary" link
                    @click="cancelTask(scope.row.id)">暂停执行&nbsp;&nbsp;&nbsp;</el-button>
                <el-button v-else-if="scope.row.status == 2 || scope.row.status == 3"
                    :disabled="scope.row.task_time < currentSystemTime" size="small" type="primary" link
                    @click="restartTask(scope.row.id)">
                    恢复执行
                    <el-tooltip content="任务执行时间需要大于当前时间" v-if="scope.row.task_time < currentSystemTime">
                        <el-icon>
                            <InfoFilled />
                        </el-icon>
                    </el-tooltip>
                </el-button>
                <el-button size="small" type="primary" link style="margin-left:5px"
                    @click="getTaskDetailRef.dialogVisible = true; currentTaskId = scope.row.id">查看执行明细</el-button>
            </template>
        </el-table-column>
        <el-table-column property="remark" label="备注" show-overflow-tooltip>
            <template #default="scope">
                <el-text size="small">{{ scope.row.remark }}</el-text>
            </template>
        </el-table-column>
        <el-table-column property="msg" label="提示" show-overflow-tooltip>
            <template #default="scope">
                <el-text v-if="scope.row.msg" type="warning" size="small">{{ scope.row.msg }}</el-text>
            </template>
        </el-table-column>
    </el-table>
    <el-pagination @current-change="handleCurrentChange" :current-page="currentPage" :page-size="pageSize"
        layout="prev, pager, next" :total="total">
    </el-pagination>

    <TaskDetail ref="getTaskDetailRef" :taskId="currentTaskId" />
</template>
<script setup>
import { reactive, ref, onMounted, useTemplateRef } from 'vue'
import axios from 'axios'
import TaskDetail from './TaskDetail.vue'
import { InfoFilled } from '@element-plus/icons-vue'

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)// 每页显示的数据条数
const total = ref(0)// 总数据条数
const currentSystemTime = ref('')//每次查询任务列表时返回的当前服务器时间

const form = reactive({
    task_name: ''
})

const getTaskDetailRef = useTemplateRef('getTaskDetailRef')
const currentTaskId = ref(0)

const getTasks = () => {
    axios.post('/api/ItemTimingUpdateQuantity/getTasks', {
        task_name: form.task_name,
        page: currentPage.value,
        page_size: pageSize.value
    }).then(response => {
        tableData.value = response.data.rows
        total.value = response.data.total
        currentSystemTime.value = response.data.time
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

const cancelTask = (id) => {
    ElMessageBox.confirm('确定暂停执行任务吗？', 'Warning', { type: 'warning' })
        .then(() => {
            doCancelTask(id)
        })
}
const doCancelTask = (id) => {
    axios.post('/api/ItemTimingUpdateQuantity/cancelTask', {
        id
    }).then(response => {
        if (response.data.status == 1) {
            ElMessage({
                message: '暂停成功',
                type: 'success',
            })
            getTasks()
        } else {
            ElMessage.error(response.data.info)
        }
    }).catch(function (error) {
        console.log(error)
    })
}

const restartTask = (id) => {
    ElMessageBox.confirm('确定恢复执行任务吗？', 'Warning', { type: 'warning' })
        .then(() => {
            doRestartTask(id)
        })
}

const doRestartTask = (id) => {
    axios.post('/api/ItemTimingUpdateQuantity/restartTask', {
        id
    }).then(response => {
        if (response.data.status == 1) {
            ElMessage({
                message: '恢复成功',
                type: 'success',
            })
            getTasks()
        } else {
            ElMessage.error(response.data.info)
        }
    }).catch(function (error) {
        console.log(error)
    })
}
</script>