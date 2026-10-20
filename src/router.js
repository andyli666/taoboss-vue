import { createRouter, createWebHistory } from 'vue-router'
export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/item-timing-update-quantity/',
            children: [
                {
                    path: 'new',
                    components: {
                        default: () => import('./views/item-timing-update-quantity/NewTask.vue'),
                        aside: () => import('./views/item-timing-update-quantity/Aside.vue')
                    },
                    meta: { title: '定时修改库存' }
                },
                {
                    path: 'list',
                    components: {
                        default: () => import('./views/item-timing-update-quantity/TaskList.vue'),
                        aside: () => import('./views/item-timing-update-quantity/Aside.vue')
                    },
                    meta: { title: '定时修改库存列表' }
                }
            ]
        },
        {
            path: '/recommend/',
            children: [
                {
                    path: 'new',
                    components: {
                        default: () => import('./views/recommend/New.vue'),
                        aside: () => import('./views/recommend/Aside.vue')
                    },
                    meta: { title: '新建关联营销' }
                },
                {
                    path: 'list',
                    name: 'recommend-list',
                    components: {
                        default: () => import('./views/recommend/List.vue'),
                        aside: () => import('./views/recommend/Aside.vue')
                    },
                    meta: { title: '关联营销列表' }
                },
                {
                    path: 'edit/:id',
                    name: 'recommend-edit',
                    components: {
                        default: () => import('./views/recommend/Edit.vue'),
                        aside: () => import('./views/recommend/Aside.vue')
                    },
                    meta: { title: '编辑关联营销' }
                },
                {
                    path: 'banner',
                    name: 'recommend-bannner',
                    components: {
                        default: () => import('./views/recommend/Banner.vue'),
                        aside: () => import('./views/recommend/Aside.vue')
                    },
                    meta: { title: '关联营销海报下载' }
                }
            ]
        },
        {
            path: '/finance/',
            children: [
                {
                    path: 'profit',
                    components: {
                        default: () => import('./views/finance/Profit.vue'),
                        aside: () => import('./views/finance/Aside.vue')
                    }
                },
                {
                    path: 'costprice',
                    components: {
                        default: () => import('./views/finance/CostPriceSet.vue'),
                        aside: () => import('./views/finance/Aside.vue')
                    }
                },
            ]
        },
        {
            path: '/cost/',
            children: [
                {
                    path: 'item-cost-manage',
                    components: {
                        default: () => import('./views/cost/ItemCostManage.vue'),
                        aside: () => import('./views/cost/Aside.vue')
                    },
                    meta: { title: '商品成本配置', nopadding: true }
                }, {
                    path: 'freight-cost-config',
                    components: {
                        default: () => import('./views/cost/FreightCostConfig.vue'),
                        aside: () => import('./views/cost/Aside.vue')
                    },
                    meta: { title: '运费成本配置', nopadding: true }
                }, {
                    path: 'expense',
                    components: {
                        default: () => import('./views/cost/ExpenseDetail.vue'),
                        aside: () => import('./views/cost/Aside.vue')
                    },
                    meta: { title: '支出明细', nopadding: true }
                },
            ]
        },
        // {
        //     path: '/statistics/',
        //     children: [
        //         {
        //             path: 'order-profit',
        //             components: {
        //                 default: () => import('./views/statistics/OrderProfitStatistics.vue'),
        //                 aside: () => import('./views/statistics/Aside.vue')
        //             }
        //         }, 
        //     ]
        // },
        {
            path: '/statistics/order-profit', component: () => import('./views/statistics/OrderProfitStatistics.vue'), meta: {
                title: '订单利润统计', hideAside: true
            }
        },
        {
            path: '/statistics/item-sales-analysis',
            name: 'ItemSalesAnalysis',
            component: () => import('@/views/statistics/ItemSalesAnalysis.vue'),
            meta: { title: '商品销售分析', hideAside: true }
        },
        {
            path: '/statistics/express-shipment-stat',
            name: 'ExpressShipmentStat',
            component: () => import('@/views/statistics/ExpressShipmentStat.vue'),
            meta: { title: '快递发货量统计', hideAside: true }
        },
        {
            path: '/statistics/item-refund-analysis',
            name: 'ItemRefundAnalysis',
            component: () => import('@/views/statistics/ItemRefundAnalysis.vue'),
            meta: { title: '商品退款分析', hideAside: true }
        },
        {
            path: '/statistics/order-sales-trend-analysis',
            name: 'OrderSalesTrendAnalysis',
            component: () => import('@/views/statistics/OrderSalesTrendAnalysis.vue'),
            meta: { title: '订单销售趋势分析', hideAside: true }
        },
        {
            path: '/statistics/item-sales-trend-analysis',
            name: 'ItemSalesTrendAnalysis',
            component: () => import('@/views/statistics/ItemSalesTrendAnalysis.vue'),
            meta: { title: '商品销售趋势分析', hideAside: true }
        },
        {
            path: '/statistics/region-sales-analysis',
            name: 'RegionSalesAnalysis',
            component: () => import('@/views/statistics/RegionSalesAnalysis.vue'),
            meta: { title: '买家地区分析', hideAside: true }
        },
        {
            path: '/freight/',
            children: [
                {
                    path: 'item-cost-manage',
                    components: {
                        default: () => import('./views/cost/ItemCostManage.vue'),
                        aside: () => import('./views/cost/Aside.vue')
                    }
                },
            ]
        },
        {
            path: '/delist-optimize/',
            children: [
                {
                    path: 'new',
                    components: {
                        default: () => import('./views/delist-optimize/New.vue'),
                        aside: () => import('./views/delist-optimize/Aside.vue')
                    },
                    meta: { title: '新建下架优化' }
                },
                {
                    path: 'list',
                    components: {
                        default: () => import('./views/delist-optimize/List.vue'),
                        aside: () => import('./views/delist-optimize/Aside.vue')
                    },
                    meta: { title: '下架优化列表' }
                },
                {
                    path: 'distribution',
                    components: {
                        default: () => import('./views/delist-optimize/Distribution.vue'),
                        aside: () => import('./views/delist-optimize/Aside.vue')
                    },
                    meta: { title: '当前上下架时间分布' }
                }
            ]
        },
        {
            path: '/timing-list-delist/',
            children: [
                {
                    path: 'new/:id(\\d+)?',
                    components: {
                        default: () => import('./views/timing-list-delist/New.vue'),
                        aside: () => import('./views/timing-list-delist/Aside.vue')
                    },
                    meta: { title: '新建定时上下架' }
                },
                {
                    path: 'list',
                    components: {
                        default: () => import('./views/timing-list-delist/List.vue'),
                        aside: () => import('./views/timing-list-delist/Aside.vue')
                    },
                    meta: { title: '定时上下架列表' }
                }
            ]
        },
        {
            path: '/batch-update/',
            children: [
                {
                    path: 'title',
                    components: {
                        default: () => import('./views/batch-update/Title.vue'),
                        aside: () => import('./views/batch-update/components/Aside.vue')
                    },
                    meta: { title: '批量修改标题' }
                },
                {
                    path: 'price',
                    components: {
                        default: () => import('./views/batch-update/price/index.vue'),
                        aside: () => import('./views/batch-update/components/Aside.vue')
                    },
                    meta: { title: '批量修改价格' }
                },
                {
                    path: 'title-v2',
                    components: {
                        default: () => import('./views/batch-update/title/index.vue'),
                        aside: () => import('./views/batch-update/components/Aside.vue')
                    },
                    meta: { title: '批量修改标题' }
                },
                {
                    path: 'shop-title',
                    components: {
                        default: () => import('./views/batch-update/shop-title/index.vue'),
                        aside: () => import('./views/batch-update/components/Aside.vue')
                    },
                    meta: { title: '批量修改导购标题' }
                },
                {
                    path: 'stock',
                    components: {
                        default: () => import('./views/batch-update/stock/index.vue'),
                        aside: () => import('./views/batch-update/components/Aside.vue')
                    },
                    meta: { title: '批量修改库存' }
                },
            ]
        },
        {
            path: '/widget/',
            children: [
                {
                    path: 'blacklist',
                    components: {
                        default: () => import('./views/widget/Blacklist.vue'),
                        aside: () => import('./views/widget/Aside.vue')
                    },
                    meta: { title: '黑名单' }
                },
                {
                    path: 'rate-auto-reply',
                    components: {
                        default: () => import('./views/widget/RateAutoReply.vue'),
                        aside: () => import('./views/widget/Aside.vue')
                    },
                    meta: { title: '评价自动回复' }
                },
                {
                    path: 'profit-calc',
                    components: {
                        default: () => import('./views/widget/ProfitCalc.vue'),
                        aside: () => import('./views/widget/Aside.vue')
                    },
                    meta: { title: '利润计算器' }
                },
                {
                    path: 'auto-rate',
                    components: {
                        default: () => import('./views/widget/AutoRate.vue'),
                        aside: () => import('./views/widget/Aside.vue')
                    },
                    meta: { title: '自动评价' }
                },
                {
                    path: 'rate-alarm',
                    components: {
                        default: () => import('./views/widget/RateAlarm.vue'),
                        aside: () => import('./views/widget/Aside.vue')
                    },
                    meta: { title: '中差评提醒' }
                },
            ]
        },
        {
            path: '/help',
            component: () => import('@/views/help/HelpCenter.vue'),
            meta: { title: '帮助中心', hideAside: true }
        },
        {
            path: '/help/detail',
            component: () => import('@/views/help/HelpDetail.vue'),
            meta: { title: '帮助详情', hideAside: true }
        },
        {
            path: '/login', name: 'login', component: () => import('./views/Login.vue'), meta: {
                title: '登录', hideLayout: true
            }
        },
        {
            path: '/auth', name: 'auth', component: () => import('./views/Auth.vue'), meta: {
                title: '授权', hideLayout: true
            }
        },
        { path: '/', redirect: '/index' },
        {
            // path: '/index', name: 'index', component: () => import('./views/Index.vue'), meta: {
            //     hideAside: true
            // }
            path: '/index', name: 'index', component: () => import('./views/Dashboard.vue'), meta: {
                title: '工作台', hideAside: true
            }
        },
        {
            path: '/test', name: 'test', component: () => import('./views/Test.vue'), meta: {
                hideLayout: true
            }
        },
        {
            path: '/ai', name: 'ai', component: () => import('./views/Ai.vue'), meta: {
                hideLayout: true
            }
        },
        {
            path: '/tech/', name: 'TechHome', component: () => import('@/views/tech/HomePage.vue'), meta: {
                hideLayout: true, title: '',
            }
        },
        {
            path: '/tech/product', name: 'TechProduct', component: () => import('@/views/tech/ProductPage.vue'), meta: {
                hideLayout: true, title: '',
            }
        },
        {
            path: '/tech/pay', name: 'TechPay', component: () => import('@/views/tech/PayPage.vue'), meta: {
                hideLayout: true, title: '',
            }
        }
    ],
})

// 路由守卫 - 动态设置页面标题
router.beforeEach((to, from, next) => {
    const defaultTitle = '淘掌柜 - 店铺利润核算与运营工具'
    const pageTitle = to.meta?.title
    document.title = pageTitle ? `${pageTitle} - 淘掌柜` : defaultTitle
    next()
})

export default router
