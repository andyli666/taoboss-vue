<template>
    <el-drawer v-model="visible" title="意见反馈" direction="rtl">
        <el-tabs v-model="activeName">
            <el-tab-pane label="我要反馈" name="new">
                <div>
                    <el-form :model="form" label-width="auto" style="max-width: 600px">
                        <el-form-item label="问题描述" label-width="auto">
                            <el-input v-model="form.desc" type="textarea" maxlength="200" :rows="5"
                                placeholder="请详细描述您遇到的问题，有助于我们快速解决问题，比如：做什么操作时发生的问题；期望结果是什么？" show-word-limit />
                        </el-form-item>
                    </el-form>
                    <div>
                        <el-button @click="handleCancel">取消</el-button>
                        <el-button type="primary" :loading="loading" @click="onSubmit">
                            {{ loading ? '提交中...' : '确认提交' }}
                        </el-button>
                    </div>
                </div>
            </el-tab-pane>
            <el-tab-pane label="反馈记录" name="detail">
                <!-- <el-descriptions title="" :column="1" direction="vertical" border>
                    <el-descriptions-item
                        label="">kooriookamikooriookamikooriookamikooriookamikooriookamikooriookami</el-descriptions-item>
                    <el-descriptions-item label="">18100000000</el-descriptions-item>
                </el-descriptions> -->
                <div v-for="detail in details">
                    <div>{{ detail.desc }}</div>
                    <el-divider content-position="left">{{ detail.datetime }}</el-divider>
                </div>
            </el-tab-pane>
        </el-tabs>
    </el-drawer>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import request from '@/utils/request'

// 是否显示 Drawer
const visible = ref(false)
defineExpose({
    visible
})

// 表单
const form = reactive({
    desc: '',
})

//
const activeName = ref('new')
const loading = ref(false)

// 提交数据
const onSubmit = () => {
    form.desc = form.desc.trim()
    if (!form.desc) {
        ElMessage.error('请输入问题描述')
        return
    }
    loading.value = true
    request.post('/api/feedback/new', {
        desc: form.desc
    }).then(response => {
        if (response.data.status) {
            ElMessage.success('提交成功，感谢你帮助我们变得更好。')
            getDetails()
            activeName.value = 'detail'
        }
        loading.value = false
    }).catch((error) => {
        ElMessage.error(error)
        loading.value = false
    })
}

// 反馈列表
const details = ref([])
const getDetails = () => {
    request.post('/api/feedback/get-details', {
    }).then(response => {
        if (response.data.status) {
            details.value = response.data.data
        }
    }).catch((error) => {
        ElMessage.error(error)
    })
}

// 隐藏 Drawer
const handleCancel = () => {
    visible.value = false
}

onMounted(() => {
    getDetails()
})
</script>