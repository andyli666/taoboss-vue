import request from '@/utils/request'  // 根据您实际路径调整

/**
 * 获取订单统计数据
 * @param {Object} params 请求参数
 * @param {string} params.granularity - realtime/day/month/year
 * @param {string} params.start_date - 开始日期 (Y-m-d / Y-m / Y)
 * @param {string} params.end_date - 结束日期 (Y-m-d / Y-m / Y)
 * @param {string} params.time_field - pay_time / created (默认 pay_time)
 * @returns {Promise}
 */
export function getTradeStatistics(params) {
    return request({
        url: '/api/trade-statistics/get-statistics',
        method: 'get',
        params: params
    })
}

/**
 * 获取今日KPI数据（含环比）
 * @returns {Promise}
 */
export function getKpi() {
    return request({
        url: '/api/trade-statistics/kpi',
        method: 'get'
    })
}

// 获取订单同步状态
export function getSyncStatus() {
    return request({
        url: '/api/trade-init-task/sync-status',
        method: 'get'
    })
}