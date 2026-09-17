<template>
  <el-tabs v-model="activeTabName" type="border-card">
    <el-tab-pane label="图片换装" name="dressingDiffusion">
      <div style="margin:15px 0">
        <el-alert title="产品介绍&图片要求" type="info" show-icon>
          <div>产品介绍：是指基于用户输入的衣服图片，更换到指定的模特图上。即输入模特图A + 服装图B，输出A穿着指定服装B的照片</div>
          <div>图片格式：JPG(JPEG)，PNG，建议使用JPG格式</div>
          <div>图片大小：小于5 MB，尺寸小于4096*4096</div>
          <div>建议使用人物主体清晰的模特图与服装主体清晰的服装图，否则会导致出图效果不佳</div>
          <div><a href="https://img.alicdn.com/imgextra/i2/2218998426113/O1CN01unsl9a1v1oFV7H8BN_!!2218998426113.jpg"
          target="_blank">点此查看图片换装效果展示</a></div>
        </el-alert>
      </div>
      <div>请上传模特图：</div>
      <div>
        <el-upload class="avatar-uploader" action="/api/upload-image/common" :data="{ title_prefix: '图片换装-模特图' }"
          :show-file-list="false" :on-success="handleAvatarSuccessModel" :before-upload="beforeAvatarUpload">
          <img v-if="imageUrlModel" :src="imageUrlModel" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon">
            <Plus />
          </el-icon>
        </el-upload>
      </div>
      <div class="mt-5">
        <el-button type="primary" :icon="Delete" @click="removeImageModel" size="small"
          :disabled="!imageUrlModel">删除图片</el-button>
      </div>
      <div class="mt-15">请至少上传一张服装图（可以是上装、下装或全身）：</div>
      <div>
        <el-row>
          <el-col :span="8">
            上装请这里上传：
            <el-upload class="avatar-uploader" action="/api/upload-image/common" :data="{ title_prefix: '图片换装-上装' }"
              :show-file-list="false" :on-success="handleAvatarSuccessGarmentUpper" :before-upload="beforeAvatarUpload">
              <img v-if="imageUrlGarmentUpper" :src="imageUrlGarmentUpper" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon">
                <Plus />
              </el-icon>
            </el-upload>
            <div class="mt-5">
              <el-button type="primary" :icon="Delete" @click="removeImageGarmentUpper" size="small"
                :disabled="!imageUrlGarmentUpper">删除图片</el-button>
            </div>
          </el-col>
          <el-col :span="8">
            下装请这里上传：
            <el-upload class="avatar-uploader" action="/api/upload-image/common" :data="{ title_prefix: '图片换装-下装' }"
              :show-file-list="false" :on-success="handleAvatarSuccessGarmentBottom"
              :before-upload="beforeAvatarUpload">
              <img v-if="imageUrlGarmentBottom" :src="imageUrlGarmentBottom" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon">
                <Plus />
              </el-icon>
            </el-upload>
            <div class="mt-5">
              <el-button type="primary" :icon="Delete" @click="removeImageGarmentBottom" size="small"
                :disabled="!imageUrlGarmentBottom">删除图片</el-button>
            </div>
          </el-col>
          <el-col :span="8">
            全身请这里上传：
            <el-upload class="avatar-uploader" action="/api/upload-image/common" :data="{ title_prefix: '图片换装-下装' }"
              :show-file-list="false" :on-success="handleAvatarSuccessGarmentFull" :before-upload="beforeAvatarUpload">
              <img v-if="imageUrlGarmentFull" :src="imageUrlGarmentFull" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon">
                <Plus />
              </el-icon>
            </el-upload>
            <div class="mt-5">
              <el-button type="primary" :icon="Delete" @click="removeImageGarmentFull" size="small"
                :disabled="!imageUrlGarmentFull">删除图片</el-button>
            </div>
          </el-col>
        </el-row>
        <div class="mt-15">
          <el-alert title="目标换装区域外的区域，会出现随机生成结果：" type="info" show-icon>
            <div>比如上传的是上衣图，裤子有可能会随机生成（可通过调整下面选项控制是否保持下装/上装）</div>
            <div>比如上传的是穿裙子的模特图+上衣图，那么裤子就会随机生成(裙装的模特原本没有下装，所以会随机生成)</div>
          </el-alert>
        </div>
        <el-row class="mt-15">
          是否保持模特原图的上装：<el-switch v-model="keepUpper" inline-prompt active-text="是" inactive-text="否" />
        </el-row>
        <el-row>
          是否保持模特原图的下装：<el-switch v-model="keepLower" inline-prompt active-text="是" inactive-text="否" />
        </el-row>
      </div>
      <div class="mt-15">
        <el-button type="primary" @click="getDressingDiffusion" :loading="loadingDressingDiffusion">
          {{ loadingDressingDiffusion ? '换装中，请稍等，大概需要50s...' : '点此换装' }}
        </el-button>
      </div>
      <div class="mt-15">换装结果：</div>
      <div class="mt-15">
        <a :href="imageUrlDressingDiffusion" target="_blank">
          <img :src="imageUrlDressingDiffusion" style="width:1000px" />
        </a>
      </div>
    </el-tab-pane>
    <el-tab-pane label="活动海报生成" name="activityPoster">
      <el-form :model="form" class="form" label-width="auto">
        <el-form-item label="活动类型">
          <el-radio-group v-model="form.radioActivity">
            <el-radio-button label="双11" value="11" />
            <el-radio-button label="双12" value="12" />
            <el-radio-button label="年货节" value="1" />
            <el-radio-button label="春节" value="10" />
            <el-radio-button label="女王节" value="38" />
            <el-radio-button label="618" value="618" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label=" ">
          <el-button type="primary" @click="getPost" :loading="loading">
            {{ loading ? '海报生成中...' : '点此生成海报' }}
          </el-button>
        </el-form-item>
        <img :src="imageUrl" style="width:1000px" />
      </el-form>
    </el-tab-pane>
  </el-tabs>
</template>
<script setup>
import { reactive, ref } from 'vue'
import request from '@/utils/request'
import { Plus, Delete } from '@element-plus/icons-vue'

document.title = "AI生图工具"

const form = reactive({
  radioActivity: '11'
})
const activeTabName = ref('dressingDiffusion')

// 活动海报生成
const loading = ref(false)
const imageUrl = ref('')
const getPost = () => {
  loading.value = true
  request.post('/api/ai-visual-text-to-image/get-post', {
    activity: form.radioActivity
  }).then(response => {
    loading.value = false
    console.log(response.data)
    if (response.data.status) {
      imageUrl.value = response.data.data[0].url
    } else {
      ElMessage.error(response.data.msg)
    }
  }).catch((error) => {
    loading.value = false
    ElMessage.error(error)
  })
}

// 图片换装
const keepUpper = ref(false)
const keepLower = ref(false)
// 上传模特图
const imageUrlModel = ref('')
const handleAvatarSuccessModel = (response, uploadFile) => {
  if (response.status == 0) {// 远程上传错误
    ElMessage.error(response.info)
  } else {
    imageUrlModel.value = uploadFile.response.data.picture_path
  }
}
const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('只支持jpg或png格式')
    return false
  } else if (rawFile.size / 1024 / 1024 > 5) {
    ElMessage.error('图片大小不能超过5MB')
    return false
  }
  return true
}
// 上传服装图
const imageUrlGarmentUpper = ref('')
const handleAvatarSuccessGarmentUpper = (response, uploadFile) => {
  if (response.status == 0) {// 远程上传错误
    ElMessage.error(response.info)
  } else {
    imageUrlGarmentUpper.value = uploadFile.response.data.picture_path
  }
}
// 上传服装图
const imageUrlGarmentBottom = ref('')
const handleAvatarSuccessGarmentBottom = (response, uploadFile) => {
  if (response.status == 0) {// 远程上传错误
    ElMessage.error(response.info)
  } else {
    imageUrlGarmentBottom.value = uploadFile.response.data.picture_path
  }
}
// 上传服装图
const imageUrlGarmentFull = ref('')
const handleAvatarSuccessGarmentFull = (response, uploadFile) => {
  if (response.status == 0) {// 远程上传错误
    ElMessage.error(response.info)
  } else {
    imageUrlGarmentFull.value = uploadFile.response.data.picture_path
    keepUpper.value = false
    keepLower.value = false
  }
}
// 执行换装
const loadingDressingDiffusion = ref(false)
const imageUrlDressingDiffusion = ref('')
const getDressingDiffusion = () => {
  if (!imageUrlModel.value) {
    ElMessage.error('请上传模特图')
    return false
  }
  if (!imageUrlGarmentUpper.value && !imageUrlGarmentBottom.value && !imageUrlGarmentFull.value) {
    ElMessage.error('请至少上传一张服装图')
    return false
  }
  loadingDressingDiffusion.value = true
  request.post('/api/ai-visual-dressing-diffusion/index', {
    imageUrlModel: imageUrlModel.value,
    imageUrlGarmentUpper: imageUrlGarmentUpper.value,
    imageUrlGarmentBottom: imageUrlGarmentBottom.value,
    imageUrlGarmentFull: imageUrlGarmentFull.value,
    keepUpper: keepUpper.value,
    keepLower: keepLower.value
  }).then(response => {
    console.log(response.data)
    if (response.data.status) {
      queryTask(response.data.data.task_id)
      // queryTask('12978670517753782220')
    } else {
      loadingDressingDiffusion.value = false
      ElMessage.error(response.data.msg)
    }
  }).catch((error) => {
    loadingDressingDiffusion.value = false
    ElMessage.error(error)
  })
}
let intervalId
const queryTask = (taskId) => {
  intervalId = setInterval(() => {
    doQueryTask(taskId)
  }, 5000)
}
const doQueryTask = (taskId) => {
  request.post('/api/ai-visual-dressing-diffusion/query-task', {
    taskId
  }).then(response => {
    console.log(response.data)
    if (response.data.status == 1) {
      clearInterval(intervalId)
      loadingDressingDiffusion.value = false
      imageUrlDressingDiffusion.value = response.data.data[0]
      ElMessage.success('换装成功')
    } else if (response.data.status == 0) {
      clearInterval(intervalId)
      loadingDressingDiffusion.value = false
      ElMessage.error(response.data.msg)
    }
  }).catch((error) => {
    clearInterval(intervalId)
    loadingDressingDiffusion.value = false
    ElMessage.error(error)
  })
}
const removeImageModel = () => {
  imageUrlModel.value = ''
}
const removeImageGarmentUpper = () => {
  imageUrlGarmentUpper.value = ''
}
const removeImageGarmentBottom = () => {
  imageUrlGarmentBottom.value = ''
}
const removeImageGarmentFull = () => {
  imageUrlGarmentFull.value = ''
}
</script>
<style scoped>
.form {
  /* margin: 40px 0 0 0; */
  max-width: 1000px
}

.el-radio-group label {
  margin-bottom: 6px;
}

/* 图片上传 */
.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: contain;
}
</style>

<style>
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
</style>