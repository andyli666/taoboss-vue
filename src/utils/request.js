import axios from "axios"
import { router } from '@/router'
import { ElMessage, ElMessageBox } from 'element-plus'

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

// 401 提示节流：token 过期时多个请求并发/陆续返回 401，3 秒内只提示一次、跳转一次
let last401At = 0

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
                    localStorage.removeItem('token')
                    sessionStorage.setItem('redirectPath', router.currentRoute.value.path)
                    // 已在登录页：静默挂起（登录页上不应再有需要鉴权的请求提示）
                    if (router.currentRoute.value.path !== '/login' && Date.now() - last401At > 3000) {
                        last401At = Date.now()
                        ElMessage.error(data.msg ? data.msg : '登录已过期，请重新登录')
                        setTimeout(() => {
                            // router.push('/login')
                            if (process.env.NODE_ENV == 'development') {
                                router.push('/login')
                            } else {
                                reAuth()
                            }
                        }, 0) // 这个地方不能用1s，不然会发起多次请求，提示多次，需在第一个请求返回401时立即跳转到登录页面
                    }
                    // 挂起该请求的 Promise：组件的 catch 不会执行，
                    // 避免各组件再弹"加载xx数据失败"之类的重复提示（登录后重新加载）
                    return new Promise(() => {})
                case 403:
                    ElMessage.error('没有权限访问')
                    break
                case 404:
                    ElMessage.error('请求的资源不存在')
                    break
                case 500:
                    ElMessage.error('服务器内部错误')
                    break
                case 400:
                    // 版本限额超限（批量改价专属码 4031）：弹窗展示后端 msg（含版本、限额、当前数量），
                    // 提供「升级版本」按钮跳转订购页；挂起请求让组件静默，避免重复提示
                    if (data?.code === 4031) {
                        ElMessageBox.alert(data.msg, '版本限额提示', {
                            confirmButtonText: '我知道了',
                            cancelButtonText: '升级版本',
                            showCancelButton: true,
                            distinguishCancelAndClose: true,
                            type: 'warning',
                            callback: (action) => {
                                if (action === 'cancel') {
                                    window.open('https://fuwu.taobao.com/ser/detail.htm?service_code=ts-1816190&code=ts-1816190&selected_item_code=ts-1816190&isOpenSkuDialog=1', '_blank')
                                }
                            }
                        })
                        return new Promise(() => {})
                    }
                    ElMessage.error(data?.msg || data?.message || `连接错误 ${status}`)
                    break
                default:
                    ElMessage.error(data?.msg || data?.message || `连接错误 ${status}`)
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
