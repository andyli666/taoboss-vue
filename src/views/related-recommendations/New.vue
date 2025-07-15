<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>关联推荐 </el-breadcrumb-item>
        <el-breadcrumb-item>新建活动</el-breadcrumb-item>
    </el-breadcrumb>
    <el-form :model="form" label-width="auto" style="max-width:1050px">
        <el-form-item label="活动名称">
            <el-input v-model="form.name" placeholder="方便自己管理和识别不同活动" />
        </el-form-item>
        <el-form-item label="活动内容">
            <el-tabs v-model="activeTabName" type="border-card" style="width:100%">
                <el-tab-pane label="系统模板" name="system">User</el-tab-pane>
                <el-tab-pane label="自定义内容" name="custom">
                    <el-splitter>
                        <el-splitter-panel>
                            <div style="margin:10px 5px 10px 0">
                                <el-alert title="只支持图片；单张图片尺寸[宽度620~1500px，高度<2000px]，超出平台将自动裁剪以保证展示效果；
                        拖动可调整顺序；支持jpg/bmp/gif/heic/png/jpeg/webp格式，大小不超过5MB；最多上传5张图片；图片可加跳转链接。" type="info" show-icon
                                    :closable="false" />
                            </div>
                            <el-upload ref="uploadRef" action="/api/UploadImage" v-model:file-list="fileList"
                                list-type="picture-card" :limit="5" :on-preview="handlePictureCardPreview"
                                :data="{ title_prefix: '关联推荐' }" :on-remove="handlePictureRemove"
                                :before-upload="beforePictureUpload" :on-error="handleUploadError"
                                :on-success="handleUploadSuccess" :on-exceed="handleExceed"
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
                                            <span class="el-upload-list__item-delete" @click="handlePictureRemove(file)"
                                                title="删除">
                                                <el-icon>
                                                    <Delete />
                                                </el-icon>
                                            </span>
                                            <span class="el-upload-list__item-delete"
                                                @click="wirelessLinkGetRef.dialogVisible = true; wirelessLinkGetRef.link = file.link; currentFileUid = file.uid"
                                                title="设置跳转链接">
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
            </el-tabs>
        </el-form-item>
        <el-form-item label="发布位置">
            <el-radio-group v-model="form.position">
                <el-radio value="top">置顶</el-radio>
                <el-radio value="bottom">置底</el-radio>
            </el-radio-group>
        </el-form-item>
        <el-form-item label="发布范围">
            <div style="margin-bottom:0px;width:650px;">
                <el-row>
                    <el-col :span="3">
                        <el-button type="primary" plain size="small"
                            @click="itemSelectRef.dialogVisible = true">添加商品</el-button>
                    </el-col>
                    <el-col :span="21">
                        <el-alert title="可先选择一个测试商品发布，待发布查看没问题后再增加发布到其他商品" type="info" show-icon :closable="false" />
                    </el-col>
                </el-row>
            </div>
            <el-table :data="tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)" row-key="id">
                <el-table-column property="pic_url" label="商品" width="650">
                    <template #default="scope">
                        <el-row>
                            <el-col :span="3">
                                <el-image :src="scope.row.pic_url" style="width:50px;">
                                    <template #error>&nbsp;</template>
                                </el-image>
                            </el-col>
                            <el-col :span="21">
                                <div>{{ scope.row.title }}</div>
                                <div>ID:{{ scope.row.num_iid }}</div>
                            </el-col>
                        </el-row>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="60">
                    <template #default="scope">
                        <el-popconfirm width="160" title="确定删除此行吗？" placement="right"
                            @confirm="handleDelete(scope.$index, scope.row)">
                            <template #reference>
                                <el-button size="small" type="danger">删除</el-button>
                            </template>
                        </el-popconfirm>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination @current-change="handleCurrentChange" :current-page="currentPage"
                v-model:page-size="pageSize" :page-sizes="[10, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper" :total="tableData.length">
            </el-pagination>
        </el-form-item>
        <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="onSubmit" :disabled="submitBtnDisabled">创建并发布</el-button>
        </el-form-item>
    </el-form>

    <ItemsSelect ref="itemSelectRef" @get-selection-items="getSelectionItems" />
    <WirelessLinkGet ref="wirelessLinkGetRef" @get-wireless-link="getWirelessLink" />
</template>
<script setup>
import { reactive, ref, useTemplateRef, markRaw, onMounted } from 'vue'
import ItemsSelect from '@/components/ItemsSelect.vue'
import WirelessLinkGet from '@/components/WirelessLinkGet.vue'
import axios from 'axios'
import qs from 'qs'
import { CircleCheck, Plus, Delete, ZoomIn, Link } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import Sortable from 'sortablejs'

const itemSelectRef = useTemplateRef('itemSelectRef')
const wirelessLinkGetRef = useTemplateRef('wirelessLinkGetRef')

// do not use same name with ref
const form = reactive({
    name: '',
    position: 'top',
    remark: ''
})
//
const activeTabName = ref('custom')

//图片上传
const uploadRef = useTemplateRef('uploadRef')
const fileList = ref([{
    name: 'food1.jpeg',
    url: 'https://img.alicdn.com/imgextra/i1/1677017006/O1CN01qRTFxY21cnu78xQWN_!!1677017006.png',
}, {
    name: 'food2.jpeg',
    url: 'https://img.alicdn.com/imgextra/i4/1677017006/O1CN01ea7M4Q21cnu6mS51o_!!1677017006.png',
}, {
    name: 'food3.jpeg',
    url: 'https://img.alicdn.com/imgextra/i4/1677017006/O1CN01RKXF2Q21cnu5rIPMu_!!1677017006.png',
}])
const dialogImageUrl = ref('')
const dialogVisible = ref(false)
const handlePictureCardPreview = (uploadFile) => {
    dialogImageUrl.value = uploadFile.url
    dialogVisible.value = true
}
const handlePictureRemove = (uploadFile) => {
    if (uploadFile.response === undefined) {
        return
    }
    //远程删除
    axios.post('/api/UploadImage/removeImage', { picture_id: uploadFile.response.data.picture_id }).then(response => {
        //do nothing
    }).catch(function (error) {
        ElMessage.error(error)
    })
}
const beforePictureUpload = (rawFile) => {
    const validTypes = ['image/jpg', 'image/bmp', 'image/gif', 'image/heic', 'image/png', 'image/jpeg', 'image/webp']
    if (!validTypes.includes(rawFile.type)) {
        ElMessage.error('仅支持jpg/bmp/gif/heic/png/jpeg/webp格式')
        return false
    } else if (rawFile.size / 1024 / 1024 > 5) {
        ElMessage.error('文件大小不超过5MB')
        return false
    }
    return true
}
const handleUploadError = (error) => {
    console.log('handleUploadError', error)
}
const handleUploadSuccess = (response) => {
    console.log('handleUploadSuccess', response)
    if (response.status == 0) {//远程上传错误
        ElMessage.error(response.info)
        fileList.value.pop()
    } else {
        // fileList.value.push({
        //     name: response.data.title,
        //     url: response.data.picture_path,
        //     uid: response.data.picture_id,
        // })
    }
}
const handleExceed = () => {
    ElMessage.error('最多上传5张图片')
}

//把获取的无线页面链接设置到fileList对应的file中
const currentFileUid = ref()
const getWirelessLink = (link) => {
    console.log('getWirelessLink', link)
    const index = fileList.value.findIndex(file => {
        return file.uid === currentFileUid.value
    })
    if (index > -1) {
        fileList.value[index].link = link
    }
    console.log('fileList', fileList.value)
}


//发布范围
const tableData = ref([])
//发布范围-添加选择的商品
const getSelectionItems = (items) => {
    tableData.value = items
}
//发布范围商品分页
const currentPage = ref(1)
const pageSize = ref(10)
const handleCurrentChange = (val) => {
    currentPage.value = val
}
//发布范围商品删除
const handleDelete = (index, row) => {
    const itemIndex = tableData.value.findIndex(currentValue => {
        return currentValue.num_iid == row.num_iid
    })
    tableData.value.splice(itemIndex, 1)
}

//提交数据
const submitBtnDisabled = ref(false)
const router = useRouter()
const onSubmit = () => {
    const formData = Object.assign({}, form)
    formData.contentType = activeTabName.value
    if (formData.contentType == 'custom') {
        formData.uploadImages = getImageUrls()
        if (!formData.uploadImages.length) {
            ElMessage.error('自定义内容不能为空')
            return
        }
    }
    formData.ranges = tableData.value
    if (!formData.ranges.length) {
        ElMessage.error('发布范围不能为空')
        return
    }
    console.log(formData)
    return
    submitBtnDisabled.value = true
    //表单+表格数据一起传送必须用qs.stringify方法
    axios.post('/api/RelatedRecommendations/new', qs.stringify(formData)).then(response => {
        submitBtnDisabled.value = false
        if (response.data.status) {
            ElMessageBox.alert(
                '创建成功',
                '提示',
                {
                    type: 'success',
                    icon: markRaw(CircleCheck),
                    callback: (action) => {
                        //查询发布进度
                        ElMessage({
                            type: 'info',
                            message: `action: ${action}`,
                        })
                        router.push('/related-recommendations/new')
                    },
                }
            )
        } else {
            ElMessage({
                showClose: true,
                message: response.data.info,
                duration: 5000,
                type: 'error'
            })
        }
    }).catch(function (error) {
        submitBtnDisabled.value = false
        console.log(error)
    })
}
//获取上传图片urls
const getImageUrls = () => {
    return fileList.value.map((item) => {
        // return { 'picture_path': item.response.data.picture_path, 'link': item.link }
        return { 'picture_path': item.url, 'link': item.link }
    })
}


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
onMounted(() => initSortable())
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
</style>