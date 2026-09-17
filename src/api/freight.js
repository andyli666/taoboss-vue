import request from '@/utils/request'

// 配置
export const getFreightConfig = () => request({ url: '/api/freight/config', method: 'get' })
export const saveFreightConfig = (data) => request({ url: '/api/freight/config', method: 'post', data })

// 价格规则
export const getPriceRules = (params) => request({ url: '/api/freight/price-rules', method: 'get', params })
export const savePriceRule = (data) => request({ url: '/api/freight/price-rule', method: 'post', data })
export const deletePriceRule = (id) => request({ url: '/api/freight/price-rule', method: 'delete', params: { id } })

// 导入
export const importAlipay = (formData) => request({ url: '/api/freight/import-alipay', method: 'post', data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
export const importExpress = (formData) => request({ url: '/api/freight/import-express', method: 'post', data: formData, headers: { 'Content-Type': 'multipart/form-data' } })

// 报表
export const getFreightStatistics = (params) => request({ url: '/api/freight/statistics', method: 'get', params })
export const getFreightList = (params) => request({ url: '/api/freight/list', method: 'get', params })

// 检查运费是否已配置
export const checkFreightConfigured = () => request({
    url: '/api/freight/check-configured',
    method: 'get'
})