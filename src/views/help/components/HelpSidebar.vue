<!-- 帮助侧边导航 -->
<template>
    <div class="help-sidebar">
        <!-- 返回首页 -->
        <div class="sidebar-back" @click="goHome">
            <el-icon>
                <ArrowLeft />
            </el-icon>
            <span>返回帮助中心</span>
        </div>

        <!-- 文档目录 -->
        <div class="sidebar-title">📚 文档目录</div>
        <div class="sidebar-list">
            <div v-for="doc in docs" :key="doc.id" class="sidebar-item" :class="{ active: active === doc.id }"
                @click="handleSelect(doc.id)">
                <span class="item-icon">{{ doc.icon }}</span>
                <span class="item-title">{{ doc.title }}</span>
                <span v-if="doc.coming" class="item-badge">即将上线</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import docs from '../docs/index.js'

const props = defineProps({
    active: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['select'])
const router = useRouter()

// 过滤掉隐藏的文档
const visibleDocs = computed(() => docs.filter(d => !d.hidden))

const goHome = () => {
    router.push('/help')
}

const handleSelect = (docId) => {
    emit('select', docId)
}
</script>

<style scoped>
.help-sidebar {
    width: 240px;
    flex-shrink: 0;
    padding-right: 24px;
    border-right: 1px solid #e5e6e8;
    min-height: 400px;
}

/* 返回按钮 */
.sidebar-back {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    color: #86909C;
    font-size: 14px;
    transition: all 0.2s;
    margin-bottom: 20px;
}

.sidebar-back:hover {
    background: #f2f3f5;
    color: #0089FA;
}

/* 目录标题 */
.sidebar-title {
    font-size: 14px;
    font-weight: 600;
    color: #1D2129;
    padding: 0 12px 12px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 8px;
}

/* 文档列表 */
.sidebar-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.sidebar-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
    color: #4E5969;
}

.sidebar-item:hover {
    background: #f2f3f5;
}

.sidebar-item.active {
    background: rgba(0, 137, 250, 0.08);
    color: #0089FA;
    font-weight: 500;
}

.sidebar-item .item-icon {
    font-size: 18px;
    flex-shrink: 0;
}

.sidebar-item .item-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sidebar-item .item-badge {
    font-size: 11px;
    color: #fff;
    background: #F56C6C;
    padding: 1px 8px;
    border-radius: 10px;
    flex-shrink: 0;
}

/* 响应式 */
@media screen and (max-width: 768px) {
    .help-sidebar {
        width: 100%;
        padding-right: 0;
        border-right: none;
        border-bottom: 1px solid #e5e6e8;
        padding-bottom: 16px;
        margin-bottom: 16px;
    }

    .sidebar-list {
        flex-direction: row;
        flex-wrap: wrap;
    }

    .sidebar-item {
        flex: 1;
        min-width: 100px;
    }
}
</style>