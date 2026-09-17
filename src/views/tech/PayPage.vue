<!-- ============ 文件: src/views/tech/PayPage.vue ============ -->
<template>
  <div class="pay-page">
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
        <h2>💳 结算支付 <span class="tag">确认订单</span></h2>
        <el-steps :active="2" align-center style="width: 200px;" finish-status="success">
          <el-step title="购物车" />
          <el-step title="确认" />
          <el-step title="支付" />
        </el-steps>
      </div>
      <div class="page-body">
        <div class="pay-summary">
          <div class="pay-item">
            <span class="label">商品</span>
            <span class="value">{{ currentProduct.name }} × {{ quantity }}</span>
          </div>
          <div class="pay-item">
            <span class="label">版本</span>
            <span class="value">{{ selectedSku }}</span>
          </div>
          <div class="pay-total">
            <small>¥</small>{{ totalAmount }}
          </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 28px; align-items: center; justify-content: center; background: #f6faff; border-radius: 32px; padding: 24px 20px; border: 1px solid #e3ebf7;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
            <div class="qrcode-box">
              <span>📱</span>
            </div>
            <span style="font-size: 13px; color: #2d4a6a; background: #e4ecf7; padding: 2px 20px; border-radius: 40px;">支付宝收款码</span>
          </div>
          <div style="flex: 1; min-width: 180px;">
            <div style="font-weight: 600; font-size: 18px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
              应付总额
              <span style="font-size: 34px; font-weight: 700; color: #d14836;">¥{{ totalAmount }}</span>
            </div>
            <div style="margin: 14px 0 12px; display: flex; gap: 14px; flex-wrap: wrap;">
              <el-tag type="success" size="large" round>即时到账</el-tag>
              <el-tag type="info" size="large" round>支付宝担保</el-tag>
            </div>
            <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 6px;">
              <el-button type="primary" size="default" round @click="simulatePay" style="background: #1677ff; border: none; padding: 10px 40px;">确认支付</el-button>
              <el-button size="default" round plain @click="router.push('/tech/product')">返回</el-button>
            </div>
            <div style="margin-top: 16px; color: #3f5a78; font-size: 14px; background: #eef3fb; padding: 6px 20px; border-radius: 40px; display: inline-block;">
              ⏱️ 支付剩余 14:58
            </div>
          </div>
        </div>

        <div style="margin-top: 28px; display: flex; flex-wrap: wrap; gap: 20px; justify-content: space-between; border-top: 1px solid #e6ecf4; padding-top: 22px;">
          <div style="display: flex; gap: 22px;">
            <span><el-icon><CircleCheck /></el-icon> 支付宝支付</span>
            <span><el-icon><CreditCard /></el-icon> 余额/花呗</span>
          </div>
          <el-button size="small" text type="primary">帮助</el-button>
        </div>
      </div>
    </section>
    <div v-else class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useProductStore } from '@/stores/product'

const router = useRouter()
const productStore = useProductStore()

// 直接从 store 获取数据
const currentProduct = computed(() => {
  return productStore.selectedProduct.value
})

const selectedSku = computed({
  get: () => productStore.selectedSku.value,
  set: (val) => { productStore.selectedSku.value = val }
})

const quantity = computed({
  get: () => productStore.quantity.value,
  set: (val) => { productStore.quantity.value = val }
})

onMounted(() => {
  if (!productStore.selectedProduct.value) {
    productStore.setSelectedProduct(productStore.products[0])
    router.push('/tech')
  }
})

const totalAmount = computed(() => {
  const product = currentProduct.value
  if (!product) return '0'
  return (product.price * quantity.value).toFixed(0)
})

const simulatePay = () => {
  ElMessage.success('支付成功，收款已即时到账')
  router.push('/tech')
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
.pay-summary {
  background: #f7faff;
  border-radius: 24px;
  padding: 20px 28px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  border: 1px solid #e4ebf5;
}
.pay-item {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.pay-item .label {
  color: #455a78;
  font-weight: 450;
}
.pay-item .value {
  font-weight: 600;
  color: #1a2a44;
  background: white;
  padding: 4px 20px;
  border-radius: 40px;
  border: 1px solid #d6e0ed;
  font-size: 15px;
}
.pay-total {
  font-size: 30px;
  font-weight: 700;
  color: #d14836;
}
.pay-total small {
  font-size: 18px;
  font-weight: 400;
  color: #5b7390;
  margin-right: 4px;
}
.qrcode-box {
  background: #f2f7ff;
  border-radius: 24px;
  padding: 14px;
  border: 1px solid #dbe3ef;
  width: 148px;
  height: 148px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qrcode-box span {
  font-size: 80px;
  opacity: 0.85;
}
.loading-container {
  padding: 40px;
}
@media (max-width: 640px) {
  .page-body {
    padding: 16px;
  }
  .pay-summary {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }
  .page-header {
    padding: 16px 16px 6px;
  }
}
</style>