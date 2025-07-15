<template>
    <el-dialog v-model="dialogVisible" title="获取无线页面链接" width="850" :close-on-click-modal="false" @open="handleOpen">
        <el-input v-model="link" class="link-input">
            <template #prepend>链接：</template>
        </el-input>
        <el-tabs v-model="activeTabName" @tab-change="handleTabChange">
            <el-tab-pane label="商品链接" name="itemLink">
                <ItemSelect @row-click="handleItemTableRowClick" ref="refItemSelect" />
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
            <el-tab-pane label="商品分类" name="category">
                <SellerCatSelect @row-click="handleSellerCatTableRowClick" ref="refSellerCatSelect" />
            </el-tab-pane>
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
import { ref, computed, useTemplateRef } from 'vue'
import { useSellerStore } from '@/stores/seller'
import { getItemWirelessUrl, getSellerCatWirelessUrl } from '../utils/index'

import ItemSelect from '@/components/ItemSelect.vue'
import SellerCatSelect from '@/components/SellerCatSelect.vue'

//父组件可以控制对话框打开或关闭
const dialogVisible = ref(false)
const link = ref('')
defineExpose({
    dialogVisible,
    link
})

//
const currentItemId = ref()
const currentShopCatCid = ref()
const refItemSelect = useTemplateRef('refItemSelect')
const refSellerCatSelect = useTemplateRef('refSellerCatSelect')
//
const activeTabName = ref('itemLink')
const handleTabChange = (name) => {
    switch (name) {
        case 'new':
            if (link.value != radioNew.value) {
                radioNew.value = ''
            }
            break;
        case 'shop':
            if (link.value != radioShop.value) {
                radioShop.value = ''
            }
            break;
        case 'itemLink':
            if (link.value != getItemWirelessUrl(currentItemId.value)) {
                refItemSelect.value.clearSelect()
            }
            break;
        case 'category':
            if (link.value != getSellerCatWirelessUrl(shopId.value, sellerId.value, currentShopCatCid.value)) {
                refSellerCatSelect.value.clearSelect()
            }
            break;
    }
}

//抛出事件
const emit = defineEmits(['get-wireless-link'])
const handleConfirm = () => {
    dialogVisible.value = false
    emit('get-wireless-link', link.value.trim())
}

//对话框打开时
const handleOpen = () => {
    console.log('handleOpen',link.value)
}

//单选商品点击行时
const handleItemTableRowClick = (item) => {
    currentItemId.value = item.num_iid
    link.value = getItemWirelessUrl(item.num_iid)
}

const shopId = ref()
const sellerId = ref()
//单选店铺分类点击行时
const handleSellerCatTableRowClick = (item) => {
    currentShopCatCid.value = item.id
    link.value = getSellerCatWirelessUrl(shopId.value, sellerId.value, item.id)
}

//店铺首页
const radioShop = ref()
const handleRowClickTableShop = (row) => {
    if (row === null) {
        return
    }
    radioShop.value = row.url
    link.value = row.url
}

//新品链接
const radioNew = ref()
const handleRowClickTableNew = (row) => {
    if (row === null) {
        return
    }
    radioNew.value = row.url
    link.value = row.url
}

//订阅sellerStore
const sellerStore = useSellerStore()
shopId.value = sellerStore.sid
sellerId.value = sellerStore.sellerId
sellerStore.$subscribe(() => {
    shopId.value = sellerStore.sid
    sellerId.value = sellerStore.sellerId
})

const tableDataShop = computed(() => {
    return [
        {
            url: `https://shop${shopId.value}.m.taobao.com`,
            text: '店铺首页'
        }
    ]
})
const tableDataNew = computed(() => {
    return [
        {
            url: `https://market.m.taobao.com/apps/market/shop/newarrival.html?_w&shopId=${shopId.value}&sellerId=${sellerId.value}&shop_navi=newitems&displayShopHeader=true`,
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