<template>
    <el-button @click="handleClick">测试</el-button>
</template>
<script setup>
import { onMounted } from 'vue'
import request from '@/utils/request'
import { useRouter } from 'vue-router'

const router = useRouter()

const handleClick = () => {
    // request.post('/api/index/test', {

    // }).then(response => {
    //     console.log(response)
    // }).catch((error) => {
    //     ElMessage.error(error)
    // })

    // 
    router.push('/batch-update/new')

    // const SYNC_SHOWN_KEY = 'taoboss_sync_shown'
    // localStorage.setItem(SYNC_SHOWN_KEY, 'false')
    // ElMessage.success('Success')
}

onMounted(() => {
    console.log(localStorage.getItem('user'))
})
</script>