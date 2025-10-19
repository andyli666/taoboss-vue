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
                    }
                },
                {
                    path: 'list',
                    components: {
                        default: () => import('./views/item-timing-update-quantity/TaskList.vue'),
                        aside: () => import('./views/item-timing-update-quantity/Aside.vue')
                    }
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
                    }
                },
                {
                    path: 'list',
                    name: 'recommend-list',
                    components: {
                        default: () => import('./views/recommend/List.vue'),
                        aside: () => import('./views/recommend/Aside.vue')
                    }
                },
                {
                    path: 'edit/:id',
                    name: 'recommend-edit',
                    components: {
                        default: () => import('./views/recommend/Edit.vue'),
                        aside: () => import('./views/recommend/Aside.vue')
                    }
                },
                {
                    path: 'banner',
                    name: 'recommend-bannner',
                    components: {
                        default: () => import('./views/recommend/Banner.vue'),
                        aside: () => import('./views/recommend/Aside.vue')
                    }
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
                }
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
                    }
                },
                {
                    path: 'list',
                    components: {
                        default: () => import('./views/delist-optimize/List.vue'),
                        aside: () => import('./views/delist-optimize/Aside.vue')
                    }
                },
                {
                    path: 'distribution',
                    components: {
                        default: () => import('./views/delist-optimize/Distribution.vue'),
                        aside: () => import('./views/delist-optimize/Aside.vue')
                    }
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
                    }
                },
                {
                    path: 'list',
                    components: {
                        default: () => import('./views/timing-list-delist/List.vue'),
                        aside: () => import('./views/timing-list-delist/Aside.vue')
                    }
                }
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
                    }
                },
                {
                    path: 'rate-auto-reply',
                    components: {
                        default: () => import('./views/widget/RateAutoReply.vue'),
                        aside: () => import('./views/widget/Aside.vue')
                    }
                },
                {
                    path: 'profit-calc',
                    components: {
                        default: () => import('./views/widget/ProfitCalc.vue'),
                        aside: () => import('./views/widget/Aside.vue')
                    }
                },
                {
                    path: 'auto-rate',
                    components: {
                        default: () => import('./views/widget/AutoRate.vue'),
                        aside: () => import('./views/widget/Aside.vue')
                    }
                },
                {
                    path: 'rate-alarm',
                    components: {
                        default: () => import('./views/widget/RateAlarm.vue'),
                        aside: () => import('./views/widget/Aside.vue')
                    }
                },
            ]
        },
        {
            path: '/login', name: 'login', component: () => import('./views/Login.vue'), meta: {
                hideLayout: true
            }
        },
        {
            path: '/auth', name: 'auth', component: () => import('./views/Auth.vue'), meta: {
                hideLayout: true
            }
        },
        { path: '/', redirect: '/index' },
        {
            path: '/index', name: 'index', component: () => import('./views/Index.vue'), meta: {
                hideAside: true
            }
        },
        {
            path: '/test', name: 'test', component: () => import('./views/Test.vue'), meta: {
                hideAside: true
            }
        }
    ],
})
