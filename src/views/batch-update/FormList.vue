<template>
    <el-form :inline="true" :model="form" class="item-search-form" style="width:100%">
        <el-form-item label="上架状态">
            <el-select v-model="form.approveStatus" style="width:180px">
                <el-option label="全部" value="0" />
                <el-option label="出售中的商品" value="onsale" />
                <el-option label="仓库中的商品" value="instock" />
            </el-select>
        </el-form-item>
        <el-form-item label="店铺分类">
            <el-tree-select v-model="form.shopCategory" :data="data" multiple :render-after-expand="false" show-checkbox
                style="width:180px" default-expand-all collapse-tags />
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
            <el-input-tag v-model="form.numIid" collapse-tags collapse-tags-tooltip placeholder="回车键分隔，最多100个" clearable
                @change="handleInputTagChangeNumIid" @add-tag="handleAddTagNumIid" style="width:180px" />
        </el-form-item>
        <el-form-item label="商家编码">
            <el-input-tag v-model="form.outerId" collapse-tags collapse-tags-tooltip placeholder="回车键分隔，最多50个" clearable
                @change="handleInputTagChangeOuterId" style="width:180px" />
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="getItems(true)" :loading="loading" :icon="Search">
                {{ loading ? '查询中...' : '查询' }}
            </el-button>
        </el-form-item>
    </el-form>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from 'vue'
import request from '@/utils/request'
import { Search } from '@element-plus/icons-vue'
import { isValidNumIid } from '@/utils/index'

const form = reactive({
    title: '',
    approveStatus: 'onsale',
    shopCategory: null,
    numIid: [],
    outerId: [],
    priceStart: null,
    priceEnd: null,
})

// 商品ID
const handleInputTagChangeNumIid = (val) => {
    // 去重
    const uniqueArray = [...new Set(val)]
    form.numIid = uniqueArray
    checkInputTagNumIid()
}
const checkInputTagNumIid = () => {
    if (form.numIid.length > 100) {
        ElMessage.error('最多输入100个商品ID，已超出' + (form.outerId.length - 100) + '个')
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

const props = defineProps({
    withSku: Boolean,
    currentPage: Number,
    pageSize: Number,
    sort: String,
    order: String
})

const emit = defineEmits(['loaded'])

const loading = ref(false)
// refreshSync=true（用户主动点查询/首次进入页面）时后端强制增量同步淘宝商品，翻页/排序走 60s 节流同步
const getItems = (refreshSync = false) => {
    if (!checkInputTagNumIid()) {
        return
    }
    if (!checkInputTagOuterId()) {
        return
    }
    loading.value = true
    // setTimeout(() => {
    //     loading.value = false
    // }, 1000)
    // console.log(form)
    const params = {
        page: props.currentPage,
        rows: props.pageSize,
        with_sku: props.withSku ? 1 : 0,
        sort: props.sort,
        order: props.order,
        pagination: 1,
        refreshSync
    }
    // console.log({ ...form, ...params })
    // emit('loaded', [], 0)
    // return
    request.post('/api/v1/item/get-items', { ...form, ...params }).then(response => {
        loading.value = false
        const data = response.data.data
        emit('loaded', formatItems(data.rows), data.total)
    }).catch(() => {
        // 错误已由 request.js 拦截器提示，避免重复弹
        loading.value = false
    })
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
        item.newTitle = item.title
        item.newShoppingTitle = item.shopping_title // 导购标题编辑字段（批量改导购标题列表修改用）
        newItems.push(item)
    })
    return newItems
}

watch(() => props.sort, () => { getItems() })
watch(() => props.order, () => { getItems() })
watch(() => props.currentPage, () => { getItems() })
watch(() => props.pageSize, () => { getItems() })


//
onMounted(() => {
    getItems(true)
    getSellerCats()
})

// 供父组件通过 ref 调用（script setup 组件默认封闭，需显式暴露）
defineExpose({ getItems })


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
        // 错误已由 request.js 拦截器提示，避免重复弹
    })
}
</script>
<style scoped>
.item-search-form .el-select {
    --el-select-width: 100px;
}
</style>