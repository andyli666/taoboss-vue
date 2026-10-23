import { ref } from 'vue'

/**
 * 订阅到期状态（套餐到期前 7 天预警）
 */
export function useSubscriptionStatus() {
    const trialDays = ref(0)
    const planName = ref('')

    // 计算剩余天数（小数向上取整，剩 1.1 天也显示 2 天）
    const computeDays = (deadline) => {
        if (!deadline) return 0
        const d = new Date(deadline)
        const diff = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24))
        return diff > 0 ? diff : 0
    }

    // 从 localStorage 加载用户订阅信息
    const loadUserInfo = () => {
        try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const user = JSON.parse(userStr)
                trialDays.value = computeDays(user.subscribe_deadline)
            }
        } catch (e) {
            // ignore
        }
    }

    // 当前是否处于预警期：0 < 剩余天数 <= 7
    const isWarningPeriod = () => trialDays.value > 0 && trialDays.value <= 7

    // 当天是否已经提示过（localStorage 去重）
    const warnedKey = 'sub_warned_date'
    const isWarnedToday = () => localStorage.getItem(warnedKey) === todayStr()
    const markWarnedToday = () => localStorage.setItem(warnedKey, todayStr())
    const clearWarned = () => localStorage.removeItem(warnedKey)
    const todayStr = () => {
        const d = new Date()
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    }

    // 从后端拉 planName（复用 quota-status 接口）
    const loadPlanName = async () => {
        try {
            const { default: request } = await import('@/utils/request')
            const res = await request.get('/api/v1/batch-update-price/quota-status')
            planName.value = res.data?.data?.planName || ''
        } catch (e) {
            // Go 后端未启动时静默忽略
        }
    }

    // 完整初始化
    const init = async () => {
        loadUserInfo()
        await loadPlanName()
    }

    return {
        trialDays,
        planName,
        isWarningPeriod,
        isWarnedToday,
        markWarnedToday,
        clearWarned,
        init,
    }
}