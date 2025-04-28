import { createRouter, createWebHistory } from 'vue-router'
import NewTask from './views/NewTask.vue'
import TaskList from './views/TaskList.vue'

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/list', name: 'list', component: TaskList },
        { path: '/new', name: 'new', component: NewTask },
    ],
})
