<template>
    <!-- <el-config-provider size="small"> -->
    <el-dialog v-model="dialogVisible" title="商品选择" width="1050" :close-on-click-modal="false" align-center draggable
        @open="handleOpen">
        <el-form :inline="true" :model="form" class="item-search-form" @submit.prevent style="width:100%">
            <el-form-item label="上架状态">
                <el-select v-model="form.approveStatus" style="width:180px">
                    <el-option label="全部" value="0" />
                    <el-option label="出售中的商品" value="onsale" />
                    <el-option label="仓库中的商品" value="instock" />
                </el-select>
            </el-form-item>
            <el-form-item label="店铺分类">
                <el-tree-select v-model="form.shopCategory" :data="data" multiple :render-after-expand="false"
                    show-checkbox style="width:180px" default-expand-all collapse-tags />
            </el-form-item>
            <el-form-item label="价格区间">
                <el-input-number v-model="form.priceStart" :min="0.01" :precision="2" controls-position="right"
                    style="width:100px" />
                &nbsp;到&nbsp;
                <el-input-number v-model="form.priceEnd" :min="0.01" :precision="2" controls-position="right"
                    style="width:100px" />
            </el-form-item>
            <el-form-item label="商品标题">
                <el-input v-model="form.title" placeholder="输入关键字" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;商品ID">
                <el-input-tag v-model="form.numIid" collapse-tags collapse-tags-tooltip placeholder="回车键分隔，最多100个"
                    clearable @change="handleInputTagChangeNumIid" @add-tag="handleAddTagNumIid" style="width:180px" />
            </el-form-item>
            <el-form-item label="商家编码">
                <el-input-tag v-model="form.outerId" collapse-tags collapse-tags-tooltip placeholder="回车键分隔，最多50个"
                    clearable @change="handleInputTagChangeOuterId" style="width:180px" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="getItems(true)" :loading="loading">查询</el-button>
            </el-form-item>
        </el-form>
        <el-table :data="tableData" :tree-props="treeProps" row-key="id" ref="multipleTableRef"
            @sort-change="handleSortChange">
            <el-table-column type="selection" width="40" :reserve-selection="true" :selectable="selectable" />
            <el-table-column label="商品" width="210">
                <template #default="scope">
                    <div class="item-cell">
                        <a v-if="scope.row.num_iid" :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank">
                            <el-image :src="scope.row.pic_url" style="width: 50px;">
                                <template #error>&nbsp;</template>
                            </el-image>
                        </a>
                        <div class="item-info">
                            <el-row v-if="scope.row.num_iid">ID:{{ scope.row.num_iid }}</el-row>
                            <el-row v-if="scope.row.num_iid">状态:{{ getApproveStatus(scope.row.approve_status) }}</el-row>
                            <el-row>商家编码:{{ scope.row.outer_id ?? '无' }}</el-row>
                        </div>
                    </div>
                </template>
            </el-table-column>
            <el-table-column property="title" label="标题" min-width="200" show-overflow-tooltip />
            <el-table-column property="price" label="价格" width="100" sortable="custom" />
            <el-table-column label="库存" width="90" prop="num" sortable="custom">
                <template #default="scope">
                    {{ scope.row.sku_id !== undefined ? scope.row.quantity : scope.row.num }}
                </template>
            </el-table-column>
            <el-table-column v-if="props.showDelistTime" property="delist_time" label="自动上下架时间" width="210"
                sortable="custom">
                <template #default="scope">
                    {{ scope.row.delist_time }}
                    [{{ getWeek(scope.row.delist_time) }}]
                </template>
            </el-table-column>
        </el-table>
        <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange" :current-page="currentPage"
            v-model:page-size="pageSize" :page-sizes="[10, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
            :total="total">
        </el-pagination>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleConfirm">确定</el-button>
            </div>
        </template>
    </el-dialog>
    <!-- </el-config-provider> -->
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import request from '@/utils/request'
import { deepCopy, getItemWirelessUrl, getWeek, getApproveStatus, isValidNumIid } from '@/utils/index'

const dialogVisible = ref(false)
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const sort = ref('')
const order = ref('')

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
    approveStatus: 'onsale',
    shopCategory: null,
    numIid: [],
    outerId: [],
    priceStart: null,
    priceEnd: null,
})

const props = defineProps({
    withSku: Boolean,
    forbidden‌Selections: Object,
    showDelistTime: Boolean
})

const loading = ref(false)

// 商品ID
const handleInputTagChangeNumIid = (val) => {
    // 去重
    const uniqueArray = [...new Set(val)]
    form.numIid = uniqueArray
    checkInputTagNumIid()
}
const checkInputTagNumIid = () => {
    if (form.numIid.length > 100) {
        ElMessage.error('最多输入100个商品ID，已超出' + (form.numIid.length - 100) + '个')
        return false
    }
    return true
}
const handleAddTagNumIid = (val) => {
    const valid = isValidNumIid(val)
    if (valid !== true) {
        form.numIid.pop()
        ElMessage.error(valid)
    }
}

// 商家编码
const handleInputTagChangeOuterId = (val) => {
    // 去重
    const uniqueArray = [...new Set(val)]
    form.outerId = uniqueArray
    checkInputTagOuterId()
}
const checkInputTagOuterId = () => {
    if (form.outerId.length > 50) {
        ElMessage.error('最多输入50个商家编码，已超出' + (form.outerId.length - 50) + '个')
        return false
    }
    return true
}

// refreshSync=true（用户主动点查询/首次打开弹窗）时后端强制增量同步淘宝商品，翻页/排序走 60s 节流同步
const getItems = (refreshSync = false) => {
    if (!checkInputTagNumIid()) {
        return
    }
    if (!checkInputTagOuterId()) {
        return
    }
    loading.value = true
    request.post('/api/v1/item/get-items', {
        title: form.title,
        approveStatus: form.approveStatus,
        shopCategory: form.shopCategory,
        numIid: form.numIid,
        outerId: form.outerId,
        priceStart: form.priceStart,
        priceEnd: form.priceEnd,
        page: currentPage.value,
        rows: pageSize.value,
        with_sku: props.withSku ? 1 : 0,
        sort: sort.value,
        order: order.value,
        refreshSync,
    }).then(response => {
        loading.value = false
        tableData.value = formatItems(response.data.data.rows)
        total.value = response.data.data.total
    }).catch(() => {
        // 错误已由 request.js 拦截器提示
        loading.value = false
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
                    child.price = sku.price
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
                // const rowTmp = []
                const rowTmp = {}
                rowTmp.id = row.id
                rowTmp.num_iid = row.num_iid
                rowTmp.pic_url = row.pic_url
                rowTmp.title = row.title
                rowTmp.num = row.num
                const childrenTmp = []
                if (row.children.length) {
                    row.children.forEach((child) => {
                        if (selectedSkuIds.includes(child.sku_id)) {
                            const childTmp = {}
                            childTmp.id = child.id
                            childTmp.num_iid = child.num_iid
                            childTmp.parent_id = child.parent_id
                            childTmp.pic_url = child.pic_url
                            childTmp.quantity = child.quantity
                            childTmp.sku_id = child.sku_id
                            childTmp.title = child.title
                            childrenTmp.push(childTmp)
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

watch(
    () => props.forbidden‌Selections,
    () => {
        getItems()
    }
)

const selectable = (row) => {
    if (props.forbidden‌Selections === undefined) {
        return true
    } else {
        return !props.forbidden‌Selections.includes(row.num_iid)
    }
}

// 排序
const handleSortChange = (column) => {
    if (!column.order) {
        // 第三次点击列头取消排序，恢复默认（后端按 id ASC）
        sort.value = ''
        order.value = ''
    } else {
        sort.value = column.prop
        order.value = column.order === 'ascending' ? 'asc' : 'desc'
    }
    getItems()
}

//
// 首次打开弹窗才加载商品列表和店铺分类（多次打开只加载一次，翻页/排序/查询仍会重新请求）
let hasLoaded = false
const handleOpen = () => {
    if (!hasLoaded) {
        hasLoaded = true
        getItems(true)
        getSellerCats()
    }
}
const data = ref([])
// 获取店铺分类
const getSellerCats = () => {
    request.post('/api/item/sellercats-list-get', { with_root: 1, v: 1 }).then(response => {
        if (response.data.msg !== undefined) {
            ElMessage.error(`获取店铺分类出错：${response.data.msg}`)
        } else {
            data.value = response.data
        }
    }).catch(() => {
        // 错误已由 request.js 拦截器提示
    })
}
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

/* 商品列：图片 + 右侧信息 */
.item-cell {
    display: flex;
    align-items: flex-start;
    gap: 8px;
}

.item-info {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    line-height: 1.6;
    color: #909399;
    word-break: break-all;
}
</style>