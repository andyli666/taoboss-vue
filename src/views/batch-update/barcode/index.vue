<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>批量修改</el-breadcrumb-item>
        <el-breadcrumb-item>修改条形码</el-breadcrumb-item>
    </el-breadcrumb>
    <BatchQuotaTip :quota-status="quotaStatus" />
    <el-tabs type="border-card" v-model="activeName" class="mt-15">
        <!-- lazy：首次点击 tab 才渲染，渲染后不销毁 -->
        <el-tab-pane label="范围修改" name="shop" lazy>
            <BarcodeShopEdit :quotaStatus="quotaStatus" @refreshQuota="getQuotaStatus" />
        </el-tab-pane>
        <el-tab-pane label="列表修改" name="list" lazy>
            <BarcodeListEdit @refreshQuota="getQuotaStatus" />
        </el-tab-pane>
    </el-tabs>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import BatchQuotaTip from '../BatchQuotaTip.vue'
import BarcodeShopEdit from './BarcodeShopEdit.vue'
import BarcodeListEdit from './BarcodeListEdit.vue'
import request from '@/utils/request'

const activeName = ref('shop')

// 版本限额状态（从后端动态获取）
const quotaStatus = reactive({ planName: '-', dailyLimit: 0, dailyUsed: 0, dailyRemain: 0, singleTaskCap: 0 })

const getQuotaStatus = () => {
    request.get('/api/v1/batch-update-barcode/quota-status').then(response => {
        Object.assign(quotaStatus, response.data.data)
    }).catch((error) => {
        console.warn('获取版本限额失败', error)
    })
}

onMounted(() => {
    getQuotaStatus()
})
</script>

<style scoped>
.mt-15 {
    margin-top: 15px;
}
</style>
