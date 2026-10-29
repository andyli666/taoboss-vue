<template>
    <!-- <el-config-provider size="small"> -->
    <el-form :inline="true" :model="form" class="item-search-form" @submit.prevent style="width:100%">
        <el-form-item label="关键词或商品ID">
            <el-input v-model="form.title" clearable @keyup.enter="getItems" />
        </el-form-item>
        <el-form-item>
            <el-button @click="getItems" :loading="loading">{{ loading ? '查询中...' : '查询' }}</el-button>
        </el-form-item>
    </el-form>
    <el-radio-group v-model="radio" class="item-select-table">
        <el-table :data="tableData" style="width: 100%" @current-change="handleCurrentRowChange" @row-click="handleRowClick" size="small" highlight-current-row :loading="loading">
            <el-table-column property="num_iid" label="" width="50">
                <template #default="scope">
                    <el-radio :value="scope.row.num_iid"></el-radio>
                </template>
            </el-table-column>
            <el-table-column property="pic_url" label="主图" width="75">
                <template #default="scope">
                    <a :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank" @click.stop>
                        <el-image :src="scope.row.pic_url + '_100x100xz.jpg'" style="width:50px;">
                            <template #error>&nbsp;</template>
                        </el-image>
                    </a>
                </template>
            </el-table-column>
            <el-table-column label="商品信息" min-width="400">
                <template #default="scope">
                    <div class="item-info">
                        <el-link :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank" type="primary"
                            :underline="false" @click.stop>
                            {{ scope.row.title }}
                        </el-link>
                        <div class="text-gray">
                            ID: {{ scope.row.num_iid }}
                            <span class="outer-id">商家编码: {{ scope.row.outer_id ?? '无' }}</span>
                        </div>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="状态" width="65" align="center">
                <template #default="scope">
                    <el-text class="item-status"
                        :type="scope.row.approve_status === 'onsale' || scope.row.approve_status === 4 || scope.row.approve_status === '4' ? 'success' : 'info'">
                        {{ getApproveStatus(scope.row.approve_status) }}
                    </el-text>
                </template>
            </el-table-column>
            <el-table-column property="price" label="价格" width="100" align="center" />
            <el-table-column property="num" label="总库存" width="65" align="center" />
            <el-table-column property="delist_time" label="下架时间" width="160" align="center" />
        </el-table>
    </el-radio-group>
    <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange" :current-page="currentPage"
        v-model:page-size="pageSize" :page-sizes="[10, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
        :total="total">
    </el-pagination>
    <!-- </el-config-provider> -->
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import request from '@/utils/request'
import { getItemWirelessUrl, getApproveStatus } from '@/utils/index'

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)// 每页显示的数据条数
const total = ref(0)// 总数据条数

const currentRow = ref()

const form = reactive({
    title: ''
})
const radio = ref()

const loading = ref(false)
const getItems = () => {
    loading.value = true
    request.post('/api/item/get-items', {
        title_contains: form.title,
        approve_status: form.approveStatus,
        page: currentPage.value,
        rows: pageSize.value,
        pagination: 1//远程分页
    }).then(response => {
        loading.value = false
        tableData.value = response.data.rows
        total.value = response.data.total
    }).catch((error) => {
        loading.value = false
        ElMessage.error(error)
    })
}
const handleCurrentChange = (val) => {
    currentPage.value = val
    getItems()
}
const handleSizeChange = (val) => {
    getItems()
}

const emit = defineEmits(['selection-item-change', 'row-click'])
const handleCurrentRowChange = (row) => {
    if (row === null) {
        return
    }
    currentRow.value = row
    radio.value = row.num_iid
    emit('selection-item-change', currentRow.value)
}
const handleRowClick = (row) => {
    if (row === null) {
        return
    }
    radio.value = row.num_iid
    emit('row-click', row)
}


const clearSelect = () => {
    radio.value = ''
}
defineExpose({
    clearSelect,
    radio
})


onMounted(() => getItems())
</script>
<style scoped>
.el-form-item {
    margin-right: 5px;
    margin-bottom: 5px;
}

.el-pagination {
    margin-top: 16px;
}

.item-select-table {
    display: block;
    width: 100%;
}

.item-info {
    min-width: 0;
    font-size: 12px;
    line-height: 1.6;
    color: #909399;
    text-align: left;
    overflow-wrap: anywhere;
}

.item-info :deep(.el-link) {
    display: flex;
    justify-content: flex-start;
    height: auto;
    font-size: 12px;
    white-space: normal;
    text-align: left;
}

.item-info :deep(.el-link__inner) {
    white-space: normal;
    overflow-wrap: anywhere;
    text-align: left;
}

.item-status {
    font-size: 12px;
}

.text-gray {
    color: #909399;
}

.outer-id {
    margin-left: 12px;
}
</style>