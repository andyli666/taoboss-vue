<template>
    <el-menu :default-active="activeIndex" mode="horizontal" background-color="#4285f4" text-color="#fff"
        active-text-color="#ffd04b" @select="handleSelect" router>
        <el-menu-item index="/index" class="logo">
            <el-image
                src="https://img.alicdn.com/imgextra/i1/2218998426113/O1CN01LcSItl1v1oEwrOPVv_!!2218998426113.png" />
        </el-menu-item>
        <el-menu-item index="/index">首页</el-menu-item>
        <el-sub-menu index="recommend">
            <template #title>关联推荐</template>
            <el-menu-item index="/recommend/new">新建活动</el-menu-item>
            <el-menu-item index="/recommend/list">活动列表</el-menu-item>
            <el-menu-item index="/recommend/banner">免费海报下载</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="delist-optimize">
            <template #title>上下架时间优化</template>
            <el-menu-item index="/delist-optimize/new">新建优化任务</el-menu-item>
            <el-menu-item index="/delist-optimize/list">优化任务列表</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="item-timing-update-quantity">
            <template #title>定时修改库存</template>
            <el-menu-item index="/item-timing-update-quantity/new">新建任务</el-menu-item>
            <el-menu-item index="/item-timing-update-quantity/list">任务列表</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="finance">
            <template #title>财务</template>
            <el-menu-item index="/finance/profit">利润分析</el-menu-item>
            <el-menu-item index="/finance/costprice">成本价设置</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="widget">
            <template #title>小工具</template>
            <el-menu-item index="/widget/blacklist">黑名单设置</el-menu-item>
            <el-menu-item index="/widget/rate-auto-reply">评价自动回复</el-menu-item>
            <el-menu-item index="/widget/profit-calc">利润计算器</el-menu-item>
            <el-menu-item index="/widget/advice">意见反馈</el-menu-item>
        </el-sub-menu>
    </el-menu>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSellerStore } from '@/stores/seller'

const route = useRoute()
const activeIndex = computed(() => {
    return route.path
})

const handleSelect = (key, keyPath) => {
    console.log(key, keyPath)
}

const store = useSellerStore()
const router = useRouter()
onMounted(() => {
    // console.log('mounted')
    // console.log('store.isLoggedIn', store.isLoggedIn, store)
    // store.isLoggedIn && !store.sellerNick && store.fetchData()
    // let logged = sessionStorage.getItem('isLoggedIn')
    // if (logged) {
    //     !store.sellerNick && store.fetchData()
    // } else {
    //     router.push('/login')
    // }

})
</script>
<style scoped>
:deep(.logo img) {
    vertical-align: middle;
}
</style>