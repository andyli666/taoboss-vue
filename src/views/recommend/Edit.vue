<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>关联营销 </el-breadcrumb-item>
        <el-breadcrumb-item>编辑活动</el-breadcrumb-item>
    </el-breadcrumb>
    <el-form :model="form" label-width="auto" style="max-width:1050px">
        <el-form-item label="活动名称">
            <el-input v-model="form.activity_name" placeholder="方便自己管理和识别不同活动" />
        </el-form-item>
        <el-form-item label="活动内容">
            <el-tabs v-model="activeTabName" type="border-card" style="width:100%">
                <el-tab-pane label="系统模板" name="system" :disabled="activeTabName != 'system'">
                    <el-splitter>
                        <el-splitter-panel>
                            <div>
                                <div class="btn-wrap">
                                    <div>模板选择</div>
                                    <el-button type="primary" plain
                                        @click="templateSelectRef.dialogVisible = true; templateSelectRef.radio = template.id"
                                        size="small" class="ml-10">点此选择模板</el-button>
                                </div>
                            </div>
                            <div>
                                <div class="btn-wrap">
                                    <div>推荐商品</div>
                                    <el-button type="primary" plain size="small" @click="handleAddItemBtnClick"
                                        class="ml-10">添加商品</el-button>
                                </div>
                            </div>
                            <el-alert title="拖动行可排序" type="info" show-icon :closable="false" style="margin-top: 5px;" />
                            <el-table :data="tableDataRec" row-key="num_iid" class="elTable">
                                <el-table-column property="pic_url" label="主图" width="60">
                                    <template #default="scope">
                                        <el-image :src="scope.row.pic_url" style="width:50px;">
                                            <template #error>&nbsp;</template>
                                        </el-image>
                                    </template>
                                </el-table-column>
                                <el-table-column property="num_iid" label="ID" width="118" />
                                <el-table-column property="title" label="标题" />
                                <el-table-column label="操作" width="75">
                                    <template #default="scope">
                                        <el-popconfirm width="160" title="确定删除此行吗？" placement="right"
                                            @confirm="handleDeleteRec(scope.$index, scope.row)">
                                            <template #reference>
                                                <el-button size="small" type="danger">删除</el-button>
                                            </template>
                                        </el-popconfirm>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </el-splitter-panel>
                        <el-splitter-panel :size="previewWidth + 5" :resizable="false">
                            <div class="preview">
                                <div class="preview-header">
                                    <span class="label">预览</span>
                                    <span class="description">当前为示意，真实效果发布后查看</span>
                                </div>
                                <div class="preview-content">
                                    <div class="content-banner">商品详情</div>
                                    <div class="content-container">
                                        <div class="current-desc" v-show="form.position == 'bottom'">当前详情描述</div>
                                        <div v-if="!isEmptyObject(template)"
                                            :style="{ width: previewWidth + 'px', display: 'inline-block' }">
                                            <el-row>
                                                <el-col :span="24">
                                                    <el-image :src="template.top_pic"
                                                        :style="{ width: previewWidth + 'px' }" />
                                                </el-col>
                                            </el-row>
                                            <div class="image_container">
                                                <div ref="leftPicRef"><el-image :src="template.left_pic"
                                                        :style="{ width: leftPicWidth + 'px' }" fit="contain" />
                                                </div>
                                                <div style="flex-direction: column;">
                                                    <div v-for="(group, index) in groupedItems" :key="index"
                                                        class="image-row" :style="{ width: imageRowWidth + 'px' }">
                                                        <div v-for="(item, subIndex) in group" :key="subIndex"
                                                            style="flex-direction: column;">
                                                            <a :href="getItemWirelessUrl(item.num_iid)" target="_blank">
                                                                <el-image :src="item.pic_url"
                                                                    :style="{ width: imageWidth + 'px' }"
                                                                    fit="contain" />
                                                                <el-image :src="template.button_pic"
                                                                    :style="{ width: imageWidth + 'px' }"
                                                                    fit="contain" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div ref="rightPicRef"><el-image :src="template.right_pic"
                                                        :style="{ width: rightPicWidth + 'px' }" fit="contain" /></div>
                                            </div>
                                            <el-row>
                                                <el-col :span="24" v-if="template.bottom_pic">
                                                    <el-image :src="template.bottom_pic"
                                                        :style="{ width: previewWidth + 'px' }" />
                                                </el-col>
                                            </el-row>
                                        </div>
                                        <div class="current-desc" v-show="form.position == 'top'">当前详情描述</div>
                                    </div>
                                </div>
                            </div>
                        </el-splitter-panel>
                    </el-splitter>
                </el-tab-pane>
                <el-tab-pane label="自定义图片" name="custom" :disabled="activeTabName != 'custom'">
                    <el-splitter>
                        <el-splitter-panel>
                            <div style="margin:10px 5px 10px 0">
                                <el-alert title="只支持图片；单张图片尺寸[宽度620~1500px，高度<2000px]，超出平台将自动裁剪以保证展示效果；
                        拖动可调整顺序；支持jpg/bmp/gif/heic/png/jpeg/webp格式，大小不超过5MB；最多上传5张图片；图片可加跳转链接。" type="info" show-icon
                                    :closable="false" />
                            </div>
                            <el-upload ref="uploadRef" action="/api/upload-image/index" :headers="headers"
                                v-model:file-list="fileList" list-type="picture-card" :limit="5"
                                :on-preview="handlePictureCardPreview" :data="{ title_prefix: '关联营销' }"
                                :before-upload="beforePictureUpload" :on-error="handleUploadError"
                                :on-success="handleUploadSuccess" :on-exceed="handleExceed"
                                :on-remove="handlePictureRemove"
                                accept="image/jpg,image/bmp,image/gif,image/heic,image/png,image/jpeg,image/webp">
                                <el-icon>
                                    <Plus />
                                </el-icon>
                                <template #file="{ file }">
                                    <div>
                                        <img class="el-upload-list__item-thumbnail" :src="file.url" alt="" />
                                        <span class="el-upload-list__item-actions">
                                            <span class="el-upload-list__item-preview"
                                                @click="handlePictureCardPreview(file)" title="预览">
                                                <el-icon><zoom-in /></el-icon>
                                            </span>
                                            <span class="el-upload-list__item-delete" @click="removePicture(file)"
                                                title="删除">
                                                <el-icon>
                                                    <Delete />
                                                </el-icon>
                                            </span>
                                            <span class="el-upload-list__item-delete" @click="wirelessLinkGetRef.dialogVisible = true; wirelessLinkGetRef.link = file.link; currentFileUid = file.uid;
                                            " title="设置跳转链接">
                                                <el-icon>
                                                    <Link />
                                                </el-icon>
                                            </span>
                                        </span>
                                    </div>
                                </template>
                            </el-upload>
                            <el-dialog v-model="dialogVisible">
                                <img w-full :src="dialogImageUrl" alt="Preview Image" />
                            </el-dialog>
                        </el-splitter-panel>
                        <el-splitter-panel :size="230" :resizable="false">
                            <div class="preview">
                                <div class="preview-header">
                                    <span class="label">预览</span>
                                    <span class="description">当前为示意，真实效果发布后查看</span>
                                </div>
                                <div class="preview-content">
                                    <div class="content-banner">商品详情</div>
                                    <div class="content-container">
                                        <div class="current-desc" v-show="form.position == 'bottom'">当前详情描述</div>
                                        <div v-for="item in fileList">
                                            <a v-if="item.link" :href="item.link" target="_blank"><img :src="item.url"
                                                    width="230" /></a>
                                            <img v-else :src="item.url" width="230" />
                                        </div>
                                        <div class="current-desc" v-show="form.position == 'top'">当前详情描述</div>
                                    </div>
                                </div>
                            </div>
                        </el-splitter-panel>
                    </el-splitter>
                </el-tab-pane>
                <el-tab-pane label="自定义热区" name="map">
                    <el-splitter>
                        <el-splitter-panel>
                            <div :style="'width:' + mapWidth + 'px'">
                                <vue-hot-image v-model="mapData" :url="mapUrl" @select="handleMapSelect" :max="15" />
                            </div>
                        </el-splitter-panel>
                        <el-splitter-panel :size="previewWidth" :resizable="false">
                            <div class="preview">
                                <el-upload action="/api/upload-image/index" :headers="headers"
                                    v-model:file-list="fileListMap" :data="{ title_prefix: '自定义热区' }"
                                    :on-success="handleUploadSuccessMap" :show-file-list="false"
                                    :before-upload="beforeMapUpload">
                                    <template #trigger>
                                        <el-button type="primary">选择图片</el-button>
                                    </template>
                                    <template #tip>
                                        <div class="el-upload__tip">
                                            限制一个图片，新选择图片将覆盖旧图片；图片尺寸[宽度620~1500px，高度<2000px]；支持jpg /png格式；大小不超过5MB </div>
                                    </template>
                                </el-upload>
                                <div>
                                    <div v-for="(item, index) in mapData" class="mb-5">
                                        <el-input v-model="item.link" placeholder="请选择链接">
                                            <template #prepend>链接{{ index + 1 }}</template>
                                            <template #append>
                                                <el-button :icon="Link"
                                                    @click="wirelessLinkGetMapRef.dialogVisible = true; wirelessLinkGetMapRef.link = item.link == undefined ? '' : item.link; currentMapIndex = index" />
                                            </template>
                                        </el-input>
                                    </div>
                                </div>
                            </div>
                        </el-splitter-panel>
                    </el-splitter>
                </el-tab-pane>
            </el-tabs>
        </el-form-item>
        <el-form-item label="发布位置">
            <el-radio-group v-model="form.position">
                <el-radio value="top">置顶</el-radio>
                <el-radio value="bottom">置底</el-radio>
            </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="onSubmit" :loading="submitBtnLoading">保存并发布</el-button>
            <el-button @click="this.$router.push({ name: 'recommend-list' })">返回</el-button>
        </el-form-item>
    </el-form>

    <WirelessLinkGet ref="wirelessLinkGetRef" @get-wireless-link="getWirelessLink" />
    <TemplateSelect ref="templateSelectRef" @get-selection-template="getSelectionTemplate" />
    <ItemsSelect ref="recItemsSelectRef" @get-selection-items="getRecSelectionItems" />
    <el-dialog v-model="dialogProgressVisible" title="发布进度" width="800" @close="handleDialogProgressClose">
        <el-progress :text-inside="true" :stroke-width="26" :percentage="percentage" />
        <div class="publish-percent-tip">
            <div>{{ saveCompleteMsg }}</div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="dialogProgressVisible = false">确定</el-button>
            </div>
        </template>
    </el-dialog>
    <el-dialog v-model="dialogUploadProgressVisible" title="上传进度" width="800" :close-on-click-modal="false">
        <el-progress :percentage="50" :indeterminate="true" style="margin-bottom: 10px;" />
    </el-dialog>
    <WirelessLinkGet ref="wirelessLinkGetMapRef" @get-wireless-link="getWirelessLinkMap" />
</template>
<script setup>
import { reactive, ref, useTemplateRef, watch, onMounted, computed } from 'vue'
import WirelessLinkGet from '@/components/WirelessLinkGet.vue'
import request from '@/utils/request'
// import qs from 'qs'
import { ZoomIn, Plus, Delete, Link } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import Sortable from 'sortablejs'
import ItemsSelect from '@/components/ItemsSelect.vue'
import TemplateSelect from '@/components/TemplateSelect.vue'
import { isEmptyObject, getItemWirelessUrl } from '@/utils/index'
import { EventSourcePolyfill } from 'event-source-polyfill'
import VueHotImage from 'vue-hot-image'

const route = useRoute()
const activityId = route.params.id

const wirelessLinkGetRef = useTemplateRef('wirelessLinkGetRef')
const templateSelectRef = useTemplateRef('templateSelectRef')

// do not use same name with ref
const form = reactive({
    activity_name: '',
    position: 'top',
    remark: ''
})
//
const activeTabName = ref('system')

//图片上传
const uploadRef = useTemplateRef('uploadRef')
const token = localStorage.getItem('token')
const headers = computed(() => {
    return {
        Authorization: `Bearer ${token}`
    }
})
const fileList = ref([])
// const fileList = ref([{
//     name: 'food1.jpeg',
//     url: 'https://img.alicdn.com/imgextra/i1/1677017006/O1CN01qRTFxY21cnu78xQWN_!!1677017006.png',
// }, {
//     name: 'food2.jpeg',
//     url: 'https://img.alicdn.com/imgextra/i4/1677017006/O1CN01ea7M4Q21cnu6mS51o_!!1677017006.png',
// }, {
//     name: 'food3.jpeg',
//     url: 'https://img.alicdn.com/imgextra/i4/1677017006/O1CN01RKXF2Q21cnu5rIPMu_!!1677017006.png',
// }])
const dialogImageUrl = ref('')
const dialogVisible = ref(false)
const handlePictureCardPreview = (uploadFile) => {
    dialogImageUrl.value = uploadFile.url
    dialogVisible.value = true
}
const handlePictureRemove = (file, uploadFiles) => {
    console.log('handlePictureRemove', file, uploadFiles)
}
const removePicture = (uploadFile) => {
    // 本地删除
    // fileList.value.splice(fileList.value.findIndex(v => v.uid == uploadFile.uid), 1)
    fileList.value = fileList.value.filter(file => file.uid !== uploadFile.uid);
    console.log('removePicture', uploadFile, fileList.value)
    if (uploadFile.picture_id === undefined) {
        return
    }
    // 远程删除
    request.post('/api/upload-image/remove', { picture_id: uploadFile.picture_id }).then(response => {
        //do nothing
    }).catch((error) => {
        ElMessage.error(error)
    })
}
const dialogUploadProgressVisible = ref(false)
const beforePictureUpload = (rawFile) => {
    const validTypes = ['image/jpg', 'image/bmp', 'image/gif', 'image/heic', 'image/png', 'image/jpeg', 'image/webp']
    if (!validTypes.includes(rawFile.type)) {
        ElMessage.error('仅支持jpg/bmp/gif/heic/png/jpeg/webp格式')
        return false
    } else if (rawFile.size / 1024 / 1024 > 5) {
        ElMessage.error('文件大小不超过5MB')
        return false
    }
    dialogUploadProgressVisible.value = true
    return true
}
const handleUploadError = (error) => {
    console.log('handleUploadError', error)
}
const handleUploadSuccess = (response, uploadFile) => {
    if (response.status == 0) {//远程上传错误
        ElMessage.error(response.info)
        fileList.value.pop()
    } else {
        let index = findUploadFileIndex(uploadFile)
        if (index > -1) {
            fileList.value[index].picture_id = uploadFile.response.data.picture_id
            dialogUploadProgressVisible.value = false
            setTimeout(() => {
                ElMessage.success('上传成功')
            }, 1000)
        }
    }
}
const findUploadFileIndex = (uploadFile) => {
    return fileList.value.findIndex((file) => {
        return file.uid == uploadFile.uid
    })

}
const handleExceed = () => {
    ElMessage.error('最多上传5张图片')
}

//把获取的无线页面链接设置到fileList对应的file中
const currentFileUid = ref()
const getWirelessLink = (link) => {
    const index = fileList.value.findIndex(file => {
        return file.uid === currentFileUid.value
    })
    if (index > -1) {
        fileList.value[index].link = link
    }
}

//提交数据
const submitBtnLoading = ref(false)
const router = useRouter()
const onSubmit = () => {
    // console.log(fileList.value)
    // return
    const formData = Object.assign({}, form)
    formData.contentType = activeTabName.value
    if (formData.contentType == 'custom') {
        formData.uploadImages = getImageUrls()
        if (!formData.uploadImages.length) {
            ElMessage.error('自定义图片不能为空')
            return
        }
    } else if (formData.contentType == 'system') {//系统模板
        if (isEmptyObject(template.value)) {
            ElMessage.error('请选择模板')
            return
        }
        formData.templateId = template.value.id
        if (!tableDataRec.value.length) {
            ElMessage.error('推荐商品不能为空')
            return
        }
        if (tableDataRec.value.length > maxItems.value) {
            ElMessage.error(`最多选择${maxItems.value}个商品`)
            return
        }
        formData.recItems = tableDataRec.value
    } else if (formData.contentType == 'map') {// 热区
        if (!checkMap()) {
            return
        }
        formData.mapWidth = mapWidth.value
        formData.mapPicUrl = mapUrl.value
        formData.mapPicId = mapPicId.value
        formData.mapData = mapData.value
    } else {
        ElMessage.error('未识别活动内容类型')
        return
    }
    formData.id = activityId
    // console.log(formData)
    // return
    submitBtnLoading.value = true
    //表单+表格数据一起传送必须用qs.stringify方法
    // request.post('/api/recommend/edit', qs.stringify(formData)).then(response => {
    request.post('/api/recommend/edit', formData).then(response => {
        if (response.data.status) {
            ElMessage({
                message: '活动保存成功，即将进行发布，请稍等',
                type: 'success',
                onClose: () => {
                    publishActivity(activityId)
                    submitBtnLoading.value = false
                }
            })
        } else {
            submitBtnLoading.value = false
            ElMessageBox.alert(response.data.msg, '提示', { type: 'warning' })
        }
    }).catch((error) => {
        submitBtnLoading.value = false
        ElMessage.error(error)
    })
}
//获取上传图片urls
const getImageUrls = () => {
    return fileList.value.map((item) => {
        return {
            'picture_path': item.response ? item.response.data.picture_path : item.url,
            'link': item.link,
            'picture_id': item.picture_id
        }
    })
}

//发布活动
const dialogProgressVisible = ref(false)
const percentage = ref(0)
const saveCompleteMsg = ref('')
const publishActivity = (activityId) => {
    dialogProgressVisible.value = true
    const url = `/api/recommend/publish/${activityId}`
    // 创建EventSource连接
    const eventSource = new EventSourcePolyfill(url, {
        headers: {
            'Authorization': `Bearer ${token}`,//设置token
        },
        withCredentials: true  // 携带跨域凭据
    })
    // 监听进度更新
    eventSource.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data)
        percentage.value = data.progress
    })
    // 监听完成事件
    eventSource.addEventListener('complete', (e) => {
        const data = JSON.parse(e.data)
        saveCompleteMsg.value = data.message
        eventSource.close() // 关闭连接
    })

    // 错误处理
    eventSource.onerror = (e) => {
        console.error('EventSource错误:', e)
        eventSource.close()
        setTimeout(() => {
            new EventSource(url)
        }, 3000)
    }
}

const handleDialogProgressClose = () => {
    router.push({ name: 'recommend-list' })
}



//选择的系统模板
const template = ref({})
const getSelectionTemplate = (val) => {
    if (val) { template.value = val }
}

//推荐商品
const handleAddItemBtnClick = () => {
    if (isEmptyObject(template.value)) {
        ElMessage.error('请先选择模板')
        return
    }
    recItemsSelectRef.value.dialogVisible = true
}
const maxItems = computed(() => {
    return template.value.max_rows * template.value.num_per_row
})
const recItemsSelectRef = useTemplateRef('recItemsSelectRef')
const tableDataRec = ref([])
//推荐商品-添加选择的商品
const getRecSelectionItems = (items) => {
    if (items.length > maxItems.value) {
        ElMessage.error(`最多选择${maxItems.value}个商品`)
        return
    }
    tableDataRec.value = items
}
//发布范围商品删除
const handleDeleteRec = (index, row) => {
    const itemIndex = tableDataRec.value.findIndex(currentValue => {
        return currentValue.num_iid == row.num_iid
    })
    tableDataRec.value.splice(itemIndex, 1)
}

//预览行数
const rows = computed(() => {
    if (isEmptyObject(template.value)) {
        return 0
    }
    let actualRows = Math.ceil(tableDataRec.value.length / template.value.num_per_row)
    if (actualRows === 0) {
        actualRows = 1
    }
    return Math.min(actualRows, template.value.max_rows)
})
const groupedItems = computed(() => {
    const result = []
    for (let i = 0; i < rows.value; i++) {
        result.push(tableDataRec.value.slice(i * template.value.num_per_row, (i + 1) * template.value.num_per_row))
    }
    return result
})
//预览区域的宽度
const previewWidth = ref(230)
//主图宽度
const imageWidth = computed(() => {
    if (isEmptyObject(template.value)) {
        return 0
    }
    return template.value.image_width * previewWidth.value / 1000
})
// //按钮图片宽度
// const btnImageWidth = computed(()=>{
//     if (isEmptyObject(template.value)) {
//         return 0
//     }
//    return template.value.btn_image_width *  previewWidth.value / 1000
// })
//左边图片宽度
const leftPicWidth = computed(() => {
    if (isEmptyObject(template.value)) {
        return 0
    }
    return template.value.left_pic_width * previewWidth.value / 1000
})
//右边图片宽度
const rightPicWidth = computed(() => {
    if (isEmptyObject(template.value)) {
        return 0
    }
    return template.value.right_pic_width * previewWidth.value / 1000
})
//图片行宽度（出去左右图片宽度）
const imageRowWidth = computed(() => {
    if (isEmptyObject(template.value)) {
        return 0
    }
    return Math.ceil(previewWidth.value - leftPicWidth.value - rightPicWidth.value)
})
const leftPicRef = useTemplateRef('leftPicRef')
const rightPicRef = useTemplateRef('rightPicRef')
const origHeight = ref(0)
watch(rows, (newRows) => {
    // console.log(`newRows is ${newRows}`)
    if (leftPicRef.value) {
        if (!origHeight.value) {
            origHeight.value = leftPicRef.value.offsetHeight
        }
        // console.log('here', leftPicRef.value, !leftPicRef.value, origHeight.value, leftPicRef.value.offsetWidth)
        const newHeight = String(origHeight.value * rows.value / template.value.max_rows) + 'px'
        // console.log('newHeight', newHeight)
        leftPicRef.value.style.height = newHeight
        rightPicRef.value.style.height = newHeight
    }
})



//上传图片排序
const initSortable = () => {
    const el = uploadRef.value.$el.querySelector('.el-upload-list')
    Sortable.create(el, {
        animation: 150,
        onEnd: ({ oldIndex, newIndex }) => {
            const currRow = fileList.value.splice(oldIndex, 1)[0]
            fileList.value.splice(newIndex, 0, currRow)
        }
    })
}

//推荐商品排序
const initSortableRecTable = () => {
    const el = document.querySelector(".elTable .el-table__body-wrapper tbody")
    Sortable.create(el, {
        // group: 'shared',
        animation: 150,
        // ghostClass: 'sortable-ghost', //拖拽样式
        // easing: 'cubic-bezier(1, 0, 0, 1)',
        onEnd: ({ oldIndex, newIndex }) => {
            const currRow = tableDataRec.value.splice(oldIndex, 1)[0]
            tableDataRec.value.splice(newIndex, 0, currRow)
        }
    })
}

//初始化活动信息
const initActivity = () => {
    request.post('/api/recommend/get-activity-info', { activityId }).then(response => {
        if (response.data.status) {
            form.activity_name = response.data.data.activity_name
            form.position = response.data.data.position
            form.remark = response.data.data.remark
            activeTabName.value = response.data.data.content_type
            if (response.data.data.content_type == 'custom') {
                const upload_images = response.data.data.upload_images
                upload_images.map((val) => val.url = val.picture_path)
                fileList.value = upload_images
            } else if (response.data.data.content_type == 'system') {
                template.value = response.data.data.template
                tableDataRec.value = response.data.data.rec_items
            } else if (response.data.data.content_type == 'map') {
                mapWidth.value = response.data.data.map.map_width
                mapUrl.value = response.data.data.map.picture_path
                mapPicId.value = response.data.data.map.picture_id
                mapData.value = response.data.data.map.map_data
            }
        } else {
            ElMessageBox.alert(response.data.msg, '提示', { type: 'warning' })
        }
    }).catch((error) => {
        ElMessage.error(error)
    })
}
onMounted(() => {
    initSortable()
    initSortableRecTable()
    initActivity()
})

// 自定义热区
const mapWidth = ref(700)
const mapUrl = ref('')
const mapPicId = ref('')
const mapData = ref([])
const handleMapSelect = (index) => {
    // console.log(index)
    // console.log(mapData.value)
}
const beforeMapUpload = (rawFile) => {
    if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
        ElMessage.error('只支持jpg/png格式')
        return false
    } else if (rawFile.size / 1024 / 1024 > 5) {
        ElMessage.error('图片大小不能超过5MB')
        return false
    }
    return true
}
const fileListMap = ref([])
const handleUploadSuccessMap = (response, uploadFile) => {
    if (response.status == 0) {// 远程上传错误
        ElMessage.error(response.info)
        fileListMap.value.pop()
    } else {
        mapUrl.value = uploadFile.response.data.picture_path
        mapPicId.value = uploadFile.response.data.picture_id
    }
}
const wirelessLinkGetMapRef = useTemplateRef('wirelessLinkGetMapRef')
const currentMapIndex = ref(0)
const getWirelessLinkMap = (link) => {
    mapData.value[currentMapIndex.value].link = link
}
const checkMap = () => {
    if (!mapUrl.value) {
        ElMessage.error('图片不能为空')
        return false
    }
    if (mapData.value.length == 0) {
        ElMessage.error('热区不能为空')
        return false
    } else {
        for (let i = 0; i < mapData.value.length; i++) {
            const msg = '链接' + (i + 1) + '不能为空'
            if (mapData.value[i].link == undefined) {
                ElMessage.error(msg)
                return false
            }
            const link = mapData.value[i].link.trim()
            if (!link) {
                ElMessage.error(msg)
                return false
            }
        }
    }
    return true
}
</script>
<style scoped>
.el-form {
    margin-top: 40px
}

.el-pagination {
    margin-top: 16px;
}

.el-dialog img {
    max-width: 100%;
}

.preview {
    padding-left: 5px;
}

.preview-header {
    margin-bottom: 5px;
}

.preview-header span.label {
    color: #111;
    margin-right: 6px;
    font-size: 14px;
    line-height: 20px;
}

.preview-header span.description {
    color: #999;
    font-size: 12px;
    line-height: 20px;
}

.preview-content .content-banner {
    padding-bottom: 5px;
    font-size: 12px;
    line-height: 20px;
    color: #3d5eff;
}

.preview-content .content-container {
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE 10+ */
    overflow-x: hidden;
    overflow-y: auto;
    height: 350px;
    border-radius: 5px;
}

.preview-content .content-container::-webkit-scrollbar {
    display: none;
    /* Chrome Safari */
}

.preview-content .content-container div {
    display: flex;
}

.preview-content .content-container a {
    line-height: 0;
}

.preview-content .content-container .current-desc {
    width: 230px;
    height: 150px;
    line-height: 150px;
    background-color: #ccc;
    justify-content: center;
    color: #666;
}

:deep(.el-alert__title) {
    font-size: small;
}

.publish-percent-tip {
    margin-top: 10px;
    line-height: 2em;
}

.dialog-footer {
    padding-right: 15px;
}

.image_container {
    display: flex;
    justify-content: space-between;
}

.image-row {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
}

.btn-wrap {
    display: flex;
    align-items: flex-start;
}
</style>