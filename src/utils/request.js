import axios from "axios"
import { router } from '@/router'

const request = axios.create({
    // baseURL: process.env.VUE_APP_API_BASE_URL || '/api',
    timeout: 60000,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'application/json;charset=UTF-8'
    }
})

// 请求拦截器
request.interceptors.request.use(
    (config) => {
        // 如果是FormData，删除Content-Type让浏览器自动设置
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type']
        }
        const token = localStorage.getItem('token')
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        // 对请求错误做些什么
        ElMessage.error(error)
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    function (response) {
        // console.log('response:', response)
        return response
    },
    function (error) {
        // 对响应错误做点什么
        console.log('响应错误:', error)
        if (error.response) {
            // 服务器返回了错误状态码
            const { status, data } = error.response
            // console.log('data:', data)
            switch (status) {
                case 401:
                    ElMessage.error(data.msg ? data.msg : '登录已过期，请重新登录')
                    //   store.dispatch('user/logout')
                    localStorage.removeItem('token')
                    sessionStorage.setItem('redirectPath', router.currentRoute.value.path)
                    // console.log('redirectPath', router, router.currentRoute, router.currentRoute.value.path)
                    setTimeout(() => {
                        // router.push('/login')
                        if (process.env.NODE_ENV == 'development') {
                            router.push('/login')
                        } else {
                            reAuth()
                        }
                    }, 0) // 这个地方不能用1s，不然会发起多次请求，提示多次，需在第一个请求返回401时立即跳转到登录页面
                    // }, 1000)
                    break
                case 403:
                    ElMessage.error('没有权限访问')
                    break
                case 404:
                    ElMessage.error('请求的资源不存在')
                    break
                case 500:
                    ElMessage.error('服务器内部错误')
                    break
                default:
                    ElMessage.error(data?.message || `连接错误 ${status}`)
            }
        } else if (error.request) {
            // 请求已发出但没有收到响应
            ElMessage.error('网络连接异常，请检查网络设置')
        } else {
            ElMessage.error('请求配置错误')
        }
        return Promise.reject(error)
    }
)

export default request
