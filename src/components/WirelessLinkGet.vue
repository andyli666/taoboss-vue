<template>
    <el-dialog v-model="dialogVisible" title="获取无线页面链接" width="850" :close-on-click-modal="false" @open="handleOpen">
        <el-input v-model="link" class="link-input">
            <template #prepend>链接：</template>
        </el-input>
        <el-tabs v-model="activeTabName" @tab-change="handleTabChange">
            <el-tab-pane label="商品链接" name="itemLink">
                <ItemSelect ref="singleTableRef" @row-click="handleItemTableRowClick" />
            </el-tab-pane>
            <el-tab-pane label="店铺首页" name="shop">
                <el-radio-group v-model="radioShop">
                    <el-table :data="tableDataShop" class="hide-table-header" @row-click="handleRowClickTableShop">
                        <el-table-column property="url" label="" width="30">
                            <template #default="scope">
                                <el-radio :value="scope.row.url"></el-radio>
                            </template>
                        </el-table-column>
                        <el-table-column property="text" label="" width="650" />
                    </el-table>
                </el-radio-group>
            </el-tab-pane>
            <el-tab-pane label="商品分类" name="category">商品分类</el-tab-pane>
            <el-tab-pane label="新品上架" name="new">
                <el-radio-group v-model="radioNew">
                    <el-table :data="tableDataNew" class="hide-table-header" @row-click="handleRowClickTableNew">
                        <el-table-column property="url" label="" width="30">
                            <template #default="scope">
                                <el-radio :value="scope.row.url"></el-radio>
                            </template>
                        </el-table-column>
                        <el-table-column property="text" label="" width="650" />
                    </el-table>
                </el-radio-group>
            </el-tab-pane>
        </el-tabs>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleConfirm">确定</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import axios from 'axios'
import { useSellerStore } from '@/stores/seller'

import ItemSelect from '../components/ItemSelect.vue'

//父组件可以控制对话框打开或关闭
const dialogVisible = ref(false)
defineExpose({
    dialogVisible
})

//
const link = ref('')
const activeTabName = ref('itemLink')
const handleTabChange = (name) => {
    console.log(name)
    console.log(activeTabName.value)
}

//抛出事件
const emit = defineEmits(['get-wireless-link'])
const handleConfirm = () => {
    dialogVisible.value = false
    emit('get-wireless-link', link.value.trim())
}

//对话框打开时
const handleOpen = () => {
    console.log('handleOpen')
}

//单选商品点击行时
const handleItemTableRowClick = (item) => {
    link.value = 'https://h5.m.taobao.com/awp/core/detail.htm?id=' + item.num_iid
}

//店铺首页
const radioShop = ref()
const tableDataShop = ref([])

const handleRowClickTableShop = (row) => {
    console.log('handleRowClickTableShop', row)
    if (row === null) {
        return
    }
    radioShop.value = row.url
    link.value = row.url
}

//新品链接
const radioNew = ref()
const tableDataNew = ref([])
const handleRowClickTableNew = (row) => {
    console.log('handleRowClickTableNew', row)
    if (row === null) {
        return
    }
    radioNew.value = row.url
    link.value = row.url
}

//订阅sellerStore
const sellerStore = useSellerStore()
sellerStore.$subscribe(() => {
    tableDataShop.value = [
        {
            url: `https://shop${sellerStore.sid}.m.taobao.com`,
            text: '店铺首页'
        }
    ]
    tableDataNew.value = [
        {
            url: `https://market.m.taobao.com/apps/market/shop/newarrival.html?_w&shopId=${sellerStore.sid}&sellerId=${sellerStore.sellerId}&shop_navi=newitems&displayShopHeader=true`,
            text: '新品链接'
        }
    ]
})
</script>
<style scoped>
.link-input {
    margin-top: 5px;
    margin-bottom: 10px;
}

:deep(.hide-table-header .el-table__header-wrapper) {
    display: none;
}

.dialog-footer {
    padding-right: 15px;
}
</style>