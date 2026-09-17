// ============ 文件: src/stores/product.js ============
import { reactive, ref } from 'vue'

const products = reactive([
  { id: 1, name: '无线耳机 Pro', desc: '主动降噪 · 30h续航', price: 399, icon: '🎧' },
  { id: 2, name: '智能手环 6', desc: '心率血氧 · 防水', price: 259, icon: '⌚' },
  { id: 3, name: '快充移动电源', desc: '20000mAh · 45W', price: 189, icon: '🔋' },
  { id: 4, name: '蓝牙音箱 Mini', desc: '360° 环绕声', price: 329, icon: '🔊' },
])

// 默认选中第一个商品作为初始值
const selectedProduct = ref(products[0])
const selectedSku = ref('标准版')
const quantity = ref(1)

export function useProductStore() {
  const setSelectedProduct = (product) => {
    selectedProduct.value = product
  }

  return {
    products,
    selectedProduct,
    selectedSku,
    quantity,
    setSelectedProduct,
  }
}