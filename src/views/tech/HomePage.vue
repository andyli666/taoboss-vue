<!-- ============ 文件: src/views/tech/HomePage.vue ============ -->
<template>
  <div class="home-page">
    <!-- 顶部品牌栏 -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 24px;">
      <div>
        <div style="font-weight: 700; font-size: 26px; color: #0b1a33;">TechWave</div>
        <div style="color: #4e6888; font-size: 14px;">品质科技 · 即时送达</div>
      </div>
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-input placeholder="搜索商品" size="small" style="width: 180px;" prefix-icon="Search" />
        <el-badge :value="3">
          <el-icon size="22"><ShoppingCart /></el-icon>
        </el-badge>
        <el-button size="small" type="primary" plain>登录</el-button>
      </div>
    </div>

    <section class="page-section">
      <div class="page-header">
        <h2>🏠 首页 <span class="tag">精选推荐</span></h2>
        <el-button size="small" type="primary" plain>全部商品</el-button>
      </div>
      <div class="page-body">
        <div style="background: linear-gradient(105deg, #eaf1fd, #f2f8ff); border-radius: 24px; padding: 28px 32px; margin-bottom: 28px; border: 1px solid #e2ebf7;">
          <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px;">
            <div>
              <div style="font-weight: 600; font-size: 24px; color: #0b2a4a;">新品首发 · 限时特惠</div>
              <div style="color: #3f5f80; margin-top: 6px;">支付宝即时收款，安全极速到账</div>
            </div>
            <el-button type="primary" size="large" round style="background: #1677ff; border: none; padding: 10px 36px; font-weight: 500;">立即抢购</el-button>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <span style="font-weight: 600; color: #1a2a44; font-size: 18px;">🔥 热门商品</span>
          <el-link type="primary" :underline="false">浏览全部 →</el-link>
        </div>
        <div class="product-grid">
          <div class="product-card" v-for="item in products" :key="item.id">
            <span class="product-icon">{{ item.icon }}</span>
            <div class="product-name">{{ item.name }}</div>
            <div class="product-desc">{{ item.desc }}</div>
            <div class="product-price">¥{{ item.price }} <small>起</small></div>
            <div class="action-btn-wrap">
              <el-button size="small" type="primary" plain round @click="selectProduct(item)">选择</el-button>
            </div>
          </div>
        </div>
        <div style="margin-top: 20px; display: flex; justify-content: center;">
          <el-pagination background layout="prev, pager, next" :total="24" :page-size="4" small />
        </div>
        <div style="margin-top: 22px; border-top: 1px solid #edf2f8; padding-top: 20px; display: flex; flex-wrap: wrap; gap: 24px; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: 28px; flex-wrap: wrap;">
            <span style="color: #3a5670;"><el-icon><Timer /></el-icon> 7天无理由</span>
            <span style="color: #3a5670;"><el-icon><Lock /></el-icon> 支付宝担保</span>
            <span style="color: #3a5670;"><el-icon><Trophy /></el-icon> 官方正品</span>
          </div>
          <el-tag type="info" size="small" style="background: #eef3f9; border: none; color: #2a4a6a;">已服务 10,000+ 用户</el-tag>
        </div>
      </div>
    </section>

    <div style="text-align: center; padding: 16px 0 6px; color: #7a90ad; font-size: 13px; border-top: 1px solid #e5ebf3; margin-top: 10px;">
      <span>© 2026 TechWave · 支付宝即时收款</span>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/product'

const router = useRouter()
const productStore = useProductStore()
const { products } = productStore

const selectProduct = (item) => {
  // 设置选中的商品
  productStore.setSelectedProduct(item)
  // 跳转到商品详情页
  router.push('/tech/product')
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
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
  margin: 12px 0 6px;
}
.product-card {
  background: #fafcff;
  border: 1px solid #eaf0f7;
  border-radius: 20px;
  padding: 18px 12px 20px;
  text-align: center;
  transition: 0.15s;
}
.product-card:hover {
  border-color: #c0d0e6;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0, 20, 40, 0.04);
}
.product-icon {
  font-size: 42px;
  display: block;
  margin-bottom: 6px;
}
.product-name {
  font-weight: 600;
  font-size: 16px;
  color: #1a2a44;
  margin: 6px 0 2px;
}
.product-desc {
  font-size: 13px;
  color: #6a7e9a;
  margin: 4px 0 8px;
}
.product-price {
  font-weight: 700;
  color: #d14836;
  font-size: 20px;
}
.product-price small {
  font-weight: 400;
  font-size: 13px;
  color: #7a8fa8;
  margin-left: 2px;
}
.action-btn-wrap {
  margin-top: 14px;
}
@media (max-width: 640px) {
  .page-body {
    padding: 16px;
  }
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .page-header {
    padding: 16px 16px 6px;
  }
}
</style>