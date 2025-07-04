<template>
    <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" background-color="#545c64"
        text-color="#fff" active-text-color="#ffd04b" @select="handleSelect" router>
        <el-menu-item index="1">Processing Center</el-menu-item>
        <el-sub-menu index="5">
            <template #title>关联推荐</template>
            <el-menu-item index="/related-recommendations/new">新建活动</el-menu-item>
            <el-menu-item index="5-2">活动列表</el-menu-item>
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
import { ref, onMounted } from 'vue'
import { useSellerStore } from '@/stores/seller'

const activeIndex = ref('1')
const handleSelect = (key, keyPath) => {
    console.log(key, keyPath)
}

const store = useSellerStore()

onMounted(() => {
    store.fetchData()
})
</script>
