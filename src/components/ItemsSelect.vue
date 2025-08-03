<template>
    <!-- <el-config-provider size="small"> -->
    <el-dialog v-model="dialogVisible" title="商品选择" width="850" :close-on-click-modal="false">
        <el-form :inline="true" :model="form" class="item-search-form" @submit.prevent>
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
        <el-table :data="tableData" :tree-props="treeProps" row-key="id" ref="multipleTableRef">
            <el-table-column type="selection" width="55" :reserve-selection="true" />
            <el-table-column property="pic_url" label="主图" width="100">
                <template #default="scope">
                    <a :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank">
                        <el-image :src="scope.row.pic_url" style="width: 50px;">
                            <template #error>&nbsp;</template>
                        </el-image>
                    </a>
                </template>
            </el-table-column>
            <el-table-column property="num_iid" label="ID" width="150" />
            <el-table-column property="title" label="标题" />
        </el-table>
        <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange" :current-page="currentPage"
            v-model:page-size="pageSize" :page-sizes="[10, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
            :total="total">
        </el-pagination>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleConfirm">
                    确定
                </el-button>
            </div>
        </template>
    </el-dialog>
    <!-- </el-config-provider> -->
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'
import { deepCopy } from '../utils/index'
import { getItemWirelessUrl } from '../utils/index'

const dialogVisible = ref(false)
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)// 每页显示的数据条数
const total = ref(0)// 总数据条数

const multipleTableRef = ref()

const treeProps = reactive({
    checkStrictly: false,
})

defineExpose({
    dialogVisible
})

const formLabelWidth = '100px'

const form = reactive({
    title: '',
    approveStatus: '0',
})

const props = defineProps({
    withSku: Boolean
})

const getItems = () => {
    axios.post('/api/Item/getItems', {
        title_contains: form.title,
        approve_status: form.approveStatus,
        page: currentPage.value,
        rows: pageSize.value,
        with_sku: props.withSku ? 1 : 0,
        pagination: 1//远程分页
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
    console.log(`${val} items per page`)
    getItems()
}

const formatItems = (items) => {
    const newItems = []
    items.forEach(item => {
        if (props.withSku) {
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
                    children.push(child)
                })
            }
            item.children = children
        }
        item.id = item.num_iid // 表格row-key用
        newItems.push(item)
    })
    return newItems
}

const emit = defineEmits(['get-selection-items'])

const handleConfirm = () => {
    dialogVisible.value = false
    const selectionRows = multipleTableRef.value.getSelectionRows()
    const selectionRowsCopied = deepCopy(selectionRows)

    if (!props.withSku) {
        emit('get-selection-items', selectionRowsCopied)
        return
    }

    const rows = []
    //由于返回的sku也是作为单独的行，导致sku重复选择了，需要单独处理下
    if (selectionRowsCopied.length) {
        //如果父节点未选中，则需要手动添加父节点
        selectionRowsCopied.forEach(row => {
            if (row.sku_id !== undefined) {
                let parentFinded = findParent(row.parent_id, selectionRowsCopied)
                if (!parentFinded) {
                    const parent = getParent(row.parent_id)
                    selectionRowsCopied.push(parent)
                }
            }
        })
        //获取所有选中的skuId
        const selectedSkuIds = []
        selectionRowsCopied.forEach(row => {
            if (row.sku_id !== undefined) {
                selectedSkuIds.push(row.sku_id)
            }
        })
        //去掉children中不在选中的sku
        selectionRowsCopied.forEach(row => {
            if (row.sku_id === undefined) {//不是sku行，是商品行
                const rowTmp = []
                rowTmp.id = row.id
                rowTmp.num_iid = row.num_iid
                rowTmp.pic_url = row.pic_url
                rowTmp.title = row.title
                rowTmp.num = row.num
                const childrenTmp = []
                if (row.children.length) {
                    row.children.forEach((child, index) => {
                        if (selectedSkuIds.includes(child.sku_id)) {
                            childrenTmp.push(child)
                        }
                    })
                }
                rowTmp.children = childrenTmp
                rowTmp.has_sku = row.skus.length ? 1 : 0 //标记这个商品是否包含sku（不包含sku的可以单独修改商品的库存，否则不能）
                rows.push(rowTmp)
            }
        })
    }
    emit('get-selection-items', rows)
}

//在选中行中查找父节点
const findParent = (parent_id, rows) => {
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].num_iid == parent_id) {
            return rows[i]
        }
    }
}
//从表格中获取某个sku行的父节点
const getParent = (parent_id) => {
    for (let i = 0; i < tableData.value.length; i++) {
        if (tableData.value[i].num_iid == parent_id) {
            return deepCopy(tableData.value[i])
        }
    }
}

//
onMounted(() => {
    getItems()
})
</script>
<style scoped>
.item-search-form .el-select {
    --el-select-width: 100px;
}

.el-pagination {
    margin-top: 16px;
}

.dialog-footer {
    padding-right: 15px;
}
</style>