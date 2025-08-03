<template>
  <el-breadcrumb>
    <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item>关联推荐 </el-breadcrumb-item>
    <el-breadcrumb-item>活动列表</el-breadcrumb-item>
  </el-breadcrumb>
  <el-form :inline="true" :model="form" @submit.prevent style="margin:20px 0">
    <el-form-item label="活动名称">
      <el-input v-model="form.activity_name" clearable @keyup.enter="getActivities" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="getActivities">查询</el-button>
    </el-form-item>
  </el-form>
  <el-table :data="tableData" row-key="id">
    <el-table-column type="index" width="55" label="序号" :index="indexMethod" />
    <el-table-column property="activity_name" label="活动名称" width="300" />
    <el-table-column property="content_type" label="内容类型" width="100">
      <template #default="scope">
        <div v-if="scope.row.content_type == 'system'">系统模板</div>
        <div v-else-if="scope.row.content_type == 'custom'">自定义内容</div>
      </template>
    </el-table-column>
    <el-table-column property="position" label="发布位置" width="100">
      <template #default="scope">
        <div v-if="scope.row.position == 'top'">置顶</div>
        <div v-else-if="scope.row.status == 'bottom'">置底</div>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="250">
      <template #default="scope">
        <el-button size="small" type="primary" link
          @click="getActivityDetailRef.dialogVisible = true; currentActivityId = scope.row.id">查看发布详情</el-button>
        <el-button size="small" type="primary" link @click="uninstallActivity(scope.row.id)">卸载活动</el-button>
        <el-button size="small" type="danger" link @click="removeActivity(scope.row.id)">删除活动</el-button>
      </template>
    </el-table-column>
    <el-table-column property="remark" label="备注" show-overflow-tooltip>
      <template #default="scope">
        <el-text size="small">{{ scope.row.remark }}</el-text>
      </template>
    </el-table-column>
  </el-table>
  <el-pagination @current-change="handleCurrentChange" :current-page="currentPage" :page-size="pageSize"
    layout="prev, pager, next" :total="total">
  </el-pagination>
  <ActivityDetail ref="getActivityDetailRef" :activityId="currentActivityId" />
</template>
<script setup>
import { reactive, ref, onMounted, useTemplateRef } from 'vue'
import axios from 'axios'
import ActivityDetail from './Detail.vue'
import { useIndexMethod } from '@/composables/useIndexMethod'
defineProps({
  publishDetailPopupId: Number | String
})

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)// 每页显示的数据条数
const total = ref(0)// 总数据条数

const form = reactive({
  activity_name: ''
})

const getActivityDetailRef = useTemplateRef('getActivityDetailRef')
const currentActivityId = ref(0)

const getActivities = () => {
  axios.post('/api/RelatedRecommendations/getActivities', {
    activity_name: form.activity_name,
    page: currentPage.value,
    page_size: pageSize.value
  }).then(response => {
    tableData.value = response.data.rows
    total.value = response.data.total
  }).catch((error) => {
    ElMessage.error(error)
  })
}
const handleCurrentChange = (val) => {
  currentPage.value = val
  getActivities()
}

onMounted(() => {
  getActivities()
})

const uninstallActivity = (id) => {
  ElMessageBox.confirm('确定卸载活动吗？', '提示', { type: 'warning' })
    .then(() => {
      doUninstallActivity(id)
    }).catch(() => { })
}
const doUninstallActivity = (id) => {
  axios.post('/api/RelatedRecommendations/uninstallActivity', {
    id
  }).then(response => {
    if (response.data.status == 1) {
      ElMessage({
        message: '卸载成功',
        type: 'success',
      })
      // getActivities()
    } else {
      ElMessage.error(response.data.msg)
    }
  }).catch((error) => {
    ElMessage.error(error)
  })
}

const removeActivity = (id) => {
  ElMessageBox.confirm('确定删除任务吗？', '提示', { type: 'warning' })
    .then(() => {
      doRemoveActivity(id)
    }).catch(() => { })
}

const doRemoveActivity = (id) => {
  axios.post('/api/RelatedRecommendations/removeActivity', {
    id
  }).then(response => {
    if (response.data.status == 1) {
      ElMessage({
        message: '删除成功',
        type: 'success',
      })
      getActivities()
    } else {
      ElMessage.error(response.data.msg)
    }
  }).catch((error) => {
    ElMessage.error(error)
  })
}

const indexMethod = (index) => {
  const { newIndex } = useIndexMethod(index, currentPage, pageSize)
  return newIndex.value
}

onMounted(() => {
  console.log(typeof publishDetailPopupId === 'undefined', typeof publishDetailPopupId !== 'undefined')
  if (typeof publishDetailPopupId !== 'undefined') {
    console.log(publishDetailPopupId.value, !isNaN(publishDetailPopupId.value))
  }
})
</script>