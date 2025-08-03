<template>
    <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" background-color="#4285f4"
        text-color="#fff" active-text-color="#ffd04b" @select="handleSelect" router>
        <el-menu-item index="/">首页</el-menu-item>
        <el-sub-menu index="5">
            <template #title>关联推荐</template>
            <el-menu-item index="/related-recommendations/new">新建活动</el-menu-item>
            <el-menu-item index="/related-recommendations/list">活动列表</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="6">
            <template #title>定时修改库存</template>
            <el-menu-item index="/item-timing-update-quantity/new">新建任务</el-menu-item>
            <el-menu-item index="/item-timing-update-quantity/list">任务列表</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="2">
            <template #title>Workspace</template>
            <el-menu-item index="2-1">item one</el-menu-item>
            <el-menu-item index="2-2">item two</el-menu-item>
            <el-menu-item index="2-3">item three</el-menu-item>
            <el-sub-menu index="2-4">
                <template #title>item four</template>
                <el-menu-item index="2-4-1">item one</el-menu-item>
                <el-menu-item index="2-4-2">item two</el-menu-item>
                <el-menu-item index="2-4-3">item three</el-menu-item>
            </el-sub-menu>
        </el-sub-menu>
        <el-menu-item index="3" disabled>Info</el-menu-item>
        <el-menu-item index="4">Orders</el-menu-item>
    </el-menu>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSellerStore } from '@/stores/seller'

const route = useRoute()
const activeIndex = computed(() => {
    return route.path
})

const handleSelect = (key, keyPath) => {
    console.log(key, keyPath)
}

const store = useSellerStore()

onMounted(() => {
    console.log('mounted')
    console.log('store.isLoggedIn', store.isLoggedIn, store)
    store.isLoggedIn && !store.sellerNick && store.fetchData()
})
</script>
