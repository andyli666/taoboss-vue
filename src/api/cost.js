import request from '@/utils/request'

/**
 * 获取商品列表
 * @param {Object} params 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.page_size - 每页数量
 * @param {string} params.num_iid - 商品ID（可选）
 * @param {string} params.title - 商品标题（可选）
 * @param {string} params.status - 商品状态：onsale/instock（可选）
 * @param {string} params.cost_status - 成本状态：set/notSet（可选）
 * @returns {Promise}
 */
export function getItemList(params) {
  return request({
    url: '/api/cost/items',
    method: 'get',
    params: {
      page: params.page,
      page_size: params.pageSize,
      num_iid: params.num_iid,
      title: params.title,
      status: params.status,
      cost_status: params.costStatus
    }
  })
}

/**
 * 获取SKU列表
 * @param {Object} params 查询参数
 * @param {string} params.num_iid - 商品ID
 * @returns {Promise}
 */
export function getSkuList(params) {
  return request({
    url: '/api/cost/skus',
    method: 'get',
    params: {
      num_iid: params.num_iid
    }
  })
}

/**
 * 获取成本历史
 * @param {Object} params 查询参数
 * @param {string} params.num_iid - 商品ID
 * @param {string} params.type - 类型：item（商品级别）/ sku（SKU级别）
 * @returns {Promise}
 */
export function getCostHistory(params) {
  return request({
    url: '/api/cost/history',
    method: 'get',
    params: {
      num_iid: params.num_iid,
      type: params.type
    }
  })
}

/**
 * 保存商品/SKU成本
 * @param {Object} data 成本数据
 * @param {string} data.num_iid - 商品ID
 * @param {string|null} data.sku_id - SKU ID（商品级别时为null）
 * @param {number} data.cost_price - 成本价
 * @param {string} data.effective_date - 生效日期（YYYY-MM-DD）
 * @param {string|null} data.expire_date - 失效日期（可选，留空表示长期有效）
 * @returns {Promise}
 */
export function saveCost(data) {
  return request({
    url: '/api/cost/save',
    method: 'post',
    data: {
      num_iid: data.num_iid,
      sku_id: data.sku_id,
      cost_price: data.cost_price,
      effective_date: data.effective_date,
      expire_date: data.expire_date
    }
  })
}

/**
 * 删除成本记录
 * @param {Object} params 参数
 * @param {number} params.id - 成本记录ID
 * @returns {Promise}
 */
export function deleteCost(params) {
  return request({
    url: '/api/cost/delete',
    method: 'delete',
    params: {
      id: params.id
    }
  })
}

/**
 * 批量导入商品成本
 * @param {FormData} formData - 包含Excel文件的FormData
 * @returns {Promise}
 */
export function batchImportCost(formData) {
  return request({
    url: '/api/cost/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 下载商品成本导入模板
 * @returns {void} 直接下载文件
 */
export function exportCostTemplate() {
  return request({
    url: '/api/cost/export-template?t=' + Date.now(),
    method: 'get',
    responseType: 'blob'  // 重要：设置响应类型为 blob
  }).then(response => {
    // 创建下载链接
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '商品成本导入模板.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }).catch(error => {
    console.error('导出模板失败:', error)
    ElMessage.error('导出模板失败')
  })
}

/**
 * 获取商品成本配置（用于订单统计页面获取成本）
 * @param {Object} params 查询参数
 * @param {string} params.num_iid - 商品ID
 * @param {string|null} params.sku_id - SKU ID（可选）
 * @param {string} params.target_date - 目标日期（YYYY-MM-DD）
 * @returns {Promise}
 */
export function getItemCost(params) {
  return request({
    url: '/api/cost/get',
    method: 'get',
    params: {
      num_iid: params.num_iid,
      sku_id: params.sku_id,
      target_date: params.target_date
    }
  })
}

/**
 * 批量获取商品成本（用于订单同步）
 * @param {Object} data 请求数据
 * @param {Array} data.items - 商品列表 [{ num_iid, sku_id }]
 * @param {string} data.target_date - 目标日期（YYYY-MM-DD）
 * @returns {Promise}
 */
export function batchGetItemCost(data) {
  return request({
    url: '/api/cost/batch-get',
    method: 'post',
    data: {
      items: data.items,
      target_date: data.target_date
    }
  })
}

// 检查是否有配置商品成本
export const checkCostHasRecords = () => request({
  url: '/api/cost/has-records',
  method: 'get'
})

// 获取未设置成本的商品数量
export const getItemsWithoutCostCount = () => request({
  url: '/api/cost/items-without-cost-count',
  method: 'get'
})