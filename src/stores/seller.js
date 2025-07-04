import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useSellerStore = defineStore('seller', () => {
    const sid = ref()
    const sellerNick = ref('')
    const sellerId = ref()
    async function fetchData() {
        try {
            const response = await axios.get('/api/TopPublicShopSellerGetRequest')
            if (response.data.status == 1) {
                sid.value = response.data.data.sid
                sellerNick.value = response.data.data.seller_nick
                sellerId.value = response.data.data.seller_id
            } else {
                ElMessage.error(response.data.msg)
            }
        } catch (error) {
            ElMessage.error(error)
        }
    }

    return { sid, sellerNick, sellerId, fetchData }
})