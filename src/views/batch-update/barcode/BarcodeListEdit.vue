<template>
    <FormList ref="formListRef" :withSku="true" :currentPage="currentPage" :pageSize="pageSize"
        @loaded="handleLoaded" />
    <div class="table-toolbar">
        <el-button size="small" type="primary" plain @click="batchSave()" :loading="batchSaveLoading">
            {{ batchSaveLoading ? '保存中' : '批量保存修改' }}
        </el-button>
        <span class="gray-tip">只修改需要变更的条形码，留空表示删除该条形码，未改动的会跳过</span>
    </div>
    <el-table :data="tableData" row-key="id" ref="tableRef">
        <el-table-column type="index" width="50" label="" :index="indexMethod" />
        <el-table-column type="selection" width="30" class-name="col-check" :reserve-selection="true" />
        <el-table-column label="商品信息" width="260">
            <template #default="scope">
                <div class="textarea-wrap">
                    <div>
                        <a :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank">
                            <el-image :src="scope.row.pic_url + '_60x60.jpg'" style="width:60px">
                                <template #error>&nbsp;</template>
                            </el-image>
                        </a>
                    </div>
                    <div class="ml-5 text-gray item-info">
                        <el-row>{{ scope.row.title }}</el-row>
                        <el-row style="word-break: break-all">ID:{{ scope.row.num_iid }}</el-row>
                        <el-row>状态:{{ getApproveStatus(scope.row.approve_status) }}</el-row>
                        <el-row>商家编码:{{ scope.row.outer_id ?? '无' }}</el-row>
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="条形码对象" min-width="210">
            <template #default="scope">
                <div class="attr-line">商品级条形码</div>
                <div v-for="sku in scope.row.skus" :key="sku.sku_id" class="attr-line">
                    {{ sku.propsDisplay || 'SKU' }}
                </div>
            </template>
        </el-table-column>
        <el-table-column label="原条形码" min-width="150">
            <template #default="scope">
                <div class="attr-line text-gray">{{ scope.row.originalBarcode || '-' }}</div>
                <div v-for="sku in scope.row.skus" :key="sku.sku_id" class="attr-line text-gray">
                    {{ sku.originalBarcode || '-' }}
                </div>
            </template>
        </el-table-column>
        <el-table-column label="修改后条形码" min-width="150">
            <template #default="scope">
                <div class="attr-line">
                    <el-input v-model="scope.row.newBarcode" size="small" placeholder="留空则删除条形码" />
                </div>
                <div v-for="sku in scope.row.skus" :key="sku.sku_id" class="attr-line">
                    <el-input v-model="sku.newBarcode" size="small" placeholder="留空则删除条形码" />
                </div>
            </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
            <template #default="scope">
                <div class="attr-line">
                    <el-text v-if="scope.row.barcodeStatus === 'success'" type="success" size="small">修改成功</el-text>
                    <el-tooltip v-else-if="scope.row.barcodeStatus === 'fail'"
                        :content="'修改出错：' + (scope.row.barcodeFailMsg || '')" placement="top" :show-after="200">
                        <el-text type="danger" size="small">修改失败</el-text>
                    </el-tooltip>
                    <span v-else class="gray-tip">未修改</span>
                </div>
                <div v-for="sku in scope.row.skus" :key="sku.sku_id" class="attr-line">
                    <el-text v-if="sku.barcodeStatus === 'success'" type="success" size="small">修改成功</el-text>
                    <el-tooltip v-else-if="sku.barcodeStatus === 'fail'" :content="'修改出错：' + (sku.barcodeFailMsg || '')"
                        placement="top" :show-after="200">
                        <el-text type="danger" size="small">修改失败</el-text>
                    </el-tooltip>
                    <span v-else class="gray-tip">未修改</span>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="190">
            <template #default="scope">
                <el-button size="small" type="success" plain @click="save(scope.row)" :loading="scope.row.loading"
                    :disabled="!hasRowChange(scope.row)">
                    {{ scope.row.loading ? '保存中' : '保存修改' }}
                </el-button>
                <el-button size="small" plain @click="showDetails(scope.row.num_iid)">修改记录</el-button>
            </template>
        </el-table-column>
    </el-table>
    <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange" :current-page="currentPage"
        v-model:page-size="pageSize" :page-sizes="[10, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
        :total="total">
    </el-pagination>
    <BarcodeListDetail ref="detailRef" :numIid="detailNumIid" @recovered="handleRecovered" />
</template>

<script setup>
import { ref, useTemplateRef } from 'vue'
import FormList from '../FormList.vue'
import BarcodeListDetail from './BarcodeListDetail.vue'
import { getItemWirelessUrl, getApproveStatus } from '@/utils/index'
import { validateBarcode } from './barcodeRule'
import request from '@/utils/request'
import { useIndexMethod } from '@/composables/useIndexMethod'

const emit = defineEmits(['refreshQuota'])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const handleCurrentChange = (val) => {
    currentPage.value = val
}
const handleSizeChange = () => {
    currentPage.value = 1
}

// 解析 properties_name（pid:vid:规格名:规格值;...）只展示规格值
const parseSkuName = (propertiesName) => {
    if (!propertiesName) return ''
    return propertiesName.split(';').map(seg => {
        const parts = seg.split(':')
        return parts.length >= 4 ? parts.slice(3).join(':') : seg
    }).filter(Boolean).join(' / ')
}

// 数据查询完成
const tableData = ref([])
const handleLoaded = (data, totalNum) => {
    // 列表修改不需要展开子行，清除 children 避免 el-table 自动渲染树形结构
    data.forEach(item => {
        delete item.children
        item.originalBarcode = item.barcode ?? ''
        item.newBarcode = item.originalBarcode
        item.barcodeStatus = ''
        item.barcodeFailMsg = ''
        item.loading = false
            ; (item.skus || []).forEach(sku => {
                sku.propsDisplay = parseSkuName(sku.properties_name || '')
                sku.originalBarcode = sku.barcode ?? ''
                sku.newBarcode = sku.originalBarcode
                sku.barcodeStatus = ''
                sku.barcodeFailMsg = ''
            })
    })
    tableData.value = data
    total.value = totalNum
}

// 分页 index 递增
const indexMethod = (index) => {
    const { newIndex } = useIndexMethod(index, currentPage, pageSize)
    return newIndex.value
}

// 该行是否有条形码变化
const hasRowChange = (row) => {
    if (row.newBarcode !== row.originalBarcode) return true
    return (row.skus || []).some(sku => sku.newBarcode !== sku.originalBarcode)
}

// 校验该行待修改的条形码（空值表示删除，允许）
const checkRowBarcode = (row) => {
    if (row.newBarcode !== row.originalBarcode) {
        const msg = validateBarcode(row.newBarcode)
        if (msg) {
            ElMessage.error('商品条形码：' + msg)
            return false
        }
    }
    for (const sku of row.skus || []) {
        if (sku.newBarcode === sku.originalBarcode) continue
        const msg = validateBarcode(sku.newBarcode)
        if (msg) {
            ElMessage.error((sku.propsDisplay || 'SKU') + '：' + msg)
            return false
        }
    }
    return true
}

// 构造单行请求数据，只提交发生变化的条形码
const buildRowRequest = (row) => {
    const req = { numIid: row.num_iid }
    if (row.newBarcode !== row.originalBarcode) {
        req.itemBarcode = row.newBarcode
    }
    const skus = (row.skus || []).filter(sku => sku.newBarcode !== sku.originalBarcode)
    if (skus.length) {
        req.skus = skus.map(sku => ({ skuId: sku.sku_id, barcode: sku.newBarcode }))
    }
    return req
}

// 选择项可能来自之前的页码（reserve-selection 会保留），优先取当前表格里的同一行对象
const resolveLiveRow = (row) => {
    const live = tableData.value.find(item => String(item.num_iid) === String(row.num_iid))
    return live || row
}

// 保存修改
const save = (row) => {
    const liveRow = resolveLiveRow(row)
    if (!hasRowChange(liveRow)) {
        ElMessage.error('条形码未发生变化，无需修改')
        return
    }
    if (!checkRowBarcode(liveRow)) {
        return
    }
    ElMessageBox.confirm('确定修改条形码？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
    }).then(() => {
        doSave(liveRow)
    }).catch(() => { })
}

const doSave = (row) => {
    row.loading = true
    request.post('/api/v1/batch-update-barcode/save-list-detail', buildRowRequest(row)).then(response => {
        row.loading = false
        const d = response.data
        if (d.code === 0 && d.data?.status !== 'fail') {
            syncSavedRow(row)
            ElMessage.success('保存成功')
            emit('refreshQuota')
        } else {
            row.barcodeStatus = 'fail'
            row.barcodeFailMsg = d.data?.failMsg || d.msg || '保存失败'
            ElMessage.error(row.barcodeFailMsg)
        }
    }).catch(() => {
        // 错误已由 request.js 拦截器提示，避免重复弹，只复位 loading
        row.loading = false
    })
}

// 保存成功后同步本地原值与状态
const syncSavedRow = (row) => {
    if (row.newBarcode !== row.originalBarcode) {
        row.originalBarcode = row.newBarcode
        row.barcodeStatus = 'success'
        row.barcodeFailMsg = ''
    }
    ; (row.skus || []).forEach(sku => {
        if (sku.newBarcode !== sku.originalBarcode) {
            sku.originalBarcode = sku.newBarcode
            sku.barcodeStatus = 'success'
            sku.barcodeFailMsg = ''
        }
    })
}

// 批量保存修改
const tableRef = useTemplateRef('tableRef')
const formListRef = useTemplateRef('formListRef')
const batchSaveLoading = ref(false)
const batchSave = () => {
    const selectionRows = tableRef.value.getSelectionRows()
    if (!selectionRows.length) {
        ElMessage.error('请选择需要修改的商品')
        return
    }
    const reqRows = []
    const liveRows = []
    let unchangedCount = 0
    for (let i = 0; i < selectionRows.length; i++) {
        const row = resolveLiveRow(selectionRows[i])
        if (!hasRowChange(row)) {
            unchangedCount++
            continue
        }
        if (!checkRowBarcode(row)) {
            ElMessage.error('第' + (i + 1) + '个选择项条形码校验失败')
            return
        }
        liveRows.push(row)
        reqRows.push(buildRowRequest(row))
    }
    if (!reqRows.length) {
        ElMessage.error(unchangedCount > 1 ? '所选商品条形码均未发生变化，无需修改' : '条形码未发生变化，无需修改')
        return
    }
    ElMessageBox.confirm(
        '即将修改<span class="h-b">' + reqRows.length + '</span>个商品的条形码，确定保存修改？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info',
            dangerouslyUseHTMLString: true
        }
    ).then(() => {
        doBatchSave(reqRows, liveRows)
    }).catch(() => { })
}

const doBatchSave = (reqRows, liveRows) => {
    batchSaveLoading.value = true
    request.post('/api/v1/batch-update-barcode/batch-save-list', {
        rows: reqRows
    }).then(response => {
        batchSaveLoading.value = false
        const d = response.data
        if (d.code === 0) {
            const data = d.data || {}
            const success = data.success ?? reqRows.length
            const fail = data.fail || 0
            ElMessageBox.alert(
                '成功修改<span class="h-b">' + success + '</span>个商品' + (fail > 0 ? '，出错<span class="h-b">' + fail + '</span>个商品' : ''),
                '提示',
                { dangerouslyUseHTMLString: true }
            )
            if (fail === 0) {
                liveRows.forEach(row => syncSavedRow(row))
                tableRef.value.clearSelection()
                emit('refreshQuota')
            } else {
                formListRef.value.getItems()
            }
        } else {
            ElMessage.error(d.msg || '批量保存失败')
        }
    }).catch(() => {
        // 错误已由 request.js 拦截器提示，避免重复弹，只复位 loading
        batchSaveLoading.value = false
    })
}

// 显示商品修改记录
const detailRef = useTemplateRef('detailRef')
const detailNumIid = ref()
const showDetails = (numIid) => {
    detailNumIid.value = numIid
    detailRef.value.dialogVisible = true
    detailRef.value.dialogTitle = '修改记录 | 商品ID：' + numIid
}
// 恢复/重试后刷新列表，让原条形码与最新数据一致
const handleRecovered = () => {
    formListRef.value.getItems()
}
</script>

<style scoped>
.el-pagination {
    margin-top: 15px;
}

.textarea-wrap {
    display: flex;
    align-items: flex-start;
}

/* 图片容器行高归零，避免行内基线留白把图片往下推，保证图片顶部与标题顶部齐平 */
.textarea-wrap>div:first-child {
    line-height: 0;
    flex-shrink: 0;
}

/* 商品信息列字号 12px，与其余列的 .attr-line 保持一致 */
.item-info {
    font-size: 12px;
    /* 表格 .cell 的 23px 行高会被继承，12px 文字上方留出约 5px 行距留白，
       视觉上标题比左侧图片低；收紧行高后首行文字顶部才能与图片顶部齐平 */
    line-height: 1.3;
}

.item-info>.el-row:first-child {
    margin-top: -1px;
}

.item-info>.el-row {
    margin-bottom: 6px;
}

/* 勾选列压内边距：45px 宽下 checkbox 完整显示 */
:deep(.col-check .cell) {
    padding: 0 2px;
}

.table-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.attr-line {
    display: flex;
    align-items: center;
    min-height: 32px;
    font-size: 12px;
    line-height: 1.6;
}

.gray-tip {
    color: #909399;
    font-size: 12px;
}

.ml-5 {
    margin-left: 5px;
}

.h-b {
    font-weight: bold;
    color: #409EFF;
}

.text-gray {
    color: #909399;
}
</style>
