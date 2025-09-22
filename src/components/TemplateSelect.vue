<template>
    <el-dialog v-model="dialogVisible" title="模板选择" width="1000" :close-on-click-modal="false" align-center draggable>
        <el-radio-group v-model="radio">
            <el-space alignment="flex-start" :size="5" wrap>
                <div v-for="(item, index) in templates">
                    <el-radio :value="item.id">
                        <el-card style="max-width: 300px">
                            <el-image :src="item.pic_url" style="height: 100%" />
                            <template #footer>
                                使用次数：{{ item.usage_count }}次
                                <el-button link type="primary" size="small"
                                    @click="showPreview = true; initialIndex = index"
                                    style="float: right;">查看大图</el-button>
                            </template>
                        </el-card>
                    </el-radio>
                </div>
            </el-space>
        </el-radio-group>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleConfirm">确定</el-button>
            </div>
        </template>
        <el-image-viewer v-if="showPreview" :url-list="srcList" show-progress :initial-index="initialIndex"
            @close="showPreview = false" />
    </el-dialog>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import request from '@/utils/request'

//对话框Visible
const dialogVisible = ref(false)
//单选
const radio = ref()
defineExpose({
    dialogVisible,
    radio
})

//模板列表
const templates = ref([])
const srcList = computed(() => {
    return templates.value.map((val) => {
        return val.pic_url
    })
})
// const templates = ref([
//     { pic_url: 'https://top.taoboss.com.cn/static/images/recommend/preview/001.jpg', usage_count: 1513687, id: 1 },
//     { pic_url: 'https://top.taoboss.com.cn/static/images/recommend/preview/002.jpg', usage_count: 10513687, id: 2 },
//     { pic_url: 'https://top.taoboss.com.cn/static/images/recommend/preview/003.jpg', usage_count: 10513687, id: 2 },
//     { pic_url: 'https://top.taoboss.com.cn/static/images/recommend/preview/004.jpg', usage_count: 10513687, id: 2 },
// ])
// const srcList = [
//     'https://top.taoboss.com.cn/static/images/recommend/preview/001.jpg',
//     'https://top.taoboss.com.cn/static/images/recommend/preview/002.jpg',
//     'https://top.taoboss.com.cn/static/images/recommend/preview/003.jpg',
//     'https://top.taoboss.com.cn/static/images/recommend/preview/004.jpg',
// ]
const getTemplates = () => {
    request.post('/api/recommend/get-templates', {}).then(response => {
        templates.value = response.data.data
    }).catch((error) => {
        ElMessage.error(error)
    })
}

//点击“确定”按钮返回选中模板数据
const emit = defineEmits(['get-selection-template'])
const handleConfirm = () => {
    dialogVisible.value = false
    emit('get-selection-template', templates.value.find((template) => {
        return template.id == radio.value
    }))
}

//图片预览
const showPreview = ref(false)
const initialIndex = ref(0)

//页面加载后自动获取模板列表
onMounted(() => {
    getTemplates()
}) 
</script>
<style scoped>
label.el-radio {
    display: inline-block;
    margin-right: 15px;


}

:deep(label.el-radio span.el-radio__input) {
    top: 20px;
    left: 5px;
}

.dialog-footer {
    padding-right: 15px;
}
</style>