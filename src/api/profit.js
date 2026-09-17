import request from '@/utils/request'

// 获取订单利润列表
export const getOrderProfitList = (params) => request({
  url: '/api/profit/list',
  method: 'get',
  params
})

// 获取订单利润汇总（不分页）
export const getOrderProfitSummary = (params) => request({
  url: '/api/profit/summary-data',
  method: 'get',
  params
})

// 获取利润汇总
export const getProfitSummary = (params) => request({
  url: '/api/profit/summary',
  method: 'get',
  params
})

// 调整成本
export const adjustCost = (data) => request({
  url: '/api/profit/adjust-cost',
  method: 'post',
  data
})

// 取消成本调整
export const cancelCostAdjust = (data) => request({
  url: '/api/profit/cancel-adjust',
  method: 'post',
  data
})

// 标记特殊订单
export const markSpecialOrder = (data) => request({
  url: '/api/profit/mark-special',
  method: 'post',
  data
})

// 获取订单支出明细
export const getOrderExpenseDetail = (tid) => request({
  url: '/api/profit/expense-detail',
  method: 'get',
  params: { tid }
})