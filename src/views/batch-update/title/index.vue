<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>批量修改</el-breadcrumb-item>
        <el-breadcrumb-item>修改标题</el-breadcrumb-item>
    </el-breadcrumb>
    <BatchQuotaTip :quota-status="quotaStatus" />
    <el-tabs type="border-card" v-model="activeName">
        <!-- lazy：首次点击 tab 才渲染（加载数据），渲染后不销毁，切换不会重复加载 -->
        <el-tab-pane label="范围修改" name="shop" lazy>
            <TitleShopEdit :quotaStatus="quotaStatus" @refreshQuota="getQuotaStatus" />
        </el-tab-pane>
        <el-tab-pane label="列表修改" name="list" lazy>
            <TitleListEdit :quotaStatus="quotaStatus" @refreshQuota="getQuotaStatus" />
        </el-tab-pane>
    </el-tabs>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import BatchQuotaTip from '../BatchQuotaTip.vue'
import TitleListEdit from './TitleListEdit.vue'
import TitleShopEdit from './TitleShopEdit.vue'
import request from '@/utils/request'

const activeName = ref('shop')

// 版本限额状态（从 Go 后端动态获取）
const quotaStatus = reactive({ planName: '-', dailyLimit: 0, dailyUsed: 0, dailyRemain: 0, singleTaskCap: 0 })
const getQuotaStatus = () => {
    request.get('/api/v1/batch-update-title/quota-status').then(response => {
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

