import request from '@/utils/request'

// 获取商品销售分析数据
export const getItemSalesAnalysis = (params) => request({
    url: '/api/stat/item-sales-analysis',
    method: 'get',
    params
})

// 获取快递发货量统计
export const getExpressShipmentStat = (params) => request({
    url: '/api/stat/express-shipment',
    method: 'get',
    params
})

// 获取商品退款分析数据
export const getItemRefundAnalysis = (params) => request({
    url: '/api/stat/item-refund-analysis',
    method: 'get',
    params
})

// 获取订单销售趋势数据
export const getOrderSalesTrend = (params) => request({
    url: '/api/stat/order-sales-trend',
    method: 'get',
    params
})

// 获取商品销量排行
export const getItemRanking = (params) => request({
    url: '/api/stat/item-ranking',
    method: 'get',
    params
})

// 获取商品销售趋势
export const getItemSalesTrend = (params) => request({
    url: '/api/stat/item-sales-trend',
    method: 'get',
    params
})

// 获取地区销售对比数据
export const getRegionSalesAnalysis = (params) => request({
    url: '/api/stat/region-sales-analysis',
    method: 'get',
    params
})