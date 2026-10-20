<template>
    <FormList ref="formListRef" :withSku="true" :sort="sort" :order="order" :currentPage="currentPage"
        :pageSize="pageSize" @loaded="handleLoaded" />
    <el-table :data="tableData" row-key="id" ref="tableRef" @sort-change="handleSortChange">
        <el-table-column type="index" width="50" label="" :index="indexMethod" />
        <el-table-column type="selection" width="45" class-name="col-check" :reserve-selection="true" />
        <el-table-column width="210">
            <template #header>
                <el-button size="small" type="primary" plain @click="batchSave()" :loading="batchSaveLoading">
                    {{ batchSaveLoading ? '保存中' : '批量保存修改' }}
                </el-button>
            </template>
            <template #default="scope">
                <div class="textarea-wrap">
                    <div>
                        <a :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank">
                            <el-image :src="scope.row.pic_url + '_60x60.jpg'" style="width:60px">
                                <template #error>&nbsp;</template>
                            </el-image>
                        </a>
                    </div>
                    <div class="ml-5 text-gray">
                        <el-row style="word-break: break-all">ID:{{ scope.row.num_iid }}</el-row>
                        <el-row>状态:{{ getApproveStatus(scope.row.approve_status) }}</el-row>
                        <el-row>商家编码:{{ scope.row.outer_id ?? '无' }}</el-row>
                        <el-row v-if="scope.row.updateStatus">
                            <el-text v-if="scope.row.updateStatus == 'success'" type="success" size="small">
                                <el-icon>
                                    <CircleCheck />
                                </el-icon>修改成功
                            </el-text>
                            <el-text v-else-if="scope.row.updateStatus == 'fail'" type="danger" size="small"
                                truncated>
                                <el-tooltip :content="'修改出错：' + (scope.row.failMsg || '')" placement="top"
                                    :show-after="200">
                                    <span>修改出错：{{ scope.row.failMsg }}</span>
                                </el-tooltip>
                            </el-text>
                        </el-row>
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="价格修改">
            <template #default="scope">
                <!-- 一口价行 -->
                <div class="price-edit-row">
                    <span class="price-label">一口价</span>
                    <span class="price-original">¥{{ scope.row.price }}</span>
                    <span class="arrow">→</span>
                    <el-input-number v-model="scope.row.newItemPrice" :min="0" :precision="2" :step="1"
                        controls-position="right" style="width:140px" />
                    <span>元</span>
                </div>
                <!-- 各SKU行 -->
                <div v-if="scope.row.skus && scope.row.skus.length">
                    <div v-for="(sku, idx) in scope.row.skus" :key="idx" class="price-edit-row">
                        <span class="price-label">{{ formatSkuName(sku.properties_name) }}</span>
                        <span class="price-original">¥{{ sku.price }}</span>
                        <span class="arrow">→</span>
                        <el-input-number v-model="sku.newPrice" :min="0" :precision="2" :step="1"
                            controls-position="right" style="width:140px" />
                        <span>元</span>
                    </div>
                </div>
                <div v-else class="gray-tip">该商品无SKU</div>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="185">
            <template #default="scope">
                <el-button size="small" type="success" plain @click="save(scope.row, scope.$index)"
                    :loading="scope.row.loading">
                    {{ scope.row.loading ? '保存中' : '保存修改' }}
                </el-button>
                <el-button size="small" plain @click="showDetails(scope.row.num_iid, scope.$index)">修改记录</el-button>
            </template>
        </el-table-column>
    </el-table>
    <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange"
        :current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper" :total="total">
    </el-pagination>
    <PriceListDetail ref="detailRef" :numIid="detailNumIid" @recovered="handleRecovered" />
    <W2AuthDialog />
</template>
<script setup>
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import FormList from '../FormList.vue'
import PriceListDetail from './PriceListDetail.vue'
import W2AuthDialog from './W2AuthDialog.vue'
import { getItemWirelessUrl, getApproveStatus } from '@/utils/index'
import request from '@/utils/request'
import { useW2Auth } from '@/utils/w2auth'
import { useIndexMethod } from '@/composables/useIndexMethod'
import { CircleCheck } from '@element-plus/icons-vue'

const props = defineProps({
    quotaStatus: Object
})
const emit = defineEmits(['refreshQuota'])

// 排序
const sort = ref('')
const order = ref('')
const handleSortChange = (column) => {
    sort.value = column.prop
    order.value = column.order === 'ascending' ? 'asc' : 'desc'
}

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const handleCurrentChange = (val) => {
    currentPage.value = val
}
const handleSizeChange = (val) => {
    pageSize.value = val
}

// 数据查询完成
const tableData = ref([])
const handleLoaded = (data, totalNum) => {
    // 价格列表修改不需要展开子行，清除 children 避免 el-table 自动渲染树形结构
    data.forEach(item => {
        delete item.children
        // 初始化一口价编辑字段（el-input-number 需数值类型）
        item.newItemPrice = Number(item.price) || 0
        if (item.skus && item.skus.length) {
            item.skus.forEach(sku => {
                sku.newPrice = Number(sku.price) || 0
            })
        }
    })
    tableData.value = data
    total.value = totalNum
}

// 分页 index 递增
const indexMethod = (index) => {
    const { newIndex } = useIndexMethod(index, currentPage, pageSize)
    return newIndex.value
}

// SKU 名称精简：去掉 "pid:vid:" 和 "颜色分类:" 等属性名前缀，只保留规格值
const formatSkuName = (propertiesName) => {
    if (!propertiesName) return 'SKU'
    return propertiesName.replace(/\d+:/g, '').replace(/^[^:：]+[:：]/, '') || 'SKU'
}

// 校验单行变更情况：返回 { itemChanged, skuChanged }
const checkRowChanged = (row) => {
    const itemChanged = row.newItemPrice != row.price
    const skuChanged = row.skus && row.skus.length && row.skus.some(sku => sku.newPrice != sku.price)
    return { itemChanged, skuChanged }
}

// 构造单行请求数据
const buildRowRequest = (row) => {
    const skus = []
    if (row.skus && row.skus.length) {
        row.skus.forEach(sku => {
            if (sku.newPrice != sku.price) {
                skus.push({ skuId: sku.sku_id, price: String(sku.newPrice) })
            }
        })
    }
    const itemPrice = row.newItemPrice != row.price ? String(row.newItemPrice) : ''
    return { numIid: row.num_iid, itemPrice, skus }
}

// 同步更新行原价（保存成功后调用）
const syncRowOriginalPrice = (row) => {
    row.price = row.newItemPrice
    if (row.skus && row.skus.length) {
        row.skus.forEach(sku => {
            if (sku.newPrice != null && sku.newPrice != undefined) {
                sku.price = sku.newPrice
            }
        })
    }
}

// 保存修改
const save = (row, index) => {
    const { itemChanged, skuChanged } = checkRowChanged(row)
    if (!itemChanged && !skuChanged) {
        ElMessage.error('价格未发生变化，无需修改')
        return
    }
    // 校验新价格 > 0
    if (itemChanged && Number(row.newItemPrice) <= 0) {
        ElMessage.error('一口价必须大于0')
        return
    }
    if (row.skus && row.skus.length) {
        for (let i = 0; i < row.skus.length; i++) {
            if (row.skus[i].newPrice != row.skus[i].price && Number(row.skus[i].newPrice) <= 0) {
                ElMessage.error('SKU价格必须大于0')
                return
            }
        }
    }
    ElMessageBox.confirm(
        '确定修改价格？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        }
    ).then(() => {
        doSave(row, index)
    }).catch(() => { })
}
const doSave = async (row, index) => {
    // W2 授权预检：失效时弹授权弹窗，授权通过后自动重新执行本函数
    if (!(await ensureW2Auth(() => doSave(row, index)))) return
    const reqData = buildRowRequest(row)
    row.loading = true
    request.post('/api/v1/batch-update-price/save-list-detail', reqData).then(response => {
        row.loading = false
        const d = response.data
        if (d.code === 0 && d.data?.status !== 'fail') {
            row.updateStatus = 'success'
            syncRowOriginalPrice(row)
            ElMessage.success('保存成功')
            emit('refreshQuota')
        } else {
            row.updateStatus = 'fail'
            row.failMsg = d.data?.failMsg || d.msg || '保存失败'
            ElMessage.error(row.failMsg)
        }
    }).catch((error) => {
        row.loading = false
        row.updateStatus = 'fail'
        row.failMsg = error.response?.data?.msg || '保存失败'
    })
}

// 批量保存修改
const tableRef = useTemplateRef('tableRef')
const batchSaveLoading = ref(false)
const batchSave = () => {
    const selectionRows = tableRef.value.getSelectionRows()
    if (!selectionRows.length) {
        ElMessage.error('请选择需要修改的商品')
        return
    }
    for (let i = 0; i < selectionRows.length; i++) {
        const row = selectionRows[i]
        const { itemChanged, skuChanged } = checkRowChanged(row)
        if (!itemChanged && !skuChanged) {
            ElMessage.error('第' + (i + 1) + '个选择项价格未发生变化，无需修改')
            return
        }
        if (itemChanged && Number(row.newItemPrice) <= 0) {
            ElMessage.error('第' + (i + 1) + '个选择项一口价必须大于0')
            return
        }
        if (row.skus && row.skus.length) {
            for (let j = 0; j < row.skus.length; j++) {
                if (row.skus[j].newPrice != row.skus[j].price && Number(row.skus[j].newPrice) <= 0) {
                    ElMessage.error('第' + (i + 1) + '个选择项SKU价格必须大于0')
                    return
                }
            }
        }
    }
    ElMessageBox.confirm(
        '即将修改<span class="h-b">' + selectionRows.length + '</span>个商品价格，确定保存修改？<br />提示：可在修改记录中查看和恢复数据',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info',
            dangerouslyUseHTMLString: true
        }
    ).then(() => {
        doBatchSave(selectionRows)
    }).catch(() => { })
}
const doBatchSave = async (rows) => {
    // W2 授权预检
    if (!(await ensureW2Auth(() => doBatchSave(rows)))) return
    const reqRows = rows.map(row => buildRowRequest(row))
    batchSaveLoading.value = true
    request.post('/api/v1/batch-update-price/batch-save-list', {
        rows: reqRows
    }).then(response => {
        batchSaveLoading.value = false
        const d = response.data
        if (d.code === 0) {
            const data = d.data || {}
            const success = data.success || 0
            const fail = data.fail || 0
            const result = data.result || []
            ElMessageBox.alert(
                '成功修改<span class="h-b">' + success + '</span>个商品' + (fail > 0 ? '，出错<span class="h-b">' + fail + '</span>个商品' : ''),
                '提示',
                {
                    dangerouslyUseHTMLString: true,
                }
            )
            updateSaveStatus(result)
            tableRef.value.clearSelection()
            if (success > 0) {
                emit('refreshQuota')
            }
        } else {
            ElMessage.error(d.msg || '批量保存失败')
        }
    }).catch(() => {
        batchSaveLoading.value = false
    })
}
const updateSaveStatus = (result) => {
    result.forEach(val => {
        const index = getIndex(val.numIid)
        if (index > -1) {
            tableData.value[index].updateStatus = val.status
            tableData.value[index].failMsg = val.failMsg ?? null
            if (val.status === 'success') {
                syncRowOriginalPrice(tableData.value[index])
            }
        }
    })
}
const getIndex = (numIid) => {
    return tableData.value.findIndex(val => numIid == val.num_iid)
}

// 显示修改记录
const detailNumIid = ref()
const detailRef = useTemplateRef('detailRef')
const showDetails = (numIid, index) => {
    detailNumIid.value = numIid
    detailRef.value.dialogVisible = true
    detailRef.value.dialogTitle = '修改记录 | 商品ID：' + numIid
}

// 恢复后重新加载列表
const formListRef = useTemplateRef('formListRef')
const handleRecovered = () => {
    formListRef.value.getItems()
}

// W2 授权
const { ensureW2Auth, stopW2Check } = useW2Auth()

onUnmounted(() => {
    stopW2Check()
})
</script>
<style scoped>
.el-pagination {
    margin-top: 15px;
}

.textarea-wrap {
    display: flex;
    align-items: center;
}

/* 勾选列压内边距：45px 宽下 checkbox 完整显示 */
:deep(.col-check .cell) {
    padding: 0 2px;
}

.price-edit-row {
    display: flex;
    align-items: center;
    margin: 4px 0;
}

.price-edit-row .price-label {
    flex: 0 0 240px;
    color: #909399;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.price-edit-row .price-original {
    flex: 0 0 60px;
    margin: 0 8px;
    text-align: right;
    color: #c0c4cc;
    text-decoration: line-through;
    font-size: 13px;
}

.price-edit-row .arrow {
    flex: 0 0 20px;
    margin-right: 8px;
    text-align: center;
    color: #909399;
}

.gray-tip {
    color: #c0c4cc;
    font-size: 13px;
    margin-top: 4px;
}
</style>
