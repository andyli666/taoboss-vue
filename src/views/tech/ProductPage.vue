<!-- ============ 文件: src/views/tech/ProductPage.vue ============ -->
<template>
  <div class="product-page">
    <!-- 顶部导航 -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 24px;">
      <div>
        <div style="font-weight: 700; font-size: 26px; color: #0b1a33;">TechWave</div>
        <div style="color: #4e6888; font-size: 14px;">品质科技 · 即时送达</div>
      </div>
      <el-button size="small" @click="router.push('/tech')">返回首页</el-button>
    </div>

    <section class="page-section" v-if="currentProduct">
      <div class="page-header">
        <h2>📦 商品详情 <span class="tag">规格 · 服务</span></h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/tech' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>音频设备</el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentProduct.name }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="page-body">
        <div style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 32px;">
          <div style="flex: 1 1 240px; min-width: 200px;">
            <div style="background: #f7fbff; border-radius: 28px; padding: 30px 16px; text-align: center; border: 1px solid #e6edf8;">
              <span style="font-size: 84px; display: block; line-height: 1.2;">{{ currentProduct.icon }}</span>
              <div style="font-weight: 600; font-size: 22px; margin: 12px 0 4px; color: #0f2a44;">{{ currentProduct.name }}</div>
              <div style="color: #5d718c;">{{ currentProduct.desc }}</div>
              <div style="margin: 14px 0 8px; font-size: 34px; font-weight: 700; color: #d14836;">¥{{ currentProduct.price }}</div>
            </div>
          </div>
          <div style="flex: 2 1 340px;">
            <div style="font-weight: 600; font-size: 18px; margin-bottom: 12px;">选择版本</div>
            <el-radio-group v-model="selectedSku" style="margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 12px;">
              <el-radio-button label="标准版" />
              <el-radio-button label="Pro 版" />
              <el-radio-button label="尊享版" />
            </el-radio-group>
            <div style="display: flex; gap: 24px; flex-wrap: wrap; background: #f8fbfe; border-radius: 20px; padding: 16px 22px; margin: 12px 0 20px;">
              <div><span class="text-muted">库存</span> <strong>156</strong> 件</div>
              <div><span class="text-muted">销量</span> <strong>2.3k</strong></div>
              <div><span class="text-muted">运费</span> <strong>包邮</strong></div>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
              <el-input-number v-model="quantity" :min="1" :max="10" size="default" style="width: 130px;" />
              <el-button type="primary" size="default" @click="addToCart" round>加入购物车</el-button>
              <el-button type="success" size="default" @click="goToPay" round style="background: #1677ff; border: none;">立即购买</el-button>
            </div>
            <div style="margin-top: 28px; color: #4d637f; font-size: 14px; border-top: 1px solid #e4ebf5; padding-top: 18px;">
              <el-icon><InfoFilled /></el-icon> 支持支付宝即时收款，付款后实时到账
            </div>
          </div>
        </div>
        <div style="margin-top: 30px; background: #fafcff; border-radius: 20px; padding: 16px 24px; border: 1px solid #e9eef5;">
          <div style="display: flex; gap: 32px; flex-wrap: wrap;">
            <div><span class="text-muted">品牌</span>  TechWave</div>
            <div><span class="text-muted">型号</span>  TWS-2026</div>
            <div><span class="text-muted">保修</span>  12个月</div>
            <div><span class="text-muted">支付方式</span>  <el-tag size="small" type="success" round>支付宝</el-tag></div>
          </div>
        </div>
      </div>
    </section>
    <div v-else class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useProductStore } from '@/stores/product'

const router = useRouter()
const productStore = useProductStore()

// 直接使用 store 中的 selectedProduct
const currentProduct = computed(() => {
  return productStore.selectedProduct.value
})

const selectedSku = ref('标准版')
const quantity = ref(1)

// 监听商品变化，重置数量和SKU（可选）
watch(currentProduct, (newProduct) => {
  if (newProduct) {
    selectedSku.value = '标准版'
    quantity.value = 1
  }
})

onMounted(() => {
  // 如果 store 中没有选中的商品，设置默认值并重定向
  if (!productStore.selectedProduct.value) {
    productStore.setSelectedProduct(productStore.products[0])
    router.push('/tech')
  }
})

const addToCart = () => {
  const product = currentProduct.value
  if (!product) {
    ElMessage.warning('请先选择商品')
    return
  }
  ElMessage.success(`已添加 ${product.name} × ${quantity.value} 到购物车`)
}

const goToPay = () => {
  if (!currentProduct.value) {
    ElMessage.warning('请先选择商品')
    return
  }
  router.push('/tech/pay')
}
</script>

<style scoped>
.page-section {
  background: #fff;
  border-radius: 24px;
  border: 1px solid #eef2f8;
  box-shadow: 0 4px 20px rgba(0, 20, 40, 0.04);
  margin-bottom: 44px;
  overflow: hidden;
}
.page-header {
  padding: 20px 28px 8px 28px;
  border-bottom: 1px solid #edf2f8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.page-header h2 {
  font-weight: 600;
  font-size: 20px;
  color: #0b1a33;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}
.page-header .tag {
  background: #eef3fa;
  border-radius: 40px;
  font-size: 12px;
  padding: 2px 16px;
  color: #2c3e50;
  font-weight: 500;
}
.page-body {
  padding: 24px 28px 28px;
}
.text-muted {
  color: #6a7e9a;
}
.loading-container {
  padding: 40px;
}
@media (max-width: 640px) {
  .page-body {
    padding: 16px;
  }
  .page-header {
    padding: 16px 16px 6px;
  }
}
</style>