<template>
  <el-breadcrumb>
    <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item>关联推荐 </el-breadcrumb-item>
    <el-breadcrumb-item>活动列表</el-breadcrumb-item>
  </el-breadcrumb>
  <div style="padding:40px 0 0 0;">
    <el-form :inline="true" :model="form" @submit.prevent style="width:800px">
      <el-form-item label="活动名称">
        <el-input v-model="form.activity_name" clearable @keyup.enter="getActivities" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getActivities">查询</el-button>
      </el-form-item>
    </el-form>
  </div>
  <el-table :data="tableData" row-key="id" highlight-current-row>
    <el-table-column type="index" width="55" label="序号" :index="indexMethod" />
    <el-table-column property="activity_name" label="活动名称" width="300" />
    <el-table-column property="content_type" label="内容类型" width="100">
      <template #default="scope">
        <div v-if="scope.row.content_type == 'system'">系统模板</div>
        <div v-else-if="scope.row.content_type == 'custom'">自定义图片</div>
        <div v-else-if="scope.row.content_type == 'map'">自定义热区</div>
      </template>
    </el-table-column>
    <el-table-column property="position" label="发布位置" width="100">
      <template #default="scope">
        <div v-if="scope.row.position == 'top'">置顶</div>
        <div v-else-if="scope.row.position == 'bottom'">置底</div>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="400">
      <template #default="scope">
        <el-button size="small" type="primary" link
          @click="getActivityDetailRef.dialogVisible = true; currentActivityId = scope.row.id">查看发布详情</el-button>
        <el-button size="small" type="primary" link
          @click="itemsSelectRef.dialogVisible = true; currentActivityId = scope.row.id; getActivityRangesNumIids(scope.row.id)">增加发布范围</el-button>
        <el-button size="small" type="primary" link @click="uninstallActivity(scope.row.id)">卸载活动</el-button>
        <el-button size="small" type="primary" link @click="editActivity(scope.row.id)">编辑活动</el-button>
        <el-button size="small" type="danger" link @click="removeActivity(scope.row.id)">删除活动</el-button>
      </template>
    </el-table-column>
    <el-table-column property="remark" label="备注" show-overflow-tooltip>
      <template #default="scope">
        <el-text size="small">{{ scope.row.remark }}</el-text>
      </template>
    </el-table-column>
  </el-table>
  <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange" :current-page="currentPage"
    v-model:page-size="pageSize" :page-sizes="[10, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
    :total="total">
  </el-pagination>
  <ActivityDetail ref="getActivityDetailRef" :activityId="currentActivityId" />
  <ItemsSelect ref="itemsSelectRef" @get-selection-items="getSelectionItems"
    :forbidden‌Selections="forbidden‌Selections" />
  <!-- 发布进度 -->
  <el-dialog v-model="dialogProgressVisible" title="发布进度" width="800">
    <el-progress :text-inside="true" :stroke-width="26" :percentage="publishPercentage" />
    <div class="publish-percent-tip">
      <div>{{ saveCompleteMsgPublish }}</div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="dialogProgressVisible = false">确定</el-button>
      </div>
    </template>
  </el-dialog>
  <!-- 卸载进度 -->
  <el-dialog v-model="dialogUninstallProgressVisible" title="卸载进度" width="800">
    <el-progress :text-inside="true" :stroke-width="26" :percentage="uninstallPercentage" />
    <div class="publish-percent-tip">
      <div>{{ saveCompleteMsg }}</div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="dialogUninstallProgressVisible = false">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup>
import { reactive, ref, onMounted, useTemplateRef, computed } from 'vue'
import ItemsSelect from '@/components/ItemsSelect.vue'
import request from '@/utils/request'
import { useRouter } from 'vue-router'
import ActivityDetail from './Detail.vue'
import { useIndexMethod } from '@/composables/useIndexMethod'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { fetchEventSource } from '@microsoft/fetch-event-source'

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
  request.post('/api/recommend/get-activities', {
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
const handleSizeChange = () => {
  getActivities()
}

onMounted(() => {
  getActivities()
})

//卸载活动
const uninstallActivity = (id) => {
  ElMessageBox.confirm('确定卸载活动吗？', '提示', { type: 'warning' })
    .then(() => {
      doUninstallActivity(id)
    }).catch((error) => {
      console.log(error)
    })
}
const token = localStorage.getItem('token')
const dialogUninstallProgressVisible = ref(false)
const uninstallPercentage = ref(0)
const saveCompleteMsg = ref('')
const doUninstallActivity = (id) => {
  dialogUninstallProgressVisible.value = true
  uninstallPercentage.value = 0
  saveCompleteMsg.value = ''
  const url = `/api/recommend/uninstall/${id}`
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
    uninstallPercentage.value = data.progress
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

//删除活动
const removeActivity = (id) => {
  ElMessageBox.confirm('确定删除任务吗？', '提示', { type: 'warning' })
    .then(() => {
      doRemoveActivity(id)
    }).catch(() => { })
}
const doRemoveActivity = (id) => {
  request.post('/api/recommend/remove', {
    id
  }).then(response => {
    if (response.data.status == 1) {
      ElMessage.success('删除成功')
      getActivities()
    } else {
      ElMessage.error(response.data.msg)
    }
  }).catch((error) => {
    ElMessage.error(error)
  })
}

// 增加发布范围商品
const itemsSelectRef = useTemplateRef('itemsSelectRef')
const getSelectionItems = (items) => {
  request.post('/api/recommend/append-ranges', {
    id: currentActivityId.value,
    items
  }).then(response => {
    if (response.data.status === 0) {
      ElMessageBox.alert(response.data.msg, '提示', { type: 'warning' })
    } else {
      publishRanges(response.data.data)
    }
  }).catch((error) => {
    ElMessage.error(error)
  })
}
// 批量发布-按发布范围ids
const dialogProgressVisible = ref(false)
const publishPercentage = ref(0)
const saveCompleteMsgPublish = ref('')
const publishRanges = (ids) => {
  dialogProgressVisible.value = true
  publishPercentage.value = 0
  saveCompleteMsgPublish.value = ''
  try {
    const ctrl = new AbortController(); // 用于中断请求  
    fetchEventSource('/api/recommend/publish-ranges', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`, // 设置token 
      },
      method: 'POST',
      body: JSON.stringify({ ids }),
      signal: ctrl.signal,
      openWhenHidden: true, // 页面退至后台时保持连接  
      onopen: (response) => {
        console.log('连接已打开', response)
      },
      onmessage: (event) => {
        console.log('收到消息:', event.data)
        const data = JSON.parse(event.data)
        if (data.status == 'progress') {
          publishPercentage.value = data.progress
        } else if (data.status == 'complete') {
          saveCompleteMsgPublish.value = data.message
          ctrl.abort() // 中断请求  
        } else if (data.status == 'error') {
          ElMessage.error(data.message)
          ctrl.abort() // 中断请求  
        }
      },
      onerror: (error) => {
        console.error('连接发生错误:', error)
        ElMessage.error(error.message)
        ctrl.abort() // 中断请求  
      },
      onclose: () => {
        console.log('连接已关闭')
      },
    })
  } catch (err) {
    ElMessage.error(err.message)
    throw new Error("终止连接");
  }
}

//增加发布范围时需提交禁止选择的商品num_iids
const forbidden‌Selections = ref()
//获取某个活动的发布范围的num_iids
const getActivityRangesNumIids = (id) => {
  request.post('/api/recommend/get-activity-ranges-num-iids', { id }).then(response => {
    if (response.data.status === 1) {
      forbidden‌Selections.value = response.data.data.map(val => { return val.toString() })
    }
  }).catch((error) => {
    ElMessage.error(error)
  })
}

//跳转到编辑活动页面
const router = useRouter()
const editActivity = (id) => {
  router.push({ name: 'recommend-edit', params: { id } })
}

//分页table index递增
const indexMethod = (index) => {
  const { newIndex } = useIndexMethod(index, currentPage, pageSize)
  return newIndex.value
}
</script>
<style scoped>
.el-pagination {
  margin-top: 16px;
}

.dialog-footer {
  padding-right: 15px;
}

.publish-percent-tip {
  margin-top: 10px;
  line-height: 2em;
}
</style>