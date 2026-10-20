<template>
    <el-form :inline="true" :model="form" class="item-search-form" style="width:100%">
        <el-form-item label="上架状态">
            <el-select v-model="form.approveStatus" style="width:180px" ref="approveStatusRef">
                <el-option label="全部" value="0" />
                <el-option label="出售中的商品" value="onsale" />
                <el-option label="仓库中的商品" value="instock" />
            </el-select>
        </el-form-item>
        <el-form-item label="店铺分类">
            <el-tree-select v-model="form.shopCategory" :data="data" multiple :render-after-expand="false" show-checkbox
                style="width:180px" default-expand-all collapse-tags ref="shopCategoryRef" />
        </el-form-item>
        <el-form-item label="价格区间">
            <el-input-number v-model="form.priceStart" :min="0.01" :precision="2" controls-position="right"
                style="width:100px" />
            &nbsp;到&nbsp;
            <el-input-number v-model="form.priceEnd" :min="0.01" :precision="2" controls-position="right"
                style="width:100px" />
        </el-form-item>
        <div>
            <el-form-item label="标题包含">
                <el-input v-model="form.title" placeholder="输入关键字" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="标题排除">
                <el-input-tag v-model="form.exceptTitle" collapse-tags collapse-tags-tooltip
                    placeholder="请输入关键字，回车键分隔，最多150个" clearable @change="handleInputTagChangeExceptTitle"
                    style="width:300px" />
            </el-form-item>
        </div>
        <div>
            <el-form-item label="指定商品">
                <el-input-tag v-model="form.numIid" collapse-tags collapse-tags-tooltip
                    placeholder="请选择或输入商品ID，回车键分隔，最多5000个" clearable @change="handleInputTagChangeNumIid"
                    @add-tag="handleAddTagNumIid" style="width:300px" />
                <el-button type="primary" plain size="small" @click="itemSelectRefNumIid.dialogVisible = true"
                    class="ml-5">选择商品</el-button>
            </el-form-item>
            <el-form-item label="排除商品">
                <el-input-tag v-model="form.exceptNumIid" collapse-tags collapse-tags-tooltip
                    placeholder="请选择或输入商品ID，回车键分隔，最多5000个" clearable @change="handleInputTagChangeExceptNumIid"
                    style="width:300px" />
                <el-button type="primary" plain size="small" @click="itemSelectRefExceptNumIid.dialogVisible = true"
                    class="ml-5">选择商品</el-button>
            </el-form-item>
        </div>
    </el-form>
    <ItemsSelect ref="itemSelectRefNumIid" @get-selection-items="getSelectionItemsNumIid" />
    <ItemsSelect ref="itemSelectRefExceptNumIid" @get-selection-items="getSelectionItemsExceptNumIid" />
</template>
<script setup>
import { reactive, ref, onMounted, useTemplateRef, watch } from 'vue'
import request from '@/utils/request'
import { isValidNumIid } from '@/utils/index'

const form = reactive({
    title: '',
    approveStatus: 'onsale',
    shopCategory: null,
    numIid: [],
    exceptNumIid: [],
    exceptTitle: [],
    priceStart: null,
    priceEnd: null,
})

// 指定商品
const handleInputTagChangeNumIid = (val) => {
    // 去重
    const uniqueArray = [...new Set(val)]
    form.numIid = uniqueArray
    checkInputTagNumIid()
}
const checkInputTagNumIid = () => {
    if (form.numIid.length > 5000) {
        ElMessage.error('最多输入5000个商品ID，已超出' + (form.numIid.length - 5000) + '个')
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

// 排除商品
const handleInputTagChangeExceptNumIid = (val) => {
    // 去重
    const uniqueArray = [...new Set(val)]
    form.exceptNumIid = uniqueArray
    checkInputTagExceptNumIid()
}
const checkInputTagExceptNumIid = () => {
    if (form.exceptNumIid.length > 5000) {
        ElMessage.error('最多输入5000个商家编码，已超出' + (form.exceptNumIid.length - 5000) + '个')
        return false
    }
    return true
}

// 标题排除
const handleInputTagChangeExceptTitle = (val) => {
    // 去重
    const uniqueArray = [...new Set(val)]
    form.exceptTitle = uniqueArray
    checkInputTagExceptTitle()
}
const checkInputTagExceptTitle = () => {
    if (form.exceptTitle.length > 150) {
        ElMessage.error('最多输入150个关键字，已超出' + (form.exceptTitle.length - 150) + '个')
        return false
    }
    return true
}

const props = defineProps({
    withSku: Boolean
})

async function getItems() {
    if (!checkInputTagNumIid()) {
        return
    }
    if (!checkInputTagExceptNumIid()) {
        return
    }
    if (!checkInputTagExceptTitle()) {
        return
    }
    const params = {
        with_sku: props.withSku ? 1 : 0
    }
    try {
        const response = await request.post('/api/item/get-items', { ...form, ...params })
        return formatItems(response.data.rows)
    } catch (error) {
        ElMessage.error(error)
    }
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
        item.newTitle = item.title
        newItems.push(item)
    })
    return newItems
}

defineExpose({
    getItems,
    form
})

//
onMounted(() => {
    getSellerCats()
})

const data = ref([])
// 获取店铺分类
const getSellerCats = () => {
    request.post('/api/item/sellercats-list-get', { with_root: 1, v: 1 }).then(response => {
        if (response.data.msg !== undefined) {
            ElMessage.error(`获取店铺分类出错：${response.data.msg}`)
        } else {
            data.value = response.data
        }
    }).catch((error) => {
        ElMessage.error(error)
    })
}

// 表单改变事件
const emit = defineEmits(['form-change'])
watch(form, () => {
    emit('form-change')
})

// 选择商品
const itemSelectRefNumIid = useTemplateRef('itemSelectRefNumIid')
const itemSelectRefExceptNumIid = useTemplateRef('itemSelectRefExceptNumIid')
const getSelectionItemsNumIid = (items) => {
    form.numIid = items.map(val => {
        return val.num_iid
    })
}
const getSelectionItemsExceptNumIid = (items) => {
    form.exceptNumIid = items.map(val => {
        return val.num_iid
    })
}
</script>
<style scoped>
.item-search-form .el-select {
    --el-select-width: 100px;
}
</style>