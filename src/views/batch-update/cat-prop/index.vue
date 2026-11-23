<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>批量修改</el-breadcrumb-item>
        <el-breadcrumb-item>修改类目属性</el-breadcrumb-item>
    </el-breadcrumb>
    <BatchQuotaTip :quota-status="quotaStatus" scope-label="" />
    <CatPropShopEdit :quotaStatus="quotaStatus" @refreshQuota="getQuotaStatus" />
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import BatchQuotaTip from '../BatchQuotaTip.vue'
import CatPropShopEdit from './CatPropShopEdit.vue'
import request from '@/utils/request'

// 版本限额状态（从 Go 后端动态获取）
const quotaStatus = reactive({ planName: '-', dailyLimit: 0, dailyUsed: 0, dailyRemain: 0, singleTaskCap: 0 })
const getQuotaStatus = () => {
    request.get('/api/v1/batch-update-cat-prop/quota-status').then(response => {
        const d = response.data.data
        Object.assign(quotaStatus, d)
    }).catch((error) => {
        console.warn('获取版本限额失败', error)
    })
}

onMounted(() => {
    getQuotaStatus()
})
</script>

