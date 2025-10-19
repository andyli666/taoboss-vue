<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>定时上/下架</el-breadcrumb-item>
        <el-breadcrumb-item>新建任务</el-breadcrumb-item>
    </el-breadcrumb>
    <div style="margin:20px 0">
        <el-alert title="可定时对商品进行上架或者下架操作" type="info" show-icon />
    </div>
    <el-form :model="form" :rules="rules" ref="ruleFormRef" label-width="auto" style="width: 100%;max-width:1000px">
        <el-form-item label="任务名称" prop="name">
            <el-input v-model="form.name" placeholder="方便自己管理和识别不同任务" />
        </el-form-item>
        <el-form-item label="任务商品">
            <div style="margin-bottom:0px">
                <el-button type="primary" plain size="small"
                    @click="itemSelectRef.dialogVisible = true">添加商品</el-button>
            </div>
            <el-table :data="tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)" row-key="num_iid">
                <el-table-column property="pic_url" label="主图" width="100">
                    <template #default="scope">
                        <el-image :src="scope.row.pic_url" style="width:50px;">
                            <template #error>&nbsp;</template>
                        </el-image>
                    </template>
                </el-table-column>
                <el-table-column property="title" label="标题" width="500">
                    <template #default="scope">
                        [{{ scope.row.num_iid }}]<br />{{ scope.row.title }}
                    </template>
                </el-table-column>
                <el-table-column property="num" label="库存" width="150" />
                <el-table-column label="操作" width="60">
                    <template #default="scope">
                        <el-popconfirm width="160" title="确定删除此行吗？" placement="right"
                            @confirm="handleDelete(scope.$index, scope.row)">
                            <template #reference>
                                <el-button size="small" type="danger">删除</el-button>
                            </template>
                        </el-popconfirm>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination @current-change="handleCurrentChange" :current-page="currentPage" :page-size="pageSize"
                layout="prev, pager, next" :total="tableData.length">
            </el-pagination>
        </el-form-item>
        <el-form-item label="任务操作" prop="action">
            <el-radio-group v-model="form.action">
                <el-radio :value="0">上架</el-radio>
                <el-radio :value="1">下架</el-radio>
            </el-radio-group>
        </el-form-item>
        <el-form-item label="任务执行时间" prop="time">
            <el-date-picker v-model="form.time" type="datetime" placeholder="请选择任务执行时间" style="width:100%"
                value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="重复周期" prop="repeat">
            <el-radio-group v-model="form.repeat">
                <el-radio :value="0">不重复，只执行一次</el-radio>
                <el-radio :value="1">每天</el-radio>
                <el-radio :value="2">每周</el-radio>
                <el-radio :value="3">工作日</el-radio>
                <el-radio :value="4">周末</el-radio>
            </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="submitForm(ruleFormRef)" :loading="loading">{{ loading ? '创建中...' : '创建'
            }}</el-button>
        </el-form-item>
    </el-form>

    <ItemsSelect ref="itemSelectRef" @get-selection-items="getSelectionItems" />
</template>
<script setup>
import { reactive, ref, useTemplateRef, markRaw, watch, onMounted } from 'vue'
import ItemsSelect from '@/components/ItemsSelect.vue'
import request from '@/utils/request'
import { CircleCheck } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'

const itemSelectRef = useTemplateRef('itemSelectRef')
const ruleFormRef = useTemplateRef('ruleFormRef')

const form = reactive({
    name: '',
    action: '',
    time: '',
    repeat: '',
    remark: ''
})
const rules = reactive({
    action: [
        {
            required: true,
            message: '请选择任务操作',
            trigger: 'change',
        },
    ],
    time: [
        {
            type: 'date',
            required: true,
            message: '请选择任务时间',
            trigger: 'change',
        },
    ],
    repeat: [
        {
            required: true,
            message: '请选择重复周期',
            trigger: 'change',
        },
    ]
})

const tableData = ref([])
const loading = ref(false)
const router = useRouter()

// 校验数据
const submitForm = async (formEl) => {
    if (!formEl) return
    await formEl.validate((valid, fields) => {
        if (valid) {
            if (tableData.value.length > 0) {
                doSubmit()
            } else {
                ElMessage.error('请添加任务商品')
            }
        } else {
            console.log('error submit!', fields)
        }
    })

}
// 提交数据
const doSubmit = () => {
    loading.value = true
    const formData = Object.assign({}, form)
    formData.items = tableData.value
    request.post('/api/timing-list-delist/new', formData).then(response => {
        loading.value = false
        if (response.data.status) {
            ElMessageBox.alert(
                '创建成功',
                '提示',
                {
                    type: 'success',
                    icon: markRaw(CircleCheck),
                    callback: () => {
                        router.push('/timing-list-delist/list')
                    }
                }
            )
        } else {
            ElMessage({
                showClose: true,
                message: response.data.msg,
                duration: 5000,
                type: 'error'
            })
        }
    }).catch((error) => {
        loading.value = false
        ElMessage.error(error)
    })
}

const getSelectionItems = (items) => {
    tableData.value = items
}
const currentPage = ref(1);
const pageSize = ref(10) // 每页显示的数据条数
const handleCurrentChange = (val) => {
    currentPage.value = val
}
const handleDelete = (index, row) => {
    const itemIndex = tableData.value.findIndex(currentValue => {
        return currentValue.num_iid == row.num_iid
    })
    tableData.value.splice(itemIndex, 1)

}

// 复制任务
const route = useRoute()
const initTask = (id) => {
    if (!id) {
        return
    }
    request.post('/api/timing-list-delist/get-task', {
        id
    }).then(response => {
        if (response.data.status == 1) {
            const task = response.data.data
            if (task) {
                form.name = task.name
                form.action = task.action
                form.time = ''
                form.repeat = task.repeat
                form.remark = task.remark
                tableData.value = task.items
            }
        } else {
            ElMessage.error(response.data.msg)
        }
    }).catch((error) => {
        ElMessage.error(error)
    })
}
onMounted(() => {
    initTask(route.params.id)
})
watch(() => route.params.id, (newId, oldId) => {
    // 对路由变化做出响应...
    console.log(newId, oldId)
    console.log(!newId)
    if (!newId) {
        ruleFormRef.value.resetFields()
        tableData.value = []
    }
})
</script>
<style scoped>
/* .el-form {
    margin-top: 40px
} */
</style>