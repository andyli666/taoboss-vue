<template>
    <el-dialog v-model="dialogVisible" title="活动发布详情" width="1000">
        <el-form :inline="true" :model="form" @submit.prevent size="small">
            <el-form-item label="商品">
                <el-input v-model="form.title" clearable @keyup.enter="getDetails" placeholder="商品ID或标题" style="width: 200px" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="getDetails">查询</el-button>
            </el-form-item>
        </el-form>
        <el-table :data="tableData" size="small">
            <!-- <el-table-column type="index" width="55" label="序号" /> -->
            <el-table-column property="pic_url" label="商品" width="350">
                <template #default="scope">
                    <el-row>
                        <el-col :span="4"><el-image :src="scope.row.pic_url" style="width:50px">
                            <template #error>&nbsp;</template>
                        </el-image></el-col>
                        <el-col :span="20"><span>[{{ scope.row.num_iid }}]{{ scope.row.title }}</span></el-col>
                    </el-row>
                </template>
            </el-table-column>
            <el-table-column property="status" label="发布结果" width="80">
                <template #default="scope">
                    <div v-if="scope.row.status == 1"><el-text type="success" size="small">成功</el-text></div>
                    <div v-else-if="scope.row.status == 2"><el-text type="danger" size="small">出错</el-text></div>
                    <div v-else-if="scope.row.status == 0">未发布</div>
                </template>
            </el-table-column>
            <el-table-column property="modified" label="发布时间" width="150" />
            <el-table-column property="msg" label="出错信息" show-overflow-tooltip />
            <el-table-column label="操作" width="150">
                <template #default="scope">
                    <el-button size="small" type="primary" link @click="publishRange(scope.row.id)"
                        :disabled="scope.row.status == 1">发布</el-button>
                    <el-button size="small" type="primary" link @click="uninstallRange(scope.row.id)"
                        :disabled="scope.row.status != 1">卸载</el-button>
                    <el-button size="small" type="danger" link @click="removeRange(scope.row.id)"
                        :disabled="scope.row.status == 1">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination @current-change="handleCurrentChange" :current-page="currentPage" :page-size="pageSize"
            layout="prev, pager, next" :total="total">
        </el-pagination>
    </el-dialog>
</template>
<script setup>
import { ref, watch, reactive } from 'vue'
import axios from 'axios'
import { InfoFilled } from '@element-plus/icons-vue'

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)// 每页显示的数据条数
const total = ref(0)// 总数据条数

const dialogVisible = ref(false)
defineExpose({
    dialogVisible
})

const { activityId } = defineProps(['activityId'])

const form = reactive({
    title: ''
})

const getDetails = () => {
    if (activityId) {
        axios.post('/api/RelatedRecommendations/getDetails', {
            id: activityId,
            title: form.title
        }).then(response => {
            tableData.value = response.data.rows
            total.value = response.data.total
        }).catch((error) => {
            ElMessage.error(error)
        })
    }
}
const handleCurrentChange = (val) => {
    currentPage.value = val
}

const publishRange = (id) => {
    ElMessageBox.confirm('确定发布吗？', '提示', { type: 'info' })
        .then(() => {
            doPublishRange(id)
        }).catch(() => { })
}
const doPublishRange = (id) => {
    axios.post('/api/RelatedRecommendations/publishRange', {
        id
    }).then(response => {
        if (response.data.status == 1) {
            ElMessage({
                message: '发布成功',
                type: 'success',
            })
            getDetails()
        } else {
            ElMessage.error(response.data.msg)
        }
    }).catch((error) => {
        ElMessage.error(error)
    })
}

const uninstallRange = (id) => {
    ElMessageBox.confirm('确定发布吗？', '提示', { type: 'warning' })
        .then(() => {
            doUninstallRange(id)
        }).catch(() => { })
}
const doUninstallRange = (id) => {
    axios.post('/api/RelatedRecommendations/uninstallRange', {
        id
    }).then(response => {
        if (response.data.status == 1) {
            ElMessage({
                message: '卸载成功',
                type: 'success',
            })
            getDetails()
        } else {
            ElMessage.error(response.data.msg)
        }
    }).catch((error) => {
        ElMessage.error(error)
    })
}

const removeRange = (id) => {
    ElMessageBox.confirm('确定删除此条发布范围吗？', '提示', { type: 'warning' })
        .then(() => {
            doRemoveRange(id)
        }).catch(() => { })
}
const doRemoveRange = (id) => {
    axios.post('/api/RelatedRecommendations/removeRange', {
        id
    }).then(response => {
        if (response.data.status == 1) {
            ElMessage({
                message: '删除成功',
                type: 'success',
            })
            getDetails()
        } else {
            ElMessage.error(response.data.msg)
        }
    }).catch((error) => {
        ElMessage.error(error)
    })
}

watch(() => activityId, () => {
    getDetails()
})
</script>
<style scoped>
.el-pagination {
    margin-top: 16px;
}
</style>