<!-- 帮助中心首页 -->
<template>
    <div class="help-center">
        <!-- 顶部标题区 -->
        <div class="help-header">
            <div class="help-header-content">
                <h1>📖 帮助中心</h1>
                <p class="help-subtitle">快速上手淘掌柜，让店铺运营更高效</p>
            </div>
        </div>

        <!-- 搜索框 -->
        <div class="help-search">
            <el-input v-model="searchKeyword" placeholder="搜索帮助文档..." size="large" clearable @keyup.enter="handleSearch"
                @clear="handleSearchClear">
                <template #prefix>
                    <el-icon>
                        <Search />
                    </el-icon>
                </template>
            </el-input>
        </div>

        <!-- 分类导航 -->
        <div class="help-categories">
            <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
                <el-tab-pane v-for="cat in categories" :key="cat.key" :label="cat.label" :name="cat.key" />
            </el-tabs>
        </div>

        <!-- 文档列表 -->
        <div class="help-docs">
            <el-row :gutter="20">
                <el-col v-for="doc in filteredDocs" :key="doc.id" :xs="24" :sm="12" :md="8" :lg="6">
                    <div class="doc-card" @click="openDoc(doc.id)">
                        <div class="doc-icon">{{ doc.icon }}</div>
                        <div class="doc-title">{{ doc.title }}</div>
                        <div class="doc-desc">{{ doc.desc }}</div>
                        <div class="doc-meta">
                            <span class="doc-category">{{ getCategoryLabel(doc.category) }}</span>
                            <span class="doc-read">阅读 →</span>
                        </div>
                    </div>
                </el-col>
            </el-row>

            <!-- 空状态 -->
            <div v-if="filteredDocs.length === 0" class="empty-state">
                <el-empty description="未找到相关文档" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import docs from './docs/index.js'

const router = useRouter()
const searchKeyword = ref('')
const activeCategory = ref('all')

// 分类配置
const categories = [
    { key: 'all', label: '全部' },
    { key: 'quick-start', label: '快速入门' },
    { key: 'marketing', label: '营销推广' },
    { key: 'profit', label: '利润分析' },
    { key: 'tools', label: '工具使用' },
    { key: 'faq', label: '常见问题' },
]

// 获取分类标签
const getCategoryLabel = (key) => {
    const found = categories.find(c => c.key === key)
    return found ? found.label : key
}

// 筛选文档
const filteredDocs = computed(() => {
    let result = docs

    // 按分类筛选
    if (activeCategory.value !== 'all') {
        result = result.filter(doc => doc.category === activeCategory.value)
    }

    // 按关键词搜索
    if (searchKeyword.value.trim()) {
        const keyword = searchKeyword.value.trim().toLowerCase()
        result = result.filter(doc =>
            doc.title.includes(keyword) ||
            doc.desc.includes(keyword) ||
            doc.keywords?.some(k => k.includes(keyword))
        )
    }

    return result
})

// 打开文档
const openDoc = (docId) => {
    router.push({
        path: '/help/detail',
        query: { doc: docId }
    })
}

// 搜索
const handleSearch = () => {
    // 搜索逻辑由 computed 自动处理
}

const handleSearchClear = () => {
    searchKeyword.value = ''
}

// 切换分类
const handleCategoryChange = () => {
    // 分类切换由 computed 自动处理
}
</script>

<style scoped>
.help-center {
    min-height: 100vh;
    background: #f5f7fa;
    padding: 0 24px 40px;
}

/* 顶部标题 */
.help-header {
    background: #ffffff;
    margin: 0 -24px 32px;
    padding: 40px 24px 32px;
    text-align: center;
    border-bottom: 1px solid #f0f0f0;
    border-radius: 0 0 12px 12px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.help-header-content h1 {
    color: #1D2129;
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 8px 0;
}

.help-subtitle {
    color: #86909C;
    font-size: 15px;
    margin: 0;
}

/* 搜索框 */
.help-search {
    max-width: 600px;
    margin: 0 auto 24px;
    position: relative;
    z-index: 2;
}

.help-search :deep(.el-input__wrapper) {
    border-radius: 24px;
    box-shadow: 0 4px 20px rgba(0, 137, 250, 0.15);
    padding: 4px 20px;
}

.help-search :deep(.el-input__wrapper:hover) {
    box-shadow: 0 6px 28px rgba(0, 137, 250, 0.20);
}

.help-search :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 6px 28px rgba(0, 137, 250, 0.25);
}

.help-search :deep(.el-input__inner) {
    font-size: 15px;
}

/* 分类导航 */
.help-categories {
    max-width: 800px;
    margin: 0 auto 24px;
    background: #fff;
    border-radius: 12px;
    padding: 0 16px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.help-categories :deep(.el-tabs__header) {
    margin-bottom: 0;
}

.help-categories :deep(.el-tabs__item) {
    font-size: 14px;
    padding: 0 20px;
    height: 48px;
    line-height: 48px;
}

/* 文档列表 */
.help-docs {
    max-width: 1200px;
    margin: 0 auto;
}

.doc-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px 20px;
    margin-bottom: 20px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: all 0.3s;
    height: 180px;
    display: flex;
    flex-direction: column;
}

.doc-card:hover {
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.10);
    transform: translateY(-4px);
}

.doc-icon {
    font-size: 32px;
    margin-bottom: 12px;
}

.doc-title {
    font-size: 16px;
    font-weight: 600;
    color: #1D2129;
    /* margin-bottom: 8px; */
    flex: 1;
}

.doc-desc {
    font-size: 13px;
    color: #86909C;
    line-height: 1.5;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.doc-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
}

.doc-category {
    font-size: 12px;
    color: #0089FA;
    background: rgba(0, 137, 250, 0.08);
    padding: 2px 12px;
    border-radius: 12px;
}

.doc-read {
    font-size: 13px;
    color: #C9CDD4;
    transition: color 0.2s;
}

.doc-card:hover .doc-read {
    color: #0089FA;
}

.empty-state {
    grid-column: 1 / -1;
    padding: 60px 0;
}

/* 响应式 */
@media screen and (max-width: 768px) {
    .help-header {
        padding: 32px 16px 28px;
    }

    .help-header-content h1 {
        font-size: 24px;
    }

    .help-subtitle {
        font-size: 14px;
    }

    .help-search {
        margin: -16px 8px 16px;
    }

    .help-categories {
        padding: 0 8px;
    }

    .help-categories :deep(.el-tabs__item) {
        padding: 0 12px;
        font-size: 13px;
    }

    .doc-card {
        height: 160px;
        padding: 18px 16px;
    }

    .doc-title {
        font-size: 14px;
    }
}
</style>