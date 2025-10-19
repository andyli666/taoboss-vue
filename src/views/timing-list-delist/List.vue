<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>定时上/下架 </el-breadcrumb-item>
        <el-breadcrumb-item>任务列表</el-breadcrumb-item>
    </el-breadcrumb>
    <el-form :inline="true" :model="form" @submit.prevent style="margin:20px 0;max-width:1000px">
        <el-form-item label="任务名称">
            <el-input v-model="form.name" clearable @keyup.enter="getTasks" />
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="getTasks">查询</el-button>
        </el-form-item>
    </el-form>
    <el-table :data="tableData" row-key="id">
        <!-- <el-table-column type="index" width="55" label="序号" :index="indexMethod" /> -->
        <el-table-column property="name" label="名称" width="180" show-overflow-tooltip />
        <el-table-column property="action" label="操作" width="80">
            <template #default="scope">
                <div v-if="scope.row.action == 0">上架</div>
                <div v-else-if="scope.row.action == 1">下架</div>
            </template>
        </el-table-column>
        <el-table-column property="time" label="任务执行时间" width="165" />
        <el-table-column property="repeat" label="重复" width="80">
            <template #default="scope">
                <div v-if="scope.row.repeat == 0">否</div>
                <div v-else-if="scope.row.repeat == 1">每天</div>
                <div v-else-if="scope.row.repeat == 2">每周</div>
                <div v-else-if="scope.row.repeat == 3">工作日</div>
                <div v-else-if="scope.row.repeat == 4">周末</div>
            </template>
        </el-table-column>
        <el-table-column property="status" label="任务状态" width="80">
            <template #default="scope">
                <div v-if="scope.row.status == 0">待执行</div>
                <div v-else-if="scope.row.status == 1">已完成</div>
                <div v-else-if="scope.row.status == 2">系统暂停</div>
                <div v-else-if="scope.row.status == 3">人工暂停</div>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="350">
            <template #default="scope">
                <el-button size="small" type="primary" link style="margin-left:5px"
                    @click="getTaskDetailRef.dialogVisible = true; currentTaskId = scope.row.id">查看执行明细</el-button>
                <el-button v-if="scope.row.status == 0" size="small" type="primary" link
                    @click="cancelTask(scope.row.id)">暂停执行</el-button>
                <el-button v-else-if="scope.row.status == 2 || scope.row.status == 3"
                    :disabled="scope.row.repeat == 0 && scope.row.time < currentSystemTime" size="small" type="primary"
                    link @click="restartTask(scope.row.id)">
                    恢复执行
                    <el-tooltip content="任务执行时间需要大于当前时间"
                        v-if="scope.row.repeat == 0 && scope.row.time < currentSystemTime">
                        <el-icon>
                            <InfoFilled />
                        </el-icon>
                    </el-tooltip>
                    <el-tooltip content="将根据重复周期自动计算下次任务执行时间"
                        v-else-if="scope.row.repeat > 0 && scope.row.time < currentSystemTime">
                        <el-icon>
                            <InfoFilled />
                        </el-icon>
                    </el-tooltip>
                </el-button>
                <el-button size="small" type="danger" link
                    :style="{ 'margin-left': ((scope.row.time < currentSystemTime) ? 5 : 17) + 'px' }"
                    @click="removeTask(scope.row.id)">删除任务</el-button>
                <el-button size="small" type="primary" link @click="copyTask(scope.row.id)">复制任务</el-button>
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
import request from '@/utils/request'
import TaskDetail from './Detail.vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
// import { useIndexMethod } from '@/composables/useIndexMethod'

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)// 每页显示的数据条数
const total = ref(0)// 总数据条数
const currentSystemTime = ref('')//每次查询任务列表时返回的当前服务器时间

const form = reactive({
    name: ''
})

const getTaskDetailRef = useTemplateRef('getTaskDetailRef')
const currentTaskId = ref(0)

const getTasks = () => {
    request.post('/api/timing-list-delist/get-tasks', {
        name: form.name,
        page: currentPage.value,
        pageSize: pageSize.value
    }).then(response => {
        tableData.value = response.data.rows
        total.value = response.data.total
        currentSystemTime.value = response.data.time
    }).catch((error) => {
        ElMessage.error(error)
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
        }).catch(() => { })
}
const doCancelTask = (id) => {
    request.post('/api/timing-list-delist/cancel-task', {
        id
    }).then(response => {
        if (response.data.status == 1) {
            ElMessage({
                message: '暂停成功',
                type: 'success',
            })
            getTasks()
        } else {
            ElMessage.error(response.data.msg)
        }
    }).catch((error) => {
        ElMessage.error(error)
    })
}

const restartTask = (id) => {
    ElMessageBox.confirm('确定恢复执行任务吗？', 'Warning', { type: 'warning' })
        .then(() => {
            doRestartTask(id)
        }).catch(() => { })
}

const doRestartTask = (id) => {
    request.post('/api/timing-list-delist/restart-task', {
        id
    }).then(response => {
        if (response.data.status == 1) {
            ElMessage({
                message: '恢复成功',
                type: 'success',
            })
            getTasks()
        } else {
            ElMessage.error(response.data.msg)
        }
    }).catch((error) => {
        ElMessage.error(error)
    })
}

const removeTask = (id) => {
    ElMessageBox.confirm('确定删除任务吗？', 'Warning', { type: 'warning' })
        .then(() => {
            doRemoveTask(id)
        }).catch(() => { })
}

const doRemoveTask = (id) => {
    request.post('/api/timing-list-delist/remove-task', {
        id
    }).then(response => {
        if (response.data.status == 1) {
            ElMessage({
                message: '删除成功',
                type: 'success',
            })
            getTasks()
        } else {
            ElMessage.error(response.data.msg)
        }
    }).catch((error) => {
        ElMessage.error(error)
    })
}

// 复制任务
const router = useRouter()
const copyTask = (id) => {
    router.push(`/timing-list-delist/new/${id}`)
}

// const indexMethod = (index) => {
//   const { newIndex } = useIndexMethod(index, currentPage, pageSize)
//   return newIndex.value
// }
</script>