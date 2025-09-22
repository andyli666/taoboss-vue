import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useSellerStore = defineStore('seller', () => {
    const sid = ref()
    // const sellerNick = ref('')
    const sellerId = ref()
    const isLoggedIn = ref(false)
    // async function fetchData() {
    //     try {
    //         const response = await request.post('/api/shop-seller-get')
    //         if (response.data.status == 1) {
    //             sid.value = response.data.data.sid
    //             sellerNick.value = response.data.data.seller_nick
    //             sellerId.value = response.data.data.seller_id
    //         } else {
    //             ElMessage.error(response.data.msg)
    //         }
    //     } catch (error) {
    //         ElMessage.error(error)
    //     }
    // }

    return { sid, sellerId, isLoggedIn }
}, {
    persist: {
        storage: sessionStorage
    }
})