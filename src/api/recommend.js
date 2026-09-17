import request from '@/utils/request'

// 获取未发布关联营销的出售中商品数量
export const getItemsWithoutActivityCount = () => request({
    url: '/api/recommend/items-without-activity-count',
    method: 'get'
})