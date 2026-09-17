<!-- 帮助详情页（渲染 Markdown） -->
<template>
    <div class="help-detail">
        <div class="help-detail-container">
            <!-- 侧边栏 -->
            <div class="sidebar-wrapper">
                <HelpSidebar :active="currentDoc" @select="loadDoc" />
            </div>

            <!-- 内容区 -->
            <div class="help-content">
                <div class="help-body" v-html="renderedContent"></div>
                <div class="help-footer">
                    <el-button @click="prevDoc" :disabled="!prev">上一篇</el-button>
                    <el-button type="primary" @click="nextDoc" :disabled="!next">下一篇</el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import HelpSidebar from './components/HelpSidebar.vue'
import docs from './docs/index.js'  // 文档索引

const route = useRoute()
const currentDoc = ref('quick-start')
const rawContent = ref('')

// 加载 Markdown 文件
const loadDoc = async (docId) => {
    currentDoc.value = docId
    const module = await import(`./docs/${docId}.md?raw`)
    rawContent.value = module.default
}

// 渲染 Markdown
const renderedContent = computed(() => {
    return marked(rawContent.value)
})

// 导航
const currentIndex = computed(() => docs.findIndex(d => d.id === currentDoc.value))
const prev = computed(() => docs[currentIndex.value - 1]?.id)
const next = computed(() => docs[currentIndex.value + 1]?.id)

watch(() => route.query.doc, (doc) => {
    if (doc) loadDoc(doc)
}, { immediate: true })
</script>

<style scoped>
.help-detail {
    padding: 0 24px 20px 24px;
    background: #f5f7fa;
    min-height: calc(100vh - 64px);
}

.help-detail-container {
    display: flex;
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    align-items: flex-start;
}

.sidebar-wrapper {
    width: 240px;
    flex-shrink: 0;
}

.help-content {
    flex: 1;
    min-width: 0;
    padding-left: 14px;
}

.help-body {
    font-size: 15px;
    line-height: 1.8;
    color: #1D2129;
}

.help-body h1 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 16px;
}

.help-body :deep(h1) {
    margin-top: 0;
}

.help-body h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 24px 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
}

.help-body h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 16px 0 8px;
}

.help-body p {
    margin: 8px 0;
}

.help-body ul,
.help-body ol {
    padding-left: 24px;
    margin: 8px 0;
}

.help-body li {
    margin: 4px 0;
}

.help-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 14px;
}

.help-body th,
.help-body td {
    border: 1px solid #e5e6e8;
    padding: 8px 12px;
    text-align: left;
}

.help-body th {
    background: #f5f7fa;
    font-weight: 600;
}

.help-body blockquote {
    border-left: 4px solid #0089FA;
    padding: 8px 16px;
    margin: 12px 0;
    background: #f0f7ff;
    border-radius: 0 6px 6px 0;
}

.help-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
}

/* 响应式 */
@media screen and (max-width: 768px) {
    .help-detail-container {
        flex-direction: column;
        padding: 16px;
    }

    .sidebar-wrapper {
        width: 100%;
    }

    .help-sidebar {
        border-right: none;
        border-bottom: 1px solid #e5e6e8;
        padding-bottom: 16px;
        margin-bottom: 16px;
    }

    .help-body {
        font-size: 14px;
    }

    .help-body h1 {
        font-size: 20px;
    }

    .help-body h2 {
        font-size: 16px;
    }
}
</style>