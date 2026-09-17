<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>上下架优化 </el-breadcrumb-item>
        <el-breadcrumb-item>新建优化任务</el-breadcrumb-item>
    </el-breadcrumb>
    <div style="margin:15px 0">
        <el-alert title="" type="info" show-icon>
            <div>可对商品自动上下架时间进行调整；</div>
            <div>淘宝商品7天自动上下架一次，越临近下架时间，排名越靠前，把自动上下架时间调整为流量高峰时段可获取更多流量；</div>
            <div>确定流量高峰时段首先需要确定流量高峰在周几，其次确定是周几的几点；</div>
            <div>确定周几在“生意参谋 => 流量 => 流量看板”，点击“30天”查看；确定在几点则点击相同页面“流量总览”旁边的“访客分析”，同样选择查看30天或者7天数据。</div>
        </el-alert>
    </div>
    <el-form :model="form" label-width="auto" style="max-width:1000px">
        <el-form-item label="任务名称">
            <el-input v-model="form.taskName" placeholder="方便自己管理和识别不同任务" />
        </el-form-item>
        <el-form-item label="任务商品">
            <div style="margin-bottom:0px">
                <el-button type="primary" plain size="small"
                    @click="itemSelectRef.dialogVisible = true">添加商品</el-button>
            </div>
            <el-table :data="tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)" row-key="num_iid"
                style="width: 100%">
                <el-table-column property="pic_url" label="商品" width="500">
                    <template #default="scope">
                        <el-row>
                            <el-col :span="4">
                                <el-image :src="scope.row.pic_url" style="width:50px">
                                    <template #error>&nbsp;</template>
                                </el-image>
                            </el-col>
                            <el-col :span="20">
                                [{{ scope.row.num_iid }}]
                                {{ scope.row.title }}
                            </el-col>
                        </el-row>
                    </template>
                </el-table-column>
                <el-table-column property="delist_time" label="当前自动上下架时间" width="210">
                    <template #default="scope">
                        {{ scope.row.delist_time }}
                        [{{ getWeek(scope.row.delist_time) }}]
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
        <el-form-item label="计划自动上下架时间">
            <el-date-picker v-model="form.delistTime" type="datetime" placeholder="请选择日期和时间" style="width:100%"
                value-format="YYYY-MM-DD HH:mm:ss" :disabled-date="disabledDate" :disabled-hours="disabledHours"
                :disabled-minutes="disabledMinutes" :disabled-seconds="disabledSeconds" />
        </el-form-item>
        <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="onSubmit" :disabled="submitBtnDisabled">创建</el-button>
        </el-form-item>
    </el-form>
    <ItemsSelect ref="itemSelectRef" @get-selection-items="getSelectionItems" showDelistTime />
</template>
<script setup>
import { reactive, ref, useTemplateRef, markRaw } from 'vue'
import ItemsSelect from '@/components/ItemsSelect.vue'
import request from '@/utils/request'
import { CircleCheck } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { getWeek } from '@/utils/index'


const itemSelectRef = useTemplateRef('itemSelectRef')

const form = reactive({
    taskName: '',
    delistTime: '',
    remark: ''
})

const tableData = ref([])

//
const submitBtnDisabled = ref(false)
const router = useRouter()
const onSubmit = () => {
    if (!tableData.value.length) {
        ElMessage.error('请选择任务商品')
        return
    }
    if (!form.delistTime) {
        ElMessage.error('请选择下架时间')
        return
    }
    submitBtnDisabled.value = true
    const formData = Object.assign({}, form)
    formData.items = tableData.value
    request.post('/api/delist-optimize/new-task', formData).then(response => {
        submitBtnDisabled.value = false
        if (response.data.status) {
            ElMessageBox.alert(
                '创建成功',
                '提示',
                {
                    type: 'success',
                    icon: markRaw(CircleCheck),
                    callback: () => {
                        router.push('/delist-optimize/list')
                    }
                }
            )
        } else {
            ElMessage.error(response.data.msg)
        }
    }).catch((error) => {
        submitBtnDisabled.value = false
        ElMessage.error(error)
    })
}

// 选择的商品
const getSelectionItems = (items) => {
    console.log(items)
    tableData.value = items
}

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const handleCurrentChange = (val) => {
    currentPage.value = val
}

// 删除商品
const handleDelete = (index, row) => {
    const itemIndex = tableData.value.findIndex(currentValue => {
        return currentValue.num_iid == row.num_iid
    })
    tableData.value.splice(itemIndex, 1)
}

//
// 禁用今天及之前的日期
const disabledDate = (time) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // 将今天的时间归零，只比较日期部分
    return time.getTime() < today.getTime()
}

// 禁用过去的小时（如果是今天）
const disabledHours = () => {
    const now = new Date()
    const hours = []
    // 如果选中的日期是今天，则禁用今天之前的小时
    if (isToday(form.delistTime)) {
        for (let i = 0; i < now.getHours(); i++) {
            hours.push(i)
        }
    }
    return hours
}

// 禁用过去的分钟（如果是今天且当前小时）
const disabledMinutes = (selectedHour) => {
    const now = new Date()
    const minutes = []
    if (isToday(form.delistTime) && selectedHour === now.getHours()) {
        for (let i = 0; i < now.getMinutes(); i++) {
            minutes.push(i)
        }
    }
    return minutes
}

// 禁用过去的秒数（如果是今天、当前小时和当前分钟）
const disabledSeconds = (selectedHour, selectedMinute) => {
    const now = new Date()
    const seconds = []
    if (isToday(form.delistTime) && selectedHour === now.getHours() && selectedMinute === now.getMinutes()) {
        for (let i = 0; i < now.getSeconds(); i++) {
            seconds.push(i)
        }
    }
    return seconds
}

// 辅助函数：判断选择的日期是否是今天
const isToday = (dateString) => {
    if (!dateString) return false
    const today = new Date()
    const date = new Date(dateString)
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
}
</script>
<style scoped>
/* .el-form {
    margin-top: 40px
} */
</style>