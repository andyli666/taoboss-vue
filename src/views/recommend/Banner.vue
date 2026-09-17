<template>
  <el-breadcrumb>
    <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item>关联营销 </el-breadcrumb-item>
    <el-breadcrumb-item>免费海报下载</el-breadcrumb-item>
  </el-breadcrumb>
  <el-form :model="form" class="form" label-width="auto">
    <el-form-item label="类目">
      <el-radio-group v-model="form.radioCat" @change="handleChangeCat">
        <el-radio-button label="全部" value="-1" />
        <el-radio-button label="女装" value="1" />
        <el-radio-button label="男装" value="2" />
        <el-radio-button label="内衣" value="3" />
        <!-- <el-radio-button label="配饰" value="4" /> -->
        <el-radio-button label="女鞋" value="5" />
        <el-radio-button label="美妆" value="8" />
        <!-- <el-radio-button label="男鞋" value="6" />
        <el-radio-button label="运动户外" value="7" /> -->
        <el-radio-button label="珠宝" value="4" />
        <el-radio-button label="箱包" value="6" />
        <el-radio-button label="食品保健" value="7" />
        <el-radio-button label="母婴" value="9" />
        <!-- <el-radio-button label="汽车" value="9" /> -->
        <!-- <el-radio-button label="家居" value="14" /> -->
        <!-- <el-radio-button label="家电" value="15" />
        <el-radio-button label="手机" value="16" />
        <el-radio-button label="电脑" value="17" />
        <el-radio-button label="办公文具" value="18" /> -->
        <!-- <el-radio-button label="宠物" value="10" /> -->
        <el-radio-button label="通用" value="0" />
      </el-radio-group>
    </el-form-item>
    <el-form-item label="活动">
      <el-radio-group v-model="form.radioActivity" @change="handleChangeActivity">
        <el-radio-button label="全部" value="-1" />
        <el-radio-button label="618" value="1" />
        <el-radio-button label="双11" value="2" />
        <!-- <el-radio-button label="双12" value="3" /> -->
        <el-radio-button label="年货节" value="4" />
        <el-radio-button label="春节" value="5" />
        <el-radio-button label="女王节" value="6" />
        <el-radio-button label="上新" value="7" />
      </el-radio-group>
    </el-form-item>
  </el-form>
  <el-space wrap alignment="flex-start">
    <el-card v-for="(banner, index) in banners" :key="banner.id" style="width: 250px">
      <el-image :src="banner.pic_url" @mouseenter="banner.showAction = true;">
        <template #error>
          <el-icon>
            <Picture />
          </el-icon>
        </template>
      </el-image>
      <span class="item-action" v-if="banner.showAction" @mouseenter="banner.showAction = true;"
        @mouseleave="banner.showAction = false;">
        <el-icon @click="handleClick(banner.pic_url, index + 1)">
          <Download />
        </el-icon>
      </span>
      <!-- <template #footer>
        <div>
          <el-button link size="small">下载</el-button>
        </div>
      </template> -->
    </el-card>
  </el-space>
  <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange" :current-page="currentPage"
    v-model:page-size="pageSize" :page-sizes="[20, 40, 60]" layout="total, sizes, prev, pager, next, jumper"
    :total="total">
  </el-pagination>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import request from '@/utils/request'
import { Picture, Download } from '@element-plus/icons-vue'
import { downloadImg } from '@/utils/index'

const form = reactive({
  radioCat: '-1',
  radioActivity: '-1'
})

const handleChangeCat = (value) => {
  console.log('here', value)
  getBanners()
}
const handleChangeActivity = (value) => {
  console.log('here1', value)
  getBanners()
}

const banners = ref([])

const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const getBanners = () => {
  request.post('/api/recommend/get-banners', {
    catId: form.radioCat,
    activityId: form.radioActivity,
    page: currentPage.value,
    pageSize: pageSize.value
  }).then(response => {
    banners.value = response.data.rows
    total.value = response.data.total
  }).catch((error) => {
    ElMessage.error(error)
  })
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  getBanners()
}

const handleSizeChange = () => {
  getBanners()
}

const handleClick = (picUrl, index) => {
  downloadImg(picUrl, `海报下载${index}`)
}

onMounted(() => {
  getBanners()
})
</script>
<style scoped>
.form {
  margin: 40px 0 0 0;
  max-width: 1000px
}

.el-radio-group label {
  margin-bottom: 6px;
}

:deep(.el-card) {
  border: 0;
  box-shadow: none;
}

:deep(.el-card__body) {
  padding: 0;
  position: relative;
}

:deep(.el-card__footer) {
  padding: 0 6px 0 0;

  div {
    display: flex;
    justify-content: right;
  }
}

.item-action {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  cursor: default;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  opacity: 1;
  font-size: 20px;
  background-color: var(--el-overlay-color-lighter);
  transition: opacity var(--el-transition-duration);

  .el-icon {
    cursor: pointer;
  }
}

.el-pagination {
  margin-top: 16px;
}
</style>