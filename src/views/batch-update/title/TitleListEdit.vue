<template>
    <FormList ref="formListRef" :sort="sort" :order="order" :currentPage="currentPage"
        :pageSize="pageSize" @loaded="handleLoaded" />
    <el-table :data="tableData" row-key="id" ref="tableRef" @sort-change="handleSortChange">
        <el-table-column type="index" width="50" label="" :index="indexMethod" />
        <el-table-column type="selection" width="45" class-name="col-check" :reserve-selection="true" />
        <el-table-column width="210">
            <template #header>
                <el-button size="small" type="primary" plain @click="batchSave()" :loading="batchSaveLoading">
                    {{ batchSaveLoading ? '保存中' : '批量保存修改' }}
                </el-button>
            </template>
            <template #default="scope">
                <div class="textarea-wrap">
                    <div>
                        <a :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank">
                            <el-image :src="scope.row.pic_url + '_60x60.jpg'" style="width:60px">
                                <template #error>&nbsp;</template>
                            </el-image>
                        </a>
                    </div>
                    <div class="ml-5 text-gray">
                        <el-row style="word-break: break-all">ID:{{ scope.row.num_iid }}</el-row>
                        <el-row>状态:{{ getApproveStatus(scope.row.approve_status) }}</el-row>
                        <el-row>商家编码:{{ scope.row.outer_id ?? '无' }}</el-row>
                        <el-row v-if="scope.row.updateStatus">
                            <el-text v-if="scope.row.updateStatus == 'success'" type="success" size="small">
                                <el-icon>
                                    <CircleCheck />
                                </el-icon>修改成功
                            </el-text>
                            <el-text v-else-if="scope.row.updateStatus == 'fail'" type="danger" size="small"
                                truncated>
                                <el-tooltip :content="'修改出错：' + (scope.row.failMsg || '')" placement="top"
                                    :show-after="200">
                                    <span>修改出错：{{ scope.row.failMsg }}</span>
                                </el-tooltip>
                            </el-text>
                        </el-row>
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column property="title" label="标题">
            <template #default="scope">
                <div class="text-gray">{{ scope.row.title }}</div>
                <div>
                    <div class="textarea-wrap">
                        <el-input v-model="scope.row.newTitle" :rows="2" type="textarea" />
                        <div :class="{ red: getLength(scope.row.newTitle) > 60 }" class="ml-5">
                            {{ getLength(scope.row.newTitle) }}/60
                        </div>
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="185">
            <template #default="scope">
                <el-button size="small" type="success" plain @click="save(scope.row)"
                    :loading="scope.row.loading">
                    {{ scope.row.loading ? '保存中' : '保存修改' }}
                </el-button>
                <el-button size="small" plain @click="showDetails(scope.row.num_iid, scope.$index)">修改记录</el-button>
            </template>
        </el-table-column>
    </el-table>
    <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange"
        :current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper" :total="total">
    </el-pagination>
    <TitleListDetail ref="detailRef" :numIid="detailNumIid" @recovered="handleRecovered" />
</template>
<script setup>
import { ref, useTemplateRef } from 'vue'
import FormList from '../FormList.vue'
import TitleListDetail from './TitleListDetail.vue'
import { getItemWirelessUrl, getApproveStatus, getLength } from '@/utils/index'
import request from '@/utils/request'
import { useIndexMethod } from '@/composables/useIndexMethod'
import { CircleCheck } from '@element-plus/icons-vue'

const props = defineProps({
    quotaStatus: Object
})
const emit = defineEmits(['refreshQuota'])

// 排序
const sort = ref('')
const order = ref('')
const handleSortChange = (column) => {
    sort.value = column.prop
    order.value = column.order === 'ascending' ? 'asc' : 'desc'
}

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const handleCurrentChange = (val) => {
    currentPage.value = val
}
const handleSizeChange = (val) => {
    pageSize.value = val
}

// 数据查询完成
const tableData = ref([])
const handleLoaded = (data, totalNum) => {
    // 初始化标题编辑字段
    data.forEach(item => {
        item.newTitle = item.title
    })
    tableData.value = data
    total.value = totalNum
}

// 分页 index 递增
const indexMethod = (index) => {
    const { newIndex } = useIndexMethod(index, currentPage, pageSize)
    return newIndex.value
}

// 保存修改
const save = (row) => {
    if (row.newTitle == row.title) {
        ElMessage.error('标题未发生变化，无需修改')
        return
    }
    const len = getLength(row.newTitle)
    if (len > 60) {
        ElMessage.error('标题不能超过30个汉字或60个字符')
        return
    }
    ElMessageBox.confirm(
        '确定修改标题？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        }
    ).then(() => {
        doSave(row)
    }).catch(() => { })
}
const doSave = (row) => {
    row.loading = true
    request.post('/api/v1/batch-update-title/save-list-detail', {
        numIid: row.num_iid,
        newTitle: row.newTitle
    }).then(response => {
        row.loading = false
        const d = response.data
        if (d.code === 0 && d.data?.status === 'success') {
            row.updateStatus = 'success'
            row.title = row.newTitle
            ElMessage.success('保存成功')
            emit('refreshQuota')
        } else {
            row.updateStatus = 'fail'
            row.failMsg = d.data?.failMsg || d.msg || '保存失败'
            ElMessage.error(row.failMsg)
        }
    }).catch(() => {
        // 错误已由 request.js 拦截器提示，避免重复弹
        row.loading = false
    })
}

// 批量保存修改
const tableRef = useTemplateRef('tableRef')
const batchSaveLoading = ref(false)
const batchSave = () => {
    const selectionRows = tableRef.value.getSelectionRows()
    if (!selectionRows.length) {
        ElMessage.error('请选择需要修改的商品')
        return
    }
    for (let i = 0; i < selectionRows.length; i++) {
        if (selectionRows[i].newTitle == selectionRows[i].title) {
            ElMessage.error('第' + (i + 1) + '个选择项标题未发生变化，无需修改')
            return
        }
        const len = getLength(selectionRows[i].newTitle)
        if (len > 60) {
            ElMessage.error('第' + (i + 1) + '个选择项标题不能超过30个汉字或60个字符')
            return
        }
    }
    ElMessageBox.confirm(
        '即将修改<span class="h-b">' + selectionRows.length + '</span>个商品标题，确定保存修改？<br />提示：可在修改记录中查看和恢复数据',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info',
            dangerouslyUseHTMLString: true
        }
    ).then(() => {
        doBatchSave(selectionRows)
    }).catch(() => { })
}
const doBatchSave = (rows) => {
    batchSaveLoading.value = true
    request.post('/api/v1/batch-update-title/batch-save-list', {
        rows: rows.map(row => ({ numIid: row.num_iid, newTitle: row.newTitle }))
    }).then(response => {
        batchSaveLoading.value = false
        const d = response.data
        if (d.code === 0) {
            const data = d.data || {}
            const success = data.success || 0
            const fail = data.fail || 0
            ElMessageBox.alert(
                '成功修改<span class="h-b">' + success + '</span>个商品' + (fail > 0 ? '，出错<span class="h-b">' + fail + '</span>个商品' : ''),
                '提示',
                {
                    dangerouslyUseHTMLString: true,
                }
            )
            updateSaveStatus(data.result || [])
            tableRef.value.clearSelection()
            if (success > 0) {
                emit('refreshQuota')
            }
        } else {
            ElMessage.error(d.msg || '批量保存失败')
        }
    }).catch(() => {
        batchSaveLoading.value = false
    })
}
const updateSaveStatus = (result) => {
    result.forEach(val => {
        const index = getIndex(val.numIid)
        if (index > -1) {
            tableData.value[index].updateStatus = val.status
            tableData.value[index].failMsg = val.failMsg ?? null
            if (val.status === 'success') {
                tableData.value[index].title = tableData.value[index].newTitle
            }
        }
    })
}
const getIndex = (numIid) => {
    return tableData.value.findIndex(val => numIid == val.num_iid)
}

// 显示修改记录
const detailNumIid = ref()
const detailIndex = ref()
const detailRef = useTemplateRef('detailRef')
const showDetails = (numIid, index) => {
    detailNumIid.value = numIid
    detailIndex.value = index
    detailRef.value.dialogVisible = true
    detailRef.value.dialogTitle = '修改记录 | 商品ID：' + numIid
}

// 已恢复原标题
const handleRecovered = (recoveredTitle) => {
    const row = tableData.value[detailIndex.value]
    if (row) {
        row.title = recoveredTitle
        row.newTitle = recoveredTitle
    }
}
</script>
<style scoped>
.el-pagination {
    margin-top: 15px;
}

.textarea-wrap {
    display: flex;
    align-items: center;
}

/* 勾选列压内边距：45px 宽下 checkbox 完整显示 */
:deep(.col-check .cell) {
    padding: 0 2px;
}

.ml-5 {
    margin-left: 5px;
}

.red {
    color: #F56C6C;
}

.text-gray {
    color: #909399;
}
</style>
