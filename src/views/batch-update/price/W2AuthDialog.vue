<template>
    <el-dialog v-model="w2AuthVisible" title="淘宝授权提示" width="480" :close-on-click-modal="false"
        @closed="stopW2Check">
        <div class="w2-auth-tip">
            <p>改价接口为淘宝 W2 级权限，授权有效期为 <b>30 分钟</b>，当前授权已过期。</p>
            <p>请点击下方按钮重新授权，授权完成后系统将自动检测并继续操作。</p>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="w2AuthVisible = false">取消</el-button>
                <el-button type="primary" @click="goW2Auth">去授权</el-button>
                <el-button type="success" @click="checkW2Once(true)">我已完成授权</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { useW2Auth } from '@/utils/w2auth'

const { w2AuthVisible, checkW2Once, goW2Auth, stopW2Check } = useW2Auth()
</script>

<style scoped>
.w2-auth-tip {
    line-height: 1.8;
    color: #606266;
    font-size: 14px;
}
.w2-auth-tip b {
    color: #f56c6c;
}
</style>
