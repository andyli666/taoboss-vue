<template>
    <!-- <el-config-provider size="small"> -->
    <el-form :inline="true" :model="form" class="item-search-form" @submit.prevent style="width:100%">
        <el-form-item label="关键词或id">
            <el-input v-model="form.title" clearable @keyup.enter="getItems" />
        </el-form-item>
        <el-form-item>
            <el-button @click="getItems">查询</el-button>
        </el-form-item>
    </el-form>
    <el-radio-group v-model="radio">
        <el-table :data="tableData" @current-change="handleCurrentRowChange" @row-click="handleRowClick">
            <el-table-column property="num_iid" label="" width="55">
                <template #default="scope">
                    <el-radio :value="scope.row.num_iid"></el-radio>
                </template>
            </el-table-column>
            <el-table-column property="pic_url" label="商品" width="650">
                <template #default="scope">
                    <el-row>
                        <el-col :span="3">
                            <el-image :src="scope.row.pic_url + '_100x100xz.jpg'" style="width:50px;">
                                <template #error>&nbsp;</template>
                            </el-image>
                        </el-col>
                        <el-col :span="21">
                            <div>{{ scope.row.title }}</div>
                            <div>ID:{{ scope.row.num_iid }}</div>
                        </el-col>
                    </el-row>
                </template>
            </el-table-column>
            <el-table-column property="price" label="价格" />
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

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)// 每页显示的数据条数
const total = ref(0)// 总数据条数

const currentRow = ref()

const form = reactive({
    title: ''
})
const radio = ref()

const getItems = () => {
    request.post('/api/item/get-items', {
        title_contains: form.title,
        approve_status: form.approveStatus,
        page: currentPage.value,
        rows: pageSize.value,
        pagination: 1//远程分页
    }).then(response => {
        tableData.value = response.data.rows
        total.value = response.data.total
    }).catch((error) => {
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
</style>