// 页面访问统计上报
// 接口文档：docs/page-view-tracking-api.md
// 说明：navigator.sendBeacon 无法携带 Authorization，统一使用 fetch + keepalive
const TRACK_URL = '/api/v1/track/pageview'
// 同一页面 30 秒内只上报 1 次
const THROTTLE_MS = 30 * 1000

let lastPath = ''
let lastAt = 0

/**
 * 上报一次页面访问
 * @param {import('vue-router').RouteLocationNormalized} to 目标路由
 */
export const trackPageView = (to) => {
    // 未匹配到任何路由（404）不上报
    if (!to || !to.matched?.length) return

    // 只上报 path，不带 query / hash
    const path = (to.path || '').split('?')[0].split('#')[0]
    if (!path.startsWith('/')) return
    // 登录页不上报，避免游客路径污染数据
    if (path === '/login') return

    const now = Date.now()
    if (path === lastPath && now - lastAt < THROTTLE_MS) return
    lastPath = path
    lastAt = now

    const token = localStorage.getItem('token')
    if (!token) return

    try {
        void fetch(TRACK_URL, {
            method: 'POST',
            keepalive: true,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                path,
                title: to.meta?.title || document.title,
            }),
        }).catch(() => {
            // 上报失败静默忽略，不影响业务
        })
    } catch (e) {
        // fetch 同步异常同样静默忽略
    }
}
