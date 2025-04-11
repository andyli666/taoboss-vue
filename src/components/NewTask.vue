<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>sku定时上下架 </el-breadcrumb-item>
        <el-breadcrumb-item>新建任务</el-breadcrumb-item>
    </el-breadcrumb>
    <div style="margin: 20px 0;">
        <el-alert title="可对sku执行定时上下架任务" type="info" show-icon />
    </div>
    <el-form :model="form" label-width="auto" style="max-width:800px">
        <el-form-item label="任务名称">
            <el-input v-model="form.name" placeholder="方便自己后期管理和识别不同任务" />
        </el-form-item>
        <el-form-item label="sku">
            <div style="margin-bottom:0px">
                <el-button type="primary" plain size="small"
                    @click="itemSelectRef.dialogVisible = true">添加sku</el-button>
            </div>
            <el-table :data="tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)" row-key="id"
                default-expand-all>
                <el-table-column property="num_iid" label="ID" width="150" />
                <el-table-column property="pic_url" label="主图" width="100">
                    <template #default="scope">
                        <el-image :src="scope.row.pic_url" style="width: 50px;">
                            <template #error>&nbsp;</template>
                        </el-image>
                    </template>
                </el-table-column>
                <el-table-column property="title" label="标题" />
                <el-table-column label="操作" width="60">
                    <template #default="scope">
                        <el-popconfirm width="160" title="确定取消此行吗？" placement="right"
                            @confirm="handleDelete(scope.$index)">
                            <template #reference>
                                <el-button size="small" type="danger">
                                    取消
                                </el-button>
                            </template>
                        </el-popconfirm>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination @current-change="handleCurrentChange" :current-page="currentPage" :page-size="pageSize"
                layout="prev, pager, next" :total="tableData.length">
            </el-pagination>
        </el-form-item>
        <el-form-item label="上架时间">
            <el-date-picker v-model="form.datetime1" type="datetime" placeholder="留空则不执行上架操作" style="width: 100%" />
        </el-form-item>
        <el-form-item label="下架时间">
            <el-date-picker v-model="form.datetime2" type="datetime" placeholder="留空则不执行下架操作" style="width: 100%" />
        </el-form-item>
        <el-form-item label="重复周期">
            <el-radio-group v-model="form.repeat">
                <el-radio :value="0">不重复，只执行一次</el-radio>
                <el-radio :value="1">每天</el-radio>
                <el-radio :value="2">每周</el-radio>
                <el-radio :value="3">工作日</el-radio>
                <el-radio :value="4">周末</el-radio>
            </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="onSubmit">创建</el-button>
            <!-- <el-button>取消</el-button> -->
        </el-form-item>
    </el-form>

    <ItemSelect ref="itemSelectRef" @get-selection-items="getSelectionItems" />
</template>
<script setup>
import { reactive, ref, useTemplateRef } from 'vue'
import ItemSelect from './ItemSelect.vue'

const itemSelectRef = useTemplateRef('itemSelectRef')

// do not use same name with ref
const form = reactive({
    name: '',
    datetime1: '',
    datetime2: '',
    repeat: 0,
    remark: ''
})

const onSubmit = () => {
    console.log('submit!')
    form.data.tableData= tableData.value
    axios.post('/api/test/addTask', form.data).then(response => {
        console.log(response)
    }).catch(function (error) {
        console.log(error)
    })
}

const tableData = ref([])

const getSelectionItems = (items) => {
    console.log(items)
    tableData.value = items
}

const currentPage = ref(1);
const pageSize = ref(10) // 每页显示的数据条数

const handleCurrentChange = (val) => {
    currentPage.value = val
}
const handleDelete = (index) => {
    tableData.value.splice(index, 1)
}
</script>
<style scoped>
/* .el-form {
    margin-top: 40px
} */
</style>