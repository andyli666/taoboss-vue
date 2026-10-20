import { ref } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

// W2 授权预检（改价 API 为淘宝 W2 级权限，授权有效期 w2_expires_in=1800 秒，不能刷新，仅重新授权重置）
// 模块级单例状态：授权弹窗全局唯一，多个入口（开始修改 / 恢复 / 重试）共用

const w2AuthVisible = ref(false)
const w2AuthUrl = ref('')
let w2CheckTimer = null
let w2CheckStart = 0
let passCallback = null // 授权通过后自动继续的回调
const W2_CHECK_TIMEOUT = 10 * 60 * 1000 // 授权检测超时：10 分钟

/**
 * 预检 W2 授权：有效返回 true；过期弹授权弹窗并轮询，授权成功后自动执行 onPass
 * @param {Function} onPass 授权通过后自动继续的回调
 */
export const ensureW2Auth = async (onPass) => {
    try {
        const response = await request.get('/api/v1/batch-update-price/check-w2-auth')
        const st = response.data.data
        if (st.valid) return true
        passCallback = onPass
        w2AuthUrl.value = st.authUrl || ''
        w2AuthVisible.value = true
        startW2Check()
        return false
    } catch (error) {
        // 预检失败不阻塞改价（任务执行中还有 W2 失效兜底）
        return true
    }
}

const startW2Check = () => {
    stopW2Check()
    w2CheckStart = Date.now()
    w2CheckTimer = setInterval(() => {
        if (Date.now() - w2CheckStart > W2_CHECK_TIMEOUT) {
            stopW2Check()
            w2AuthVisible.value = false
            ElMessage.error('检测授权超时，请重新操作')
            return
        }
        checkW2Once(false)
    }, 3000)
}

// 检查一次授权状态；manual=true 时给出用户操作反馈
export const checkW2Once = async (manual) => {
    try {
        const response = await request.get('/api/v1/batch-update-price/check-w2-auth')
        const st = response.data.data
        if (st.valid) {
            stopW2Check()
            w2AuthVisible.value = false
            ElMessage.success('授权成功，继续执行')
            if (passCallback) {
                const cb = passCallback
                passCallback = null
                cb()
            }
            return
        }
        if (manual) ElMessage.warning('尚未检测到新授权，请完成授权后重试')
    } catch (error) {
        if (manual) ElMessage.error('检测授权状态失败')
    }
}

export const goW2Auth = () => {
    if (!w2AuthUrl.value) {
        ElMessage.warning('未配置授权地址，请通过原有的淘宝授权入口重新授权')
        return
    }
    window.open(w2AuthUrl.value, '_blank')
}

export const stopW2Check = () => {
    if (w2CheckTimer) {
        clearInterval(w2CheckTimer)
        w2CheckTimer = null
    }
}

export function useW2Auth() {
    return { w2AuthVisible, w2AuthUrl, ensureW2Auth, checkW2Once, goW2Auth, stopW2Check }
}
