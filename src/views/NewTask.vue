<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>定时修改库存 </el-breadcrumb-item>
        <el-breadcrumb-item>新建任务</el-breadcrumb-item>
    </el-breadcrumb>
    <div style="margin:20px 0">
        <el-alert title="可定时对商品或sku修改库存，有sku的商品只能修改sku的库存不能直接修改商品库存，无sku的商品则直接修改商品库存" type="info" show-icon />
        <el-alert title="商品总库存改为0后，自动下架到仓库中；仓库中的商品修改后库存大于0的话，不自动上架，如需定时上下架整个商品请用“定时上下架”功能" type="info" show-icon style="margin-top:5px;" />
    </div>
    <el-form :model="form" label-width="auto" style="max-width:1050px">
        <el-form-item label="任务名称">
            <el-input v-model="form.name" placeholder="方便自己管理和识别不同任务" />
        </el-form-item>
        <el-form-item label="商品或sku">
            <div style="margin-bottom:0px">
                <el-button type="primary" plain size="small"
                    @click="itemSelectRef.dialogVisible = true">添加商品或sku</el-button>
            </div>
            <el-table :data="tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)" row-key="id"
                default-expand-all>
                <el-table-column property="num_iid" label="ID" width="150" />
                <el-table-column property="pic_url" label="主图" width="100">
                    <template #default="scope">
                        <el-image :src="scope.row.pic_url" style="width:50px;">
                            <template #error>&nbsp;</template>
                        </el-image>
                    </template>
                </el-table-column>
                <el-table-column property="title" label="标题" width="458" />
                <el-table-column property="quantity" label="库存" width="150">
                    <template #default="scope">
                        <el-input-number v-if="scope.row.sku_id" v-model="scope.row.quantity" :min="0" size="small" />
                        <el-input-number v-else-if="scope.row.has_sku == 0" v-model="scope.row.num" :min="0"
                            size="small" />
                    </template>
                </el-table-column>
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
        <el-form-item label="任务执行时间">
            <el-date-picker v-model="form.task_time" type="datetime" placeholder="请选择任务执行时间" style="width:100%"
                value-format="YYYY-MM-DD HH:mm:ss" />
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
            <el-button type="primary" @click="onSubmit" :disabled="submitBtnDisabled">创建</el-button>
        </el-form-item>
    </el-form>

    <ItemsSelect ref="itemSelectRef" @get-selection-items="getSelectionItems" withSku />
</template>
<script setup>
import { reactive, ref, useTemplateRef, markRaw } from 'vue'
import ItemsSelect from '../components/ItemsSelect.vue'
import axios from 'axios'
import qs from 'qs'
import { CircleCheck } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const itemSelectRef = useTemplateRef('itemSelectRef')

// do not use same name with ref
const form = reactive({
    name: '',
    task_time: '',
    repeat: 0,
    remark: ''
})

const tableData = ref([])

const submitBtnDisabled = ref(false)

const router = useRouter()

const onSubmit = () => {
    submitBtnDisabled.value = true
    const form1 = Object.assign({}, form)
    form1.items = tableData.value
    //表单+表格数据一起传送必须用qs.stringify方法，尝试了一个下午！！！！！
    axios.post('/api/ItemTimingUpdateQuantity/addTask', qs.stringify(form1)).then(response => {
        submitBtnDisabled.value = false
        if (response.data.status) {
            ElMessageBox.alert(
                '创建成功',
                '提示',
                {
                    type: 'success',
                    icon: markRaw(CircleCheck),
                    callback: (action) => {
                        ElMessage({
                            type: 'info',
                            message: `action: ${action}`,
                        })
                        router.push('/list')
                    },
                }
            )
        } else {
            ElMessage({
                showClose: true,
                message: response.data.info,
                duration: 5000,
                type: 'error'
            })
        }
    }).catch(function (error) {
        submitBtnDisabled.value = false
        console.log(error)
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
    if (row.sku_id === undefined) {
        //删除商品
        const itemIndex = tableData.value.findIndex(currentValue => {
            return currentValue.num_iid == row.num_iid
        })
        tableData.value.splice(itemIndex, 1)
    } else {
        //删除sku
        const itemIndex = tableData.value.findIndex(currentValue => {
            return currentValue.num_iid == row.parent_id
        })
        const skuIndex = tableData.value[itemIndex].children.findIndex(currentValue => {
            return currentValue.sku_id == row.sku_id
        })
        tableData.value[itemIndex].children.splice(skuIndex, 1)
    }
}
function getTableDataIndex(num_iid) {

}
</script>
<style scoped>
/* .el-form {
    margin-top: 40px
} */
</style>