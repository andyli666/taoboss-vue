<template>
    <div class="mtb-15">
        <el-alert title="" type="info" show-icon :closable="false">
            <div class="quota-line">
                <!-- <span class="h-b">{{ planText }}</span>
                <span class="quota-sep">·</span> -->
                <span v-if="dailyLimit > 0">
                    今日可修改商品数：已用
                    <span class="h-b">{{ formatNum(dailyUsed) }} / 共 {{ formatNum(dailyLimit) }}</span> 个
                </span>
                <span v-else>今日不限量</span>
                <span class="quota-sep">·</span>
                <span>
                    <span v-if="scopeLabel">「{{ scopeLabel }}」</span>单次最多修改
                    <span class="h-b">{{ singleTaskText }}</span>
                </span>
                <template v-if="dailyLimit > 0">
                    <span class="quota-sep">·</span>
                    <span>
                        如需处理更多，请<span class="quota-upgrade" @click="handleUpgrade">升级软件</span>
                    </span>
                </template>
            </div>
        </el-alert>
    </div>
</template>

<script setup>
import { computed, inject } from 'vue'

const props = defineProps({
    // 版本限额状态：{ planName, singleTaskCap, dailyLimit, dailyUsed, dailyRemain }
    quotaStatus: { type: Object, required: true },
    // 单次任务限额的作用范围（对应页面 tab 名称）；传空字符串则不显示范围
    scopeLabel: { type: String, default: '范围修改' },
})

// 数字千分位（兼容后端返回字符串）
const formatNum = (num) => {
    const n = Number(num)
    return Number.isFinite(n) ? n.toLocaleString('zh-CN') : num
}

// 版本名称：保证以「版」结尾
const planText = computed(() => {
    const name = props.quotaStatus.planName
    if (!name || name === '-' || name === '0') return '-'
    return name.endsWith('版') ? name : name + '版'
})

// 单次任务限额
const singleTaskText = computed(() => {
    const cap = Number(props.quotaStatus.singleTaskCap)
    return cap > 0 ? formatNum(cap) + ' 个商品' : '不限'
})

// 单日累计限额（0 表示不限）
const dailyLimit = computed(() => Number(props.quotaStatus.dailyLimit) || 0)
const dailyUsed = computed(() => props.quotaStatus.dailyUsed)

// 复用顶部菜单的「版本区别」升级弹窗
const openRenewDialog = inject('openRenewDialog', () => {})
const handleUpgrade = () => openRenewDialog()
</script>

<style scoped>
.mtb-15 {
    margin: 15px 0;
}

.h-b {
    font-weight: bold;
    color: #409EFF;
}

.quota-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
}

.quota-sep {
    color: #c0c4cc;
}

.quota-upgrade {
    color: #f46615;
    font-weight: bold;
    cursor: pointer;
}

.quota-upgrade:hover {
    text-decoration: underline;
}
</style>
