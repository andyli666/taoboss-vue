<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>批量修改</el-breadcrumb-item>
        <el-breadcrumb-item>修改SKU名称</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="mtb-15">
        <el-alert title="" type="info" show-icon :closable="false">
            <div>
                当前版本<span class="h-b">{{ quotaStatus.planName }}</span>，
                批量改SKU名称单次任务限额<span class="h-b">{{ quotaStatus.singleTaskCap > 0 ? quotaStatus.singleTaskCap + '个商品' : '不限' }}</span>，
                <template v-if="quotaStatus.dailyLimit > 0">
                    单日累计限额<span class="h-b">{{ quotaStatus.dailyLimit }}</span>个，
                    已用<span class="h-b">{{ quotaStatus.dailyUsed }}</span>，
                    剩余<span class="h-b">{{ quotaStatus.dailyRemain }}</span>
                </template>
                <template v-else>
                    今日不限量
                </template>
            </div>
        </el-alert>
    </div>
    <el-tabs type="border-card" v-model="activeName">
        <!-- lazy：首次点击 tab 才渲染（加载数据），渲染后不销毁，切换不会重复加载 -->
        <el-tab-pane label="范围修改" name="shop" lazy>
            <SkuPropNameShopEdit :quotaStatus="quotaStatus" @refreshQuota="getQuotaStatus" />
        </el-tab-pane>
        <el-tab-pane label="列表修改" name="list" lazy>
            <SkuPropNameListEdit :quotaStatus="quotaStatus" @refreshQuota="getQuotaStatus" />
        </el-tab-pane>
    </el-tabs>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import SkuPropNameListEdit from './SkuPropNameListEdit.vue'
import SkuPropNameShopEdit from './SkuPropNameShopEdit.vue'
import request from '@/utils/request'

const activeName = ref('shop')

// 版本限额状态（从 Go 后端动态获取）
const quotaStatus = reactive({ planName: '-', dailyLimit: 0, dailyUsed: 0, dailyRemain: 0, singleTaskCap: 0 })
const getQuotaStatus = () => {
    request.get('/api/v1/batch-update-sku-prop-name/quota-status').then(response => {
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

<style scoped>
.mtb-15 {
    margin: 15px 0;
}

.h-b {
    font-weight: bold;
    color: #409EFF;
}
</style>
