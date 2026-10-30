import request from '@/utils/request'

// 获取页面访问统计（仅管理员，日期 × 用户 × 页面）
export const getPageViewStats = (params) => request({
    url: '/api/v1/usage-stats/page-views',
    method: 'get',
    params
})
