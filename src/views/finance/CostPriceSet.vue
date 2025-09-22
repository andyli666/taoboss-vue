<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>财务 </el-breadcrumb-item>
        <el-breadcrumb-item>成本价设置</el-breadcrumb-item>
    </el-breadcrumb>
    <el-form :inline="true" :model="form" class="item-search-form" @submit.prevent style="width:100%">
        <el-form-item label="关键词或id">
            <el-input v-model="form.title" clearable @keyup.enter="getItems" />
        </el-form-item>
        <el-form-item label="上架状态">
            <el-select v-model="form.approveStatus">
                <el-option label="全部" value="0" />
                <el-option label="出售中" value="onsale" />
                <el-option label="仓库中" value="instock" />
            </el-select>
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="getItems">查询</el-button>
        </el-form-item>
    </el-form>
    <el-table :data="tableData" row-key="id" style="width: 100%" ref="tableRef" @row-click="handleRowClick">
        <el-table-column property="pic_url" label="主图" width="100">
            <template #default="scope">
                <a :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank" @click.stop>
                    <el-image :src="scope.row.pic_url" style="width: 50px;">
                        <template #error>&nbsp;</template>
                    </el-image>
                </a>
            </template>
        </el-table-column>
        <el-table-column property="num_iid" label="ID/SKUID" width="150">
            <template #default="scope">
                <span v-if="scope.row.children">{{ scope.row.num_iid }}</span>
                <span v-else>{{ scope.row.sku_id }}</span>
            </template>
        </el-table-column>
        <el-table-column property="title" label="标题/SKU" />
        <el-table-column prop="cost_price" label="成本价" width="150">
            <template #default="{ row }">
                <div v-if="!row.children || row.children.length === 0">
                    <div v-if="row.editing" class="editable-cell">
                        <el-input-number v-model="row.costPrice" :min="0" :precision="2" size="small"
                            @blur="finishEdit(row)" @keyup.enter="finishEdit(row)" controls-position="right" />
                    </div>
                    <div v-else @click="startEdit(row, 'costPrice')" class="editable-cell">
                        {{ row.costPrice ? Number(row.costPrice).toFixed(2) : '' }}
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
            <template #default="{ row, $index }">
                <div v-if="!row.children || row.children.length === 0">
                    <el-button v-if="!row.editing" type="primary" link size="small"
                        @click="startEdit(row)">编辑</el-button>
                    <el-button v-else type="primary" link size="small" @click="finishEdit(row)">完成</el-button>
                </div>
            </template>
        </el-table-column>
    </el-table>
    <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange" :current-page="currentPage"
        v-model:page-size="pageSize" :page-sizes="[10, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
        :total="total">
    </el-pagination>
</template>
<script setup>
import { ref, reactive, useTemplateRef } from 'vue'
import request from '@/utils/request'
import { getItemWirelessUrl } from '@/utils/index'

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const form = reactive({
    title: '',
    approveStatus: '0',
})
const getItems = () => {
    request.post('/api/item/get-items', {
        title_contains: form.title,
        approve_status: form.approveStatus,
        page: currentPage.value,
        rows: pageSize.value,
        with_sku: 1,
        pagination: 1, //远程分页
        with_cost_price: 1
    }).then(response => {
        tableData.value = formatItems(response.data.rows)
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
const formatItems = (items) => {
    const newItems = []
    items.forEach(item => {
        const children = []
        if (item.skus.length) {
            item.skus.forEach((sku, index) => {
                const child = []
                child.sku_id = sku.sku_id
                child.id = item.num_iid + '_' + index // 表格row-key用
                child.num_iid = ""
                child.pic_url = ""
                child.title = sku.properties_name.replaceAll(/\d+:/g, "")
                child.parent_id = item.num_iid
                child.quantity = sku.quantity
                if (sku.cost_price !== null) {
                    child.costPrice = sku.cost_price
                }
                children.push(child)
            })
        } else {
            item.costPrice = item.cost_price
        }
        item.children = children
        item.id = item.num_iid // 表格row-key用
        newItems.push(item)
    })
    return newItems
}

//单元格可编辑
const editingRow = ref(null)
const editingField = ref(null)
// 开始编辑
const startEdit = (row, field = null) => {
    // 如果已经有正在编辑的行，先完成编辑
    if (editingRow.value && editingRow.value !== row) {
        finishEdit(editingRow.value)
    }

    if (!row.children || row.children.length === 0) {
        row.editing = true
        editingRow.value = row
        editingField.value = field
    }
}

// 完成编辑
const finishEdit = async (row) => {
    if (!row.children || row.children.length === 0) {
        if (row.costPrice !== undefined) {
            row.costPrice = Number(row.costPrice.toFixed(2))
            //保存到服务器
            await request.post('/api/finance-cost-price/save', {
                numIid: row.parent_id ? row.parent_id : row.num_iid,
                skuId: row.sku_id,
                costPrice: row.costPrice
            }).then(response => {
                if (response.data.status) {
                    row.editing = false
                    editingRow.value = null
                    editingField.value = null
                    ElMessage.success('修改已保存')
                } else {
                    ElMessage.error(response.data.msg)
                }
            }).catch((error) => {
                ElMessage.error(error)
            })
        } else {
            row.editing = false
            editingRow.value = null
            editingField.value = null
        }
    }
}

//单击行展开行
const tableRef = useTemplateRef('tableRef')
const handleRowClick = (row, column, event) => {
    // 调用表格实例的toggleRowExpansion方法，切换当前行的展开状态
    tableRef.value.toggleRowExpansion(row);
};
</script>
<style scoped>
.el-form {
    margin-top: 40px
}

.item-search-form .el-select {
    --el-select-width: 100px;
}

.el-pagination {
    margin-top: 16px;
}

.editable-cell {
    cursor: pointer;
    min-height: 20px;
    /* padding: 1px; */
    transition: all 0.3s;
}
</style>