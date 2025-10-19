<template></template>
<script setup>
import request from '@/utils/request'
import { onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSellerStore } from '@/stores/seller'

// 登录验证callback url
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
    sessionStorage.setItem('isLoggedIn', true)
    sessionStorage.setItem('sellerType', user.seller_type)
    // ElMessage.success('登录成功')
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
    let url = ''
    let param = {}
    // console.log(route.query)
    // console.log(route.query.top_parameters)
    if (route.query.code) {
        url = '/api/auth/get-token-by-code'
        param.code = route.query.code
    } else if (route.query.top_parameters) {
        url = '/api/auth/get-token-by-top-parameters'
        param.top_parameters = route.query.top_parameters
    } else if (route.query.error_description) {
        document.body.innerHTML = route.query.error_description
        return
    } else {
        reAuth()
    }
    if (!url) {
        if (!sessionStorage.getItem('isLoggedIn')) {
            if (process.env.NODE_ENV == 'development') {
                router.push('/login')
            } else {
                reAuth()
            }
        }
        return
    }
    request.post(url, param).then(response => {
        if (response.data.status) {
            saveToken(response)
        } else {
            if (response.data.code == 401) {
                window.location.href = response.data.data.url
            }
            ElMessage.error(response.data.msg)
        }
    }).catch((error) => {
        ElMessage.error(error)
    })
}

const reAuth = () => {
    request.post('/api/auth/get-re-auth-url-ajax').then(response => {
        console.log('reAuth', response)
        window.location.href = response.data.data
    }).catch((error) => {
        ElMessage.error(error)
    })
}

onMounted(() => {
    auth()
})

</script>