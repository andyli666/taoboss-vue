<template>
  <div class="item-cost-manage">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h2>商品成本配置</h2>
        <p class="page-desc">支持按商品/SKU设置成本，支持多时间段价格</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showBatchImport = true">
          <el-icon>
            <Upload />
          </el-icon>
          批量导入
        </el-button>
        <el-button @click="exportTemplate">
          <el-icon>
            <Download />
          </el-icon>
          下载模板
        </el-button>
      </div>
    </div>

    <!-- 查询栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="商品ID">
          <el-input v-model="searchForm.num_iid" placeholder="请输入商品ID" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="商品标题">
          <el-input v-model="searchForm.title" placeholder="请输入商品标题" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="商品状态">
          <el-select v-model="searchForm.status" placeholder="请选择" style="width: 120px" clearable>
            <el-option label="全部" value="" />
            <el-option label="出售中" value="onsale" />
            <el-option label="仓库中" value="instock" />
          </el-select>
        </el-form-item>
        <el-form-item label="成本状态">
          <el-select v-model="searchForm.costStatus" placeholder="请选择" style="width: 120px" clearable>
            <el-option label="全部" value="" />
            <el-option label="已设置" value="set" />
            <el-option label="未设置" value="notSet" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchItems">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 商品列表 -->
    <el-card class="item-list-card">
      <template #header>
        <div class="card-header">
          <span>商品列表</span>
          <el-button type="primary" link @click="refreshList">
            <el-icon>
              <Refresh />
            </el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <el-table :data="itemList" border stripe v-loading="loading" style="width: 100%">
        <!-- 合并后的商品信息列（图片 + 标题 + ID） -->
        <el-table-column label="商品信息" min-width="320" align="left">
          <template #default="{ row }">
            <div class="product-info-cell">
              <!-- 左侧：商品图片 -->
              <div class="product-image">
                <a :href="getItemWirelessUrl(row.num_iid)" target="_blank" @click.stop>
                  <el-image :src="row.pic_url" fit="cover" style="width: 60px; height: 60px" :lazy="true">
                    <template #error>
                      <div class="image-placeholder-small">无图</div>
                    </template>
                  </el-image>
                </a>
              </div>
              <!-- 右侧：商品标题 + 商品ID -->
              <div class="product-details">
                <!-- 商品标题超链接 -->
                <a :href="getItemWirelessUrl(row.num_iid)" target="_blank" class="product-title-link" @click.stop
                  :title="row.title">
                  {{ row.title || '-' }}
                </a>
                <!-- 商品ID（小字体） -->
                <div class="product-id">
                  <span class="id-label">商品ID：</span>
                  <span>{{ row.num_iid || '-' }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 隐藏原来的商品ID、标题、图片列 -->
        <el-table-column prop="num_iid" label="商品ID" width="140" v-if="false" />
        <el-table-column prop="title" label="商品标题" min-width="200" show-overflow-tooltip v-if="false" />
        <el-table-column label="商品图片" width="80" align="center" v-if="false">
          <template #default="{ row }">
            <el-image :src="row.pic_url" fit="cover" style="width: 50px; height: 50px" :lazy="true">
              <template #error>
                <div class="image-placeholder">无图</div>
              </template>
            </el-image>
          </template>
        </el-table-column>

        <el-table-column prop="price" label="售价" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column prop="num" label="库存" width="80" align="right" />
        <el-table-column label="商品状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'onsale' ? 'success' : 'info'" size="small">
              {{ row.status === 'onsale' ? '出售中' : '仓库中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否有SKU" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.has_sku ? 'primary' : 'info'" size="small">
              {{ row.has_sku ? '有SKU' : '无SKU' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="成本状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.has_cost ? 'success' : 'danger'" size="small">
              {{ row.has_cost ? '已设置' : '未设置' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前成本" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.current_cost">¥{{ row.current_cost }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openCostDialog(row)">设置成本</el-button>
            <el-button type="success" link @click="viewCostHistory(row)">历史记录</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadItems" @current-change="loadItems" />
      </div>
    </el-card>

    <!-- 设置成本弹窗 -->
    <el-dialog v-model="costDialogVisible" :title="`设置成本 - ${currentItem?.title || currentItem?.num_iid}`"
      width="1000px" destroy-on-close>
      <!-- SKU选择标签页 -->
      <el-tabs v-model="activeCostTab" type="border-card">
        <el-tab-pane label="商品级别成本" name="item">
          <div class="cost-form">
            <el-form :model="itemCostForm" label-width="100px" size="default">
              <el-form-item label="成本价" required>
                <el-input-number v-model="itemCostForm.cost_price" :precision="2" :min="0" :step="0.5"
                  placeholder="请输入成本价" />
                <span class="form-tip">元</span>
              </el-form-item>
              <el-form-item label="生效日期" required>
                <el-date-picker v-model="itemCostForm.effective_date" type="date" placeholder="选择生效日期"
                  format="YYYY-MM-DD" value-format="YYYY-MM-DD" :disabled-date="disabledDate" />
                <div class="date-hint">
                  <el-icon>
                    <InfoFilled />
                  </el-icon>
                  <span>
                    <strong>提示：</strong>
                    选今天 → 只影响新订单；
                    选过去日期（最多180天）→ 重新计算该日期之后的订单成本；
                    选未来日期 → 到该日期后才生效
                  </span>
                </div>
              </el-form-item>
              <el-form-item label="失效日期">
                <el-date-picker v-model="itemCostForm.expire_date" type="date" placeholder="留空表示长期有效"
                  format="YYYY-MM-DD" value-format="YYYY-MM-DD" clearable />
                <span class="form-tip">留空表示长期有效</span>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveItemCost">保存商品成本</el-button>
                <!-- <el-button v-if="itemCostHistory.length > 0" @click="showItemCostHistory = true">
                  查看历史
                </el-button> -->
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="SKU级别成本" name="sku" :disabled="!currentItem?.has_sku">
          <template #label>
            <span>
              SKU级别成本
              <el-tag v-if="!currentItem?.has_sku" type="info" size="small" style="margin-left: 8px">
                当前商品无SKU
              </el-tag>
            </span>
          </template>

          <div v-if="currentItem?.has_sku" class="sku-cost-section">
            <!-- SKU列表表格 -->
            <el-table :data="skuList" border stripe size="small" max-height="400"
              @selection-change="handleSkuSelectionChange">
              <el-table-column type="selection" width="55" />
              <el-table-column prop="sku_id" label="SKU ID" width="140" show-overflow-tooltip />
              <el-table-column prop="properties_name" label="规格属性" min-width="200" show-overflow-tooltip />
              <el-table-column prop="price" label="售价" width="100" align="right">
                <template #default="{ row }">¥{{ row.price }}</template>
              </el-table-column>
              <el-table-column prop="quantity" label="库存" width="80" align="right" />
              <el-table-column label="SKU状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getSkuStatusType(row.status)" size="small">
                    {{ getSkuStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="当前成本" width="120" align="right">
                <template #default="{ row }">
                  <span v-if="row.current_cost">¥{{ row.current_cost }}</span>
                  <span v-else class="text-muted">未设置</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link @click="openSkuCostDialog(row)">设置</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="sku-batch-actions">
              <el-button type="primary" plain size="small" @click="batchSetSkuCost">批量设置SKU成本（已选 {{ selectedSkus.length
              }}
                个）</el-button>
              <el-button type="success" plain size="small" @click="copyItemCostToSkus">
                复制商品成本到所有SKU
              </el-button>
            </div>
          </div>

          <div v-else class="empty-state">
            <el-empty description="该商品暂无SKU，请在商品级别设置成本" :image-size="100" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="成本历史" name="history">
          <div class="cost-history-section">
            <el-radio-group v-model="historyType" size="small" style="margin-bottom: 16px">
              <el-radio-button label="item">商品级别</el-radio-button>
              <el-radio-button label="sku">SKU级别</el-radio-button>
            </el-radio-group>

            <!-- 商品级别成本历史 -->
            <el-table v-if="historyType === 'item'" :data="itemCostHistory" border size="small" max-height="400">
              <el-table-column prop="effective_date" label="生效日期" width="120" />
              <el-table-column prop="expire_date" label="失效日期" width="120">
                <template #default="{ row }">
                  {{ row.expire_date || '长期有效' }}
                </template>
              </el-table-column>
              <el-table-column prop="cost_price" label="成本价" width="120" align="right">
                <template #default="{ row }">¥{{ row.cost_price }}</template>
              </el-table-column>
              <el-table-column label="当前状态" width="100">
                <template #default="{ row }">
                  <el-tag v-if="isCurrentEffective(row)" type="success" size="small">生效中</el-tag>
                  <el-tag v-else-if="isFutureEffective(row)" type="info" size="small">未生效</el-tag>
                  <el-tag v-else type="danger" size="small">已失效</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="create_time" label="创建时间" width="160" />
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button type="danger" link @click="deleteCostRecord(row, 'item')">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- SKU级别成本历史 -->
            <el-table v-else :data="skuCostHistory" border size="small" max-height="400">
              <el-table-column prop="sku_id" label="SKU ID" width="140" show-overflow-tooltip />
              <el-table-column prop="sku_properties" label="规格属性" min-width="150" />
              <el-table-column prop="effective_date" label="生效日期" width="100" />
              <el-table-column prop="expire_date" label="失效日期" width="100">
                <template #default="{ row }">
                  {{ row.expire_date || '长期有效' }}
                </template>
              </el-table-column>
              <el-table-column prop="cost_price" label="成本价" width="100" align="right">
                <template #default="{ row }">¥{{ row.cost_price }}</template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button type="danger" link @click="deleteCostRecord(row, 'sku')">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div v-if="(historyType === 'item' && itemCostHistory.length === 0) ||
              (historyType === 'sku' && skuCostHistory.length === 0)" class="empty-state">
              <el-empty description="暂无成本历史记录" :image-size="80" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- SKU成本设置弹窗 -->
    <el-dialog v-model="skuCostDialogVisible" title="设置SKU成本" width="650px" destroy-on-close>
      <el-form :model="skuCostForm" label-width="100px">
        <el-form-item label="SKU ID">
          <el-input v-model="skuCostForm.sku_id" disabled />
        </el-form-item>
        <el-form-item label="规格属性">
          <el-input v-model="skuCostForm.properties_name" disabled />
        </el-form-item>
        <el-form-item label="售价">
          <span>¥{{ skuCostForm.price }}</span>
        </el-form-item>
        <el-form-item label="成本价" required>
          <el-input-number v-model="skuCostForm.cost_price" :precision="2" :min="0" :step="0.5" placeholder="请输入成本价" />
          <span class="form-tip">元</span>
        </el-form-item>
        <el-form-item label="生效日期" required>
          <el-date-picker v-model="skuCostForm.effective_date" type="date" placeholder="选择生效日期" format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" :disabled-date="disabledDate" />
          <div class="date-hint">
            <el-icon>
              <InfoFilled />
            </el-icon>
            <span>
              <strong>提示：</strong>
              选今天 → 只影响新订单；
              选过去日期（最多180天）→ 重新计算该日期之后的订单成本；
              选未来日期 → 到该日期后才生效
            </span>
          </div>
        </el-form-item>
        <el-form-item label="失效日期">
          <el-date-picker v-model="skuCostForm.expire_date" type="date" placeholder="留空表示长期有效" format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="skuCostDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSkuCost">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量设置SKU成本弹窗 -->
    <el-dialog v-model="batchSkuDialogVisible" title="批量设置SKU成本" width="650px">
      <el-form :model="batchSkuForm" label-width="100px">
        <el-form-item label="成本价" required>
          <el-input-number v-model="batchSkuForm.cost_price" :precision="2" :min="0" :step="0.5" />
          <span class="form-tip">元</span>
        </el-form-item>
        <el-form-item label="生效日期" required>
          <el-date-picker v-model="batchSkuForm.effective_date" type="date" placeholder="选择生效日期" format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" :disabled-date="disabledDate" />
          <div class="date-hint">
            <el-icon>
              <InfoFilled />
            </el-icon>
            <span>
              <strong>提示：</strong>
              选今天 → 只影响新订单；
              选过去日期（最多180天）→ 重新计算该日期之后的订单成本；
              选未来日期 → 到该日期后才生效
            </span>
          </div>
        </el-form-item>
        <el-form-item label="失效日期">
          <el-date-picker v-model="batchSkuForm.expire_date" type="date" placeholder="留空表示长期有效" format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchSkuDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchSetSkuCost">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入弹窗 -->
    <el-dialog v-model="showBatchImport" title="批量导入商品成本" width="700px">
      <div class="batch-import-content">
        <el-alert title="导入说明" type="info" :closable="false" show-icon>
          <template #default>
            <ul>
              <li>请先下载模板，按照模板格式填写数据</li>
              <li>支持设置商品级别和SKU级别的成本</li>
              <li>商品ID(num_iid)为必填项，SKU ID(sku_id)选填</li>
              <li>成本价为必填项</li>
            </ul>
          </template>
        </el-alert>

        <div class="upload-area">
          <el-upload ref="uploadRef" drag action="/api/cost/import" :headers="uploadHeaders"
            :on-success="handleUploadSuccess" :on-error="handleUploadError" :before-upload="beforeUpload"
            accept=".xlsx,.xls">
            <el-icon class="upload-icon">
              <UploadFilled />
            </el-icon>
            <div class="upload-text">将文件拖到此处，或点击上传</div>
            <div class="upload-hint">支持 .xlsx, .xls 格式</div>
          </el-upload>
        </div>
      </div>
      <template #footer>
        <el-button @click="showBatchImport = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { Refresh, Upload, Download, UploadFilled, InfoFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import {
  getItemList,
  getSkuList,
  getCostHistory,
  saveCost,
  deleteCost,
  exportCostTemplate,
  batchImportCost
} from '@/api/cost'
import { getItemWirelessUrl } from '@/utils/index'
import { useRoute } from 'vue-router'
const route = useRoute()

// 状态
const loading = ref(false)
const itemList = ref([])
const skuList = ref([])

// 搜索表单
const searchForm = reactive({
  num_iid: '',
  title: '',
  status: '',
  costStatus: ''
})

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
})

// 当前选中的商品
const currentItem = ref(null)

// 弹窗控制
const costDialogVisible = ref(false)
const skuCostDialogVisible = ref(false)
const batchSkuDialogVisible = ref(false)
const showBatchImport = ref(false)
const showItemCostHistory = ref(false)

// 标签页切换
const activeCostTab = ref('item')
const historyType = ref('item')

// 商品级别成本表单
const itemCostForm = reactive({
  cost_price: 0,
  effective_date: dayjs().format('YYYY-MM-DD'),
  expire_date: null
})

// SKU成本表单
const skuCostForm = reactive({
  sku_id: '',
  properties_name: '',
  price: 0,
  cost_price: 0,
  effective_date: dayjs().format('YYYY-MM-DD'),
  expire_date: null
})

// 批量设置SKU成本表单
const batchSkuForm = reactive({
  cost_price: 0,
  effective_date: dayjs().format('YYYY-MM-DD'),
  expire_date: null
})

// 成本历史
const itemCostHistory = ref([])
const skuCostHistory = ref([])

// 当前选中的SKU
const currentSku = ref(null)

// 上传headers
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`,
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
  }
})

// 加载商品列表
const loadItems = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      num_iid: searchForm.num_iid,
      title: searchForm.title,
      status: searchForm.status,
      costStatus: searchForm.costStatus
    }
    const res = await getItemList(params)
    // console.log(res)
    itemList.value = res.data.data.list || []
    pagination.total = res.data.data.total || 0
  } catch (error) {
    ElMessage.error('加载商品列表失败')
  } finally {
    loading.value = false
  }
}

// 查询
const searchItems = () => {
  pagination.current = 1
  loadItems()
}

// 重置搜索
const resetSearch = () => {
  searchForm.num_iid = ''
  searchForm.title = ''
  searchForm.status = ''
  searchForm.costStatus = ''
  pagination.current = 1
  loadItems()
}

// 刷新列表
const refreshList = () => {
  loadItems()
}

// 打开成本设置弹窗
const openCostDialog = async (item) => {
  currentItem.value = item
  costDialogVisible.value = true

  // 根据是否有SKU设置默认标签页
  if (item.has_sku) {
    activeCostTab.value = 'sku'      // 有SKU → 默认显示SKU级别成本
    historyType.value = 'sku'
  } else {
    activeCostTab.value = 'item'     // 无SKU → 默认显示商品级别成本
    historyType.value = 'item'
  }


  // 重置表单
  itemCostForm.cost_price = 0
  itemCostForm.effective_date = dayjs().format('YYYY-MM-DD')
  itemCostForm.expire_date = null

  // 加载SKU列表
  if (item.has_sku) {
    await loadSkuList(item.num_iid)
  }

  // 加载成本历史
  await loadCostHistory(item.num_iid)
}

// 加载SKU列表
const loadSkuList = async (numIid) => {
  try {
    const res = await getSkuList({ num_iid: numIid })
    skuList.value = res.data?.data || res.data || []
  } catch (error) {
    console.error('加载SKU列表失败', error)
  }
}

// SKU状态转换
const getSkuStatusText = (status) => {
  const statusMap = {
    'normal': '正常',
    'down_shelf': '下架',
    'delete': '删除'
  }
  return statusMap[status] || status || '未知'
}

const getSkuStatusType = (status) => {
  const typeMap = {
    'normal': 'success',
    'down_shelf': 'warning',
    'delete': 'danger'
  }
  return typeMap[status] || 'info'
}

// 加载成本历史
const loadCostHistory = async (numIid) => {
  try {
    // 加载商品级别成本历史
    const itemRes = await getCostHistory({ num_iid: numIid, type: 'item' })
    itemCostHistory.value = itemRes.data.data || []

    // 加载SKU级别成本历史
    const skuRes = await getCostHistory({ num_iid: numIid, type: 'sku' })
    skuCostHistory.value = skuRes.data.data || []
  } catch (error) {
    console.error('加载成本历史失败', error)
  }
}

// 保存商品级别成本
const saveItemCost = async () => {
  if (!itemCostForm.cost_price || itemCostForm.cost_price <= 0) {
    ElMessage.warning('请输入有效的成本价')
    return
  }
  if (!itemCostForm.effective_date) {
    ElMessage.warning('请选择生效日期')
    return
  }

  try {
    const res = await saveCost({
      num_iid: currentItem.value.num_iid,
      sku_id: null,
      cost_price: itemCostForm.cost_price,
      effective_date: itemCostForm.effective_date,
      expire_date: itemCostForm.expire_date || null
    })

    // 判断是否有重算任务
    if (res.data?.data?.recalc_task_id) {
      ElMessage.success({
        message: '保存成功，您可继续其他操作，稍后可前往「订单&利润统计」查看历史订单成本变化',
        duration: 5000
      })
    } else {
      ElMessage.success('保存成功')
    }

    await loadCostHistory(currentItem.value.num_iid)
    loadItems()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 打开SKU成本设置弹窗
const openSkuCostDialog = (sku) => {
  currentSku.value = sku
  skuCostForm.sku_id = sku.sku_id
  skuCostForm.properties_name = sku.properties_name
  skuCostForm.price = sku.price
  skuCostForm.cost_price = sku.current_cost || 0
  skuCostForm.effective_date = dayjs().format('YYYY-MM-DD')
  skuCostForm.expire_date = null
  skuCostDialogVisible.value = true
}

// 保存SKU成本
const saveSkuCost = async () => {
  if (!skuCostForm.cost_price || skuCostForm.cost_price <= 0) {
    ElMessage.warning('请输入有效的成本价')
    return
  }
  if (!skuCostForm.effective_date) {
    ElMessage.warning('请选择生效日期')
    return
  }

  try {
    const res = await saveCost({
      num_iid: currentItem.value.num_iid,
      sku_id: skuCostForm.sku_id,
      cost_price: skuCostForm.cost_price,
      effective_date: skuCostForm.effective_date,
      expire_date: skuCostForm.expire_date || null
    })

    // 判断是否有重算任务
    if (res.data?.data?.recalc_task_id) {
      ElMessage.success({
        message: '保存成功，您可继续其他操作，稍后可前往「订单&利润统计」查看历史订单成本变化',
        duration: 5000
      })
    } else {
      ElMessage.success('保存成功')
    }

    skuCostDialogVisible.value = false
    await loadSkuList(currentItem.value.num_iid)
    await loadCostHistory(currentItem.value.num_iid)
    loadItems()
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || error.message || '保存失败')
  }
}

// 选中的 SKU 列表
const selectedSkus = ref([])

// SKU 选择变化事件
const handleSkuSelectionChange = (selection) => {
  selectedSkus.value = selection
}

// 批量设置SKU成本
const batchSetSkuCost = () => {
  if (selectedSkus.value.length === 0) {
    ElMessage.warning('请先选择要设置成本的 SKU')
    return
  }

  batchSkuForm.cost_price = 0
  batchSkuForm.effective_date = dayjs().format('YYYY-MM-DD')
  batchSkuForm.expire_date = null
  batchSkuDialogVisible.value = true
}

// 确认批量设置SKU成本
const confirmBatchSetSkuCost = async () => {
  if (!batchSkuForm.cost_price || batchSkuForm.cost_price <= 0) {
    ElMessage.warning('请输入有效的成本价')
    return
  }
  if (!batchSkuForm.effective_date) {
    ElMessage.warning('请选择生效日期')
    return
  }

  try {
    let hasRecalcTask = false
    for (const sku of selectedSkus.value) {
      const res = await saveCost({
        num_iid: currentItem.value.num_iid,
        sku_id: sku.sku_id,
        cost_price: batchSkuForm.cost_price,
        effective_date: batchSkuForm.effective_date,
        expire_date: batchSkuForm.expire_date || null
      })
      if (res.data?.data?.recalc_task_id) {
        hasRecalcTask = true
      }
    }
    if (hasRecalcTask) {
      ElMessage.success({
        message: `成功设置 ${selectedSkus.value.length} 个 SKU 的成本，您可继续其他操作，稍后可前往「订单&利润统计」查看历史订单成本变化`,
        duration: 5000
      })
    } else {
      ElMessage.success(`成功设置 ${selectedSkus.value.length} 个 SKU 的成本`)
    }

    batchSkuDialogVisible.value = false
    selectedSkus.value = []  // 清空选中
    await loadSkuList(currentItem.value.num_iid)
    await loadCostHistory(currentItem.value.num_iid)
    loadItems()
  } catch (error) {
    ElMessage.error('批量设置失败')
  }
}

// 复制商品成本到所有SKU
const copyItemCostToSkus = async () => {
  if (!itemCostHistory.value.length) {
    ElMessage.warning('请先设置商品级别成本')
    return
  }

  const currentItemCost = itemCostHistory.value.find(item => isCurrentEffective(item))
  if (!currentItemCost) {
    ElMessage.warning('当前没有生效的商品级别成本')
    return
  }

  ElMessageBox.confirm(
    `将把当前商品成本 ¥${currentItemCost.cost_price} 复制到所有SKU，是否继续？`,
    '确认复制',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
  ).then(async () => {
    try {
      for (const sku of skuList.value) {
        await saveCost({
          num_iid: currentItem.value.num_iid,
          sku_id: sku.sku_id,
          cost_price: currentItemCost.cost_price,
          effective_date: dayjs().format('YYYY-MM-DD'),
          expire_date: null
        })
      }
      ElMessage.success('复制成功')
      await loadSkuList(currentItem.value.num_iid)
      await loadCostHistory(currentItem.value.num_iid)
    } catch (error) {
      ElMessage.error('复制失败')
    }
  })
}

// 查看成本历史
const viewCostHistory = async (item) => {
  currentItem.value = item
  activeCostTab.value = 'history'
  // 🔥 有SKU默认显示SKU级别，无SKU默认显示商品级别
  historyType.value = item.has_sku ? 'sku' : 'item'
  costDialogVisible.value = true

  // 加载成本历史
  await loadCostHistory(item.num_iid)

  // 🔥 关键：如果商品有SKU，也需要加载SKU列表（用于SKU级别成本历史）
  if (item.has_sku) {
    await loadSkuList(item.num_iid)
  }
}

// 删除成本记录
const deleteCostRecord = async (record, type) => {
  ElMessageBox.confirm('确定删除该成本记录吗？删除后不可恢复。', '提示', { type: 'warning' })
    .then(async () => {
      await deleteCost({ id: record.id })
      ElMessage.success('删除成功')
      await loadCostHistory(currentItem.value.num_iid)
      if (type === 'item') {
        await loadSkuList(currentItem.value.num_iid)
      }
      if (type === 'sku' || currentItem.value?.has_sku) {
        await loadSkuList(currentItem.value.num_iid)
      }
      loadItems()
    })
    .catch(() => { })
}

// 判断是否未来生效（未开始）
const isFutureEffective = (record) => {
  const today = dayjs().format('YYYY-MM-DD')
  return record.effective_date > today
}

// 判断是否当前生效
const isCurrentEffective = (record) => {
  const today = dayjs().format('YYYY-MM-DD')
  return record.effective_date <= today &&
    (!record.expire_date || record.expire_date >= today)
}

// 导出模板
const exportTemplate = () => {
  exportCostTemplate()
}

// 上传前校验
const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel'
  if (!isExcel) {
    ElMessage.error('只能上传Excel文件')
    return false
  }
  return true
}

// 上传成功
const handleUploadSuccess = (response) => {
  if (response.code === 200) {
    const errors = response.data?.errors || []

    // 判断是否有错误
    const hasError = errors.length > 0

    // 获取成功条数
    const match = response.msg.match(/成功(\d+)条/)
    const successCount = match ? parseInt(match[1]) : 0

    if (hasError && successCount > 0) {
      // 部分成功：弹窗展示错误明细，第一行显示 msg
      ElMessageBox.alert(
        `<div style="text-align: left; line-height: 1.8;">
          <div style="margin-bottom: 8px; font-weight: 600;">${response.msg}</div>
          出错明细：<br>
          ${errors.map(err => `• ${err}`).join('<br>')}
        </div>`,
        '导入提示',
        {
          confirmButtonText: '知道了',
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
      // 刷新列表
      showBatchImport.value = false
      loadItems()
    } else if (hasError && successCount === 0) {
      // 全部失败：弹窗展示错误
      ElMessageBox.alert(
        `<div style="text-align: left; line-height: 1.8;">
          <div style="margin-bottom: 8px; font-weight: 600;">${response.msg}</div>
          ${errors.map(err => `• ${err}`).join('<br>')}
        </div>`,
        '导入失败',
        {
          confirmButtonText: '知道了',
          type: 'error',
          dangerouslyUseHTMLString: true
        }
      )
    } else {
      // 全部成功
      ElMessage.success(response.msg)
      showBatchImport.value = false
      loadItems()
    }
  } else {
    ElMessage.error(response.msg || '导入失败')
  }

}

// 上传失败
const handleUploadError = () => {
  ElMessage.error('上传失败，请稍后重试')
}

// 检查 URL 参数并应用筛选
const applyFiltersFromUrl = () => {
  const status = route.query.status
  const costStatus = route.query.costStatus

  if (status) {
    searchForm.status = status
  }
  if (costStatus) {
    searchForm.costStatus = costStatus
  }

  if (status || costStatus) {
    pagination.current = 1
    loadItems()
  }
}

// 监听路由参数变化
watch(
  () => route.query,
  (newQuery) => {
    const status = newQuery.status
    const costStatus = newQuery.costStatus

    // 只在有参数时应用，避免无限循环
    if (status !== undefined || costStatus !== undefined) {
      searchForm.status = status || ''
      searchForm.costStatus = costStatus || ''
      pagination.current = 1
      loadItems()
    }
  },
  { deep: true }
)

// 监听弹窗关闭
watch(costDialogVisible, (newVal) => {
  if (!newVal) {
    selectedSkus.value = []  // 清空选中
  }
})

// 禁用 180 天前的日期
const disabledDate = (time) => {
  const now = new Date()
  const oneEightyDaysAgo = new Date()
  oneEightyDaysAgo.setDate(now.getDate() - 180)
  return time.getTime() < oneEightyDaysAgo.getTime()
}

onMounted(() => {
  applyFiltersFromUrl()
  // 如果 URL 没有参数，正常加载全部
  if (!route.query.status && !route.query.costStatus) {
    loadItems()
  }
})
</script>

<style scoped>
.item-cost-manage {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-desc {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.item-list-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.image-placeholder {
  width: 50px;
  height: 50px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 12px;
}

.image-placeholder-small {
  width: 60px;
  height: 60px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 12px;
}

.text-muted {
  color: #c0c4cc;
}

.form-tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.sku-cost-section {
  padding: 16px 0;
}

.sku-batch-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.cost-history-section {
  padding: 8px 0;
}

.empty-state {
  padding: 40px 0;
}

.batch-import-content {
  padding: 16px 0;
}

.upload-area {
  margin-top: 20px;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

ul {
  margin: 8px 0 0 20px;
  padding: 0;
}

li {
  margin: 4px 0;
  color: #606266;
}

/* 商品信息单元格样式 - 左右布局 */
.product-info-cell {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 5px 0;
}

/* 左侧图片样式 */
.product-image {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  overflow: hidden;
  border-radius: 4px;
  background-color: #f5f5f5;
  border: 1px solid #ebeef5;
}

.product-image .el-image {
  width: 60px;
  height: 60px;
}

/* 右侧详情区域 - 上下布局 */
.product-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  /* 防止溢出 */
}

/* 商品标题超链接样式 */
.product-title-link {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  display: inline-block;
  word-break: break-word;
}

.product-title-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}

/* 商品ID样式 - 小字体 */
.product-id {
  font-size: 13px;
  color: #909399;
  font-family: monospace;
}

.id-label {
  color: #c0c4cc;
}

.date-hint {
  margin-top: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.8;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: #f0f7ff;
  color: #1677FF;
  border: 1px solid #d6e8ff;
  width: 100%;
}

.date-hint .el-icon {
  margin-top: 2px;
  flex-shrink: 0;
  font-size: 14px;
}

.date-hint strong {
  font-weight: 600;
}
</style>