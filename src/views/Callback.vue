<template>
</template>
<script setup>
// import { ref } from 'vue'
import request from '@/utils/request'
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSellerStore } from '@/stores/seller'

const route = useRoute()
const router = useRouter()
const store = useSellerStore()

const saveToken = (response) => {
    const { token: authToken, user } = response.data.data
    store.isLoggedIn = true
    store.sellerId = user.seller_id
    store.sid = user.sid
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(user))
    // sessionStorage.setItem('isLoggedIn', 1)
    ElMessage.success('登录成功')
    const redirectPath = sessionStorage.getItem('redirectPath')
    // console.log('loginredirectPath',redirectPath)
    if (redirectPath) {
        sessionStorage.removeItem('redirectPath');
        router.push(redirectPath);
    } else {
        router.push('/index')
    }
}

const auth = () => {
    let url
    let param = {}
    if (route.query.code) {
        url = '/api/auth/get-token-by-code'
        param.code = route.query.code
    } else if (route.query.top_parameters) {
        url = '/api/auth/get-token-by-top-parameters'
        param.top_parameters = route.query.top_parameters
    } else {
        ElMessage.error('参数非法')
    }
    request.get(url, param).then(response => {
        if (response.data.status) {
            saveToken(response)
        } else {
            if (response.data.code == 401) {
                location.href = response.data.data.url
            }
            ElMessage.error(response.data.msg)
        }
    }).catch((error) => {
        ElMessage.error(error)
    })
}

onMounted(() => {
    auth()
})

</script>