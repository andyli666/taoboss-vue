<!-- 开发时需登录测试账号才能获取远端数据 -->
<template>
    <el-dialog v-model="dialogFormVisible" title="登录" width="500" :close-on-click-modal="false">
        <el-form :model="form" :rules="rules" ref="formRef" style="width:100%">
            <el-form-item label="用户名" prop="username" :label-width="formLabelWidth">
                <el-input v-model="form.username" autocomplete="on" clearable @keyup.enter="submitForm(formRef)" />
            </el-form-item>
            <el-form-item label="密码" prop="password" :label-width="formLabelWidth">
                <el-input v-model="form.password" autocomplete="on" show-password clearable
                    @keyup.enter="submitForm(formRef)" />
            </el-form-item>
        </el-form>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="submitForm(formRef)">确定</el-button>
                <el-button @click="resetForm(formRef)">重置</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { reactive, ref, useTemplateRef } from 'vue'
import request from '@/utils/request'
import { useRouter } from 'vue-router'
import { useSellerStore } from '@/stores/seller'

const dialogFormVisible = ref(true)
const formLabelWidth = '80px'

const form = reactive({
    username: '',
    password: ''
})
const formRef = useTemplateRef('formRef')

const rules = reactive({
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 15, message: '字符个数3~15', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 3, max: 18, message: '字符个数3~18', trigger: 'blur' }
    ]
})

const submitForm = async (formEl) => {
    if (!formEl) return
    await formEl.validate((valid, fields) => {
        if (valid) {
            login()
        } else {
            ElMessage.error('表单验证出错')
        }
    })
}
const router = useRouter()
const store = useSellerStore()
const login = () => {
    request.post('/api/dev-login/index', form).then(response => {
        if (response.data.status) {
            const { token: authToken, user } = response.data.data
            store.isLoggedIn = true
            store.sellerId = user.seller_id
            store.sid = user.sid
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(user))
            sessionStorage.setItem('isLoggedIn', 1)
            ElMessage.success('登录成功')
            const redirectPath = sessionStorage.getItem('redirectPath')
            console.log('loginredirectPath',redirectPath)
            if (redirectPath) {
                sessionStorage.removeItem('redirectPath');
                router.push(redirectPath);
            } else {
                router.push('/index')
            }
            // router.push('/recommend/new')
        } else {
            ElMessage.error(response.data.msg)
        }
    }).catch((error) => {
        ElMessage.error(error)
    })
}

const resetForm = (formEl) => {
    if (!formEl) return
    formEl.resetFields()
}

</script>
