<template>
    <el-drawer v-model="feedbackDrawerVisible" title="意见反馈" direction="rtl">
        <div>
            <el-form :model="form" label-width="auto" style="max-width: 600px">
                <el-form-item label="问题描述" label-width="auto">
                    <el-input v-model="form.desc" type="textarea" maxlength="200"
                        placeholder="请详细描述您遇到的问题，有助于我们快速解决问题，比如：做什么操作时发生的问题；期望结果是什么？" show-word-limit />
                </el-form-item>
            </el-form>
            <div class="demo-drawer__footer">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" :loading="loading" @click="onSubmit">
                    {{ loading ? '提交中...' : '确认提交' }}
                </el-button>
            </div>
        </div>
    </el-drawer>
</template>
<script setup>
import { reactive, ref } from 'vue'
import request from '@/utils/request'

// 是否显示 Drawer
const feedbackDrawerVisible = ref(false)
defineExpose({
    feedbackDrawerVisible
})

const form = reactive({
    desc: '',
})

// 提交数据
const onSubmit = () => {

}

// 
const handleCancel = () => {
    feedbackDrawerVisible.value = false
}
</script>