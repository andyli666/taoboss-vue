import request from '@/utils/request'

// 获取批量修改功能使用统计（日维度）
export const getUsageStatsDaily = (params) => request({
    url: '/api/v1/usage-stats/daily',
    method: 'get',
    params
})
