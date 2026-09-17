<template>
    <el-dialog v-model="dialogVisible" title="活动发布详情" width="1000" @opened="getDetails">
        <el-form :inline="true" :model="form" @submit.prevent size="small" style="width:100%">
            <el-form-item label="商品">
                <el-input v-model="form.title" clearable @keyup.enter="getDetails" placeholder="商品ID或标题"
                    style="width: 200px" />
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
                        <el-col :span="4">
                            <el-image :src="scope.row.pic_url" style="width:50px">
                                <template #error>&nbsp;</template>
                            </el-image>
                        </el-col>
                        <el-col :span="20">
                            <span>
                                [{{ scope.row.num_iid }}]
                                <a :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank" class="link">
                                    {{ scope.row.title }}
                                </a>
                            </span>
                        </el-col>
                    </el-row>
                </template>
            </el-table-column>
            <el-table-column property="status" label="发布结果" width="80">
                <template #default="scope">
                    <div v-if="scope.row.status == 1"><el-text type="success" size="small">成功</el-text></div>
                    <div v-else-if="scope.row.status == 2"><el-text type="danger" size="small">发布出错</el-text></div>
                    <div v-else-if="scope.row.status == 3"><el-text type="danger" size="small">卸载出错</el-text></div>
                    <div v-else-if="scope.row.status == 0">未发布</div>
                </template>
            </el-table-column>
            <el-table-column property="modified" label="发布时间" width="150" />
            <el-table-column property="msg" label="出错信息" show-overflow-tooltip />
            <el-table-column label="操作" width="150">
                <template #default="scope">
                    <el-button size="small" type="primary" link @click="publishRange(scope.row)"
                        :disabled="scope.row.status == 1" :loading="scope.row.publishLoading">发布</el-button>
                    <el-button size="small" type="primary" link @click="uninstallRange(scope.row)"
                        :disabled="scope.row.status != 1" :loading="scope.row.uninstallLoading">卸载</el-button>
                    <el-button size="small" type="danger" link @click="removeRange(scope.row)"
                        :disabled="scope.row.status == 1" :loading="scope.row.removeLoading">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange" :current-page="currentPage"
            v-model:page-size="pageSize" :page-sizes="[10, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
            :total="total" size="small">
        </el-pagination>
    </el-dialog>
</template>
<script setup>
import { ref, watch, reactive } from 'vue'
import request from '@/utils/request'
import { getItemWirelessUrl } from '@/utils/index'

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
        request.post('/api/recommend/get-details', {
            id: activityId,
            title: form.title,
            page: currentPage.value,
            page_size: pageSize.value
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
    getDetails()
}
const handleSizeChange = () => {
    getDetails()
}

const publishRange = (row) => {
    ElMessageBox.confirm('确定发布吗？', '提示')
        .then(() => {
            doPublishRange(row)
        }).catch(() => { })
}
const doPublishRange = (row) => {
    row.publishLoading = true
    request.post('/api/recommend/publish-range', {
        id: row.id
    }).then(response => {
        if (response.data.status == 1) {
            ElMessage({
                message: '发布成功',
                type: 'success',
            })
        } else {
            ElMessage.error(response.data.msg)
        }
        row.publishLoading = true
        getDetails()
    }).catch((error) => {
        ElMessage.error(error)
        row.publishLoading = false
    })
}

const uninstallRange = (row) => {
    ElMessageBox.confirm('确定卸载吗？', '提示', { type: 'warning' })
        .then(() => {
            doUninstallRange(row)
        }).catch(() => { })
}
const doUninstallRange = (row) => {
    row.uninstallLoading = true
    request.post('/api/recommend/uninstall-range', {
        id: row.id
    }).then(response => {
        if (response.data.status == 1) {
            if (response.data.data.status == 3) {//卸载出错
                ElMessage.error(response.data.msg)
            } else if (response.data.data.status == 0) {//卸载成功
                ElMessage.success('卸载成功')
                getDetails()
            }
        } else {
            ElMessage.error(response.data.msg)
        }
        row.uninstallLoading = false
    }).catch((error) => {
        ElMessage.error(error)
        row.uninstallLoading = false
    })
}

const removeRange = (row) => {
    ElMessageBox.confirm('确定删除此条发布范围吗？', '提示', { type: 'warning' })
        .then(() => {
            doRemoveRange(row)
        }).catch(() => { })
}
const doRemoveRange = (row) => {
    row.removeLoading = true
    request.post('/api/recommend/remove-range', {
        id: row.id
    }).then(response => {
        if (response.data.status == 1) {
            ElMessage.success('删除成功')
            getDetails()
        } else {
            ElMessage.error(response.data.msg)
        }
        row.removeLoading = false
    }).catch((error) => {
        ElMessage.error(error)
        row.removeLoading = false
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

/* 去除超链接的下划线和默认的蓝色 */
.link {
    text-decoration: none;
    color: inherit;
}
</style>