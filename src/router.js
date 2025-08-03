import { createRouter, createWebHistory } from 'vue-router'
// import NewTask from './views/NewTask.vue'
// import TaskList from './views/TaskList.vue'
// import RelatedRecommendations from './views/related-recommendations/New.vue'

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
            path: '/related-recommendations/',
            children: [
                {
                    path: 'new',
                    components: {
                        default: () => import('./views/related-recommendations/New.vue'),
                        aside: () => import('./views/related-recommendations/Aside.vue')
                    }
                },
                {
                    path: 'list/:publishDetailPopupId(\\d+)?',
                    name: 'related-recommendations-list',
                    components: {
                        default: () => import('./views/related-recommendations/List.vue'),
                        aside: () => import('./views/related-recommendations/Aside.vue')
                    },
                    props: { default: true, aside: false }
                }
            ]
        },
        {
            path: '/login', name: 'login', component: () => import('./views/Login.vue'), meta: {
                hideLayout: true
            }
        },
        { path: '/', redirect: '/login' }
    ],
})
