import request from '@/utils/request'

// 导入支付宝流水
export const importAlipay = (formData) => request({
    url: '/api/expense/import-alipay',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
})

// 导入微信支付流水
export const importWechat = (formData) => request({
    url: '/api/expense/import-wechat',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
})

// 获取支出列表
export const getExpenseList = (params) => request({
    url: '/api/expense/list',
    method: 'get',
    params
})

// 获取订单支出统计
export const getOrderExpenseStatistics = (tid) => request({
    url: '/api/expense/order-statistics',
    method: 'get',
    params: { tid }
})

// 检查是否有支出记录
export const checkExpenseHasRecords = () => request({
    url: '/api/expense/has-records',
    method: 'get'
})

// 获取最近导入记录
export const getImportHistory = (params) => request({
    url: '/api/expense/import-history',
    method: 'get',
    params
})