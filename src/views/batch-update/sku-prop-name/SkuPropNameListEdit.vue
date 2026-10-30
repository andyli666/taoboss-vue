﻿<template>
    <FormList ref="formListRef" :withSku="true" :sort="sort" :order="order" :currentPage="currentPage"
        :pageSize="pageSize" @loaded="handleLoaded" />
    <el-table :data="tableData" row-key="id" ref="tableRef" @sort-change="handleSortChange">
        <el-table-column type="index" width="50" label="" :index="indexMethod" />
        <el-table-column type="selection" width="45" class-name="col-check" :reserve-selection="true" />
        <el-table-column width="250">
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
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="SKU属性" min-width="140">
            <template #default="scope">
                <div v-if="scope.row.skus && scope.row.skus.length">
                    <template v-for="(sku, skuIdx) in scope.row.skus" :key="skuIdx">
                        <div v-for="(prop, propIdx) in sku.props" :key="propIdx" class="attr-line">
                            {{ prop.propName || '属性' }}
                            <span v-if="!prop.editable" class="gray-tip">（不可改）</span>
                        </div>
                    </template>
                </div>
                <div v-else class="gray-tip">无SKU</div>
            </template>
        </el-table-column>
        <el-table-column label="原SKU名称" min-width="150">
            <template #default="scope">
                <div v-if="scope.row.skus && scope.row.skus.length">
                    <template v-for="(sku, skuIdx) in scope.row.skus" :key="skuIdx">
                        <div v-for="(prop, propIdx) in sku.props" :key="propIdx" class="attr-line text-gray">
                            {{ prop.originalValue === '' || prop.originalValue === null || prop.originalValue === undefined ? '-' : prop.originalValue }}
                        </div>
                    </template>
                </div>
                <div v-else class="gray-tip">-</div>
            </template>
        </el-table-column>
        <el-table-column label="修改后SKU名称" min-width="260">
            <template #default="scope">
                <div v-if="scope.row.skus && scope.row.skus.length">
                    <template v-for="(sku, skuIdx) in scope.row.skus" :key="skuIdx">
                        <div v-for="(prop, propIdx) in sku.props" :key="propIdx" class="attr-line">
                            <el-input v-if="prop.editable" v-model="prop.newValue" size="small"
                                :placeholder="'请输入' + (prop.propName || '属性') + '的SKU名称'" />
                            <span v-else class="text-gray">
                                {{ prop.originalValue === '' || prop.originalValue === null || prop.originalValue === undefined ? '-' : prop.originalValue }}
                            </span>
                        </div>
                    </template>
                </div>
                <div v-else class="gray-tip">-</div>
            </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
            <template #default="scope">
                <div v-if="scope.row.skus && scope.row.skus.length">
                    <template v-for="(sku, skuIdx) in scope.row.skus" :key="skuIdx">
                        <div v-for="(prop, propIdx) in sku.props" :key="propIdx" class="attr-line">
                            <template v-if="propIdx === 0">
                                <el-text v-if="sku.updateStatus == 'success'" type="success" size="small">修改成功</el-text>
                                <el-tooltip v-else-if="sku.updateStatus == 'fail'"
                                    :content="'修改出错：' + (sku.failMsg || '')" placement="top" :show-after="200">
                                    <el-text type="danger" size="small">修改失败</el-text>
                                </el-tooltip>
                                <span v-else class="gray-tip">未修改</span>
                            </template>
                        </div>
                    </template>
                </div>
                <div v-else class="gray-tip">-</div>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="185">
            <template #default="scope">
                <el-button size="small" type="success" plain @click="save(scope.row)"
                    :loading="scope.row.loading" :disabled="!(scope.row.skus && scope.row.skus.length)">
                    {{ scope.row.loading ? '保存中' : '保存修改' }}
                </el-button>
                <el-button size="small" plain @click="showDetails(scope.row.num_iid)">修改记录</el-button>
            </template>
        </el-table-column>
    </el-table>
    <div class="gray-tip table-tip">提示：每个SKU名称单独一行，只修改需要变更的SKU名称，未改动的会跳过</div>
    <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange"
        :current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper" :total="total">
    </el-pagination>
    <SkuPropNameListDetail ref="detailRef" :numIid="detailNumIid" @recovered="handleRecovered" />
</template>
<script setup>
import { ref, useTemplateRef } from 'vue'
import FormList from '../FormList.vue'
import SkuPropNameListDetail from './SkuPropNameListDetail.vue'
import { getItemWirelessUrl, getApproveStatus } from '@/utils/index'
import request from '@/utils/request'
import { useIndexMethod } from '@/composables/useIndexMethod'

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

// 只有「颜色分类」(pid=1627207) 与自定义规格（负数 pid）的规格值在 schema 里有 inputValue，可改名；
// 尺码、净含量等官方枚举属性提交后不生效，前端直接置为只读
const isPropEditable = (propId) => {
    const pid = String(propId ?? '').trim().replace(/^p-/, '')
    if (/^-\d+$/.test(pid)) return true
    return pid === '1627207'
}

// 解析 properties_name（pid:vid:规格名:规格值;...）为逐个SKU名称
const parseSkuProps = (propertiesName) => {
    if (!propertiesName) return []
    return propertiesName.split(';').map(seg => {
        const parts = seg.split(':')
        if (parts.length < 4) return null
        const value = parts.slice(3).join(':')
        return {
            propId: parts[0],
            propName: parts[2],
            originalValue: value,
            newValue: value,
            editable: isPropEditable(parts[0])
        }
    }).filter(Boolean)
}

// 数据查询完成
const tableData = ref([])
const handleLoaded = (data, totalNum) => {
    // 列表修改不需要展开子行，清除 children 避免 el-table 自动渲染树形结构
    data.forEach(item => {
        delete item.children
        if (item.skus && item.skus.length) {
            item.skus.forEach(sku => {
                sku.props = parseSkuProps(sku.properties_name || '')
                sku.updateStatus = ''
                sku.failMsg = null
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

// props 兜底：行数据未经 handleLoaded 处理时（如跨页保留的旧选择项）按 properties_name 重新解析
const ensureProps = (sku) => {
    if (!Array.isArray(sku.props)) {
        sku.props = parseSkuProps(sku.properties_name || '')
    }
    return sku.props
}

// 取 SKU 中发生变化的SKU名称
const getChangedProps = (sku) => ensureProps(sku).filter(prop => prop.newValue !== prop.originalValue)

// 取有变化的 SKU
const getChangedSkus = (row) => (row.skus || []).filter(sku => getChangedProps(sku).length > 0)

// 选择项可能来自之前的页码（reserve-selection 会保留），优先取当前表格里的同一行对象
const resolveLiveRow = (row) => {
    const live = tableData.value.find(item => String(item.num_iid) === String(row.num_iid))
    return live || row
}

// 构造单行请求数据
const buildSkuRequest = (row, sku) => ({
    numIid: row.num_iid,
    skuId: sku.sku_id,
    props: getChangedProps(sku).map(prop => ({
        propId: prop.propId,
        propName: prop.propName,
        originalValue: prop.originalValue,
        newValue: prop.newValue
    }))
})

// 保存修改
const save = (row) => {
    const liveRow = resolveLiveRow(row)
    if (!liveRow.skus || !liveRow.skus.length) {
        ElMessage.error('该商品没有可修改的SKU')
        return
    }
    const changed = getChangedSkus(liveRow)
    if (!changed.length) {
        ElMessage.error('SKU名称未发生变化，无需修改')
        return
    }
    for (const sku of changed) {
        for (const prop of getChangedProps(sku)) {
            if (String(prop.newValue ?? '').trim() === '') {
                ElMessage.error('请输入修改后的SKU名称')
                return
            }
        }
    }
    ElMessageBox.confirm(
        '确定修改SKU名称？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        }
    ).then(() => {
        doSave(liveRow, changed)
    }).catch(() => { })
}
const doSave = async (row, changed) => {
    row.loading = true
    let failCount = 0
    try {
        for (const sku of changed) {
            const response = await request.post('/api/v1/batch-update-sku-prop-name/save-list-detail', buildSkuRequest(row, sku))
            const d = response.data
            if (d.code === 0 && d.data?.status !== 'fail') {
                sku.updateStatus = 'success'
                sku.failMsg = null
                ;(sku.props || []).forEach(prop => {
                    prop.originalValue = prop.newValue
                })
            } else {
                failCount++
                sku.updateStatus = 'fail'
                sku.failMsg = d.data?.failMsg || d.msg || '保存失败'
            }
        }
        row.loading = false
        if (failCount === 0) {
            ElMessage.success('保存成功')
            emit('refreshQuota')
        } else {
            ElMessage.error('部分SKU名称保存失败')
        }
    } catch (error) {
        // 错误已由 request.js 拦截器提示，避免重复弹，只复位 loading
        row.loading = false
    }
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
    let unchangedCount = 0
    for (let i = 0; i < selectionRows.length; i++) {
        const row = resolveLiveRow(selectionRows[i])
        const changed = getChangedSkus(row)
        if (!changed.length) {
            // 未修改的选择项跳过，不阻断其它已修改的选择项
            unchangedCount++
            console.warn('[SKU名称] 第' + (i + 1) + '个选择项未检测到变化', {
                numIid: row.num_iid,
                skus: (row.skus || []).map(sku => ({ skuId: sku.sku_id, props: ensureProps(sku) }))
            })
            continue
        }
        for (const sku of changed) {
            for (const prop of getChangedProps(sku)) {
                if (String(prop.newValue ?? '').trim() === '') {
                    ElMessage.error('第' + (i + 1) + '个选择项请输入修改后的SKU名称')
                    return
                }
            }
            reqRows.push(buildSkuRequest(row, sku))
        }
    }
    if (!reqRows.length) {
        ElMessage.error(unchangedCount > 1 ? '所选商品SKU名称均未发生变化，无需修改' : 'SKU名称未发生变化，无需修改')
        return
    }
    ElMessageBox.confirm(
        '即将修改<span class="h-b">' + reqRows.length + '</span>个SKU名称，确定保存修改？<br />提示：可在修改记录中查看和恢复数据',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info',
            dangerouslyUseHTMLString: true
        }
    ).then(() => {
        doBatchSave(reqRows)
    }).catch(() => { })
}
const doBatchSave = (reqRows) => {
    batchSaveLoading.value = true
    request.post('/api/v1/batch-update-sku-prop-name/batch-save-list', {
        rows: reqRows
    }).then(response => {
        batchSaveLoading.value = false
        const d = response.data
        if (d.code === 0) {
            const data = d.data || {}
            const success = data.success ?? reqRows.length
            const fail = data.fail || 0
            ElMessageBox.alert(
                '成功修改<span class="h-b">' + success + '</span>个SKU' + (fail > 0 ? '，出错<span class="h-b">' + fail + '</span>个SKU' : ''),
                '提示',
                {
                    dangerouslyUseHTMLString: true,
                }
            )
            if (fail === 0) {
                syncSavedRows(reqRows)
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
// 批量保存成功后同步本地原值与状态
const syncSavedRows = (reqRows) => {
    tableData.value.forEach(row => {
        if (!row.skus || !row.skus.length) return
        row.skus.forEach(sku => {
            const matched = reqRows.some(req => String(req.numIid) == String(row.num_iid) && String(req.skuId) == String(sku.sku_id))
            if (matched) {
                ;(sku.props || []).forEach(prop => {
                    prop.originalValue = prop.newValue
                })
                sku.updateStatus = 'success'
                sku.failMsg = null
            }
        })
    })
}

// 显示修改记录
const detailNumIid = ref()
const detailRef = useTemplateRef('detailRef')
const showDetails = (numIid) => {
    detailNumIid.value = numIid
    detailRef.value.dialogVisible = true
    detailRef.value.dialogTitle = '修改记录 | 商品ID：' + numIid
}

// 恢复后重新加载列表
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
    align-items: center;
}

/* 勾选列压内边距：45px 宽下 checkbox 完整显示 */
:deep(.col-check .cell) {
    padding: 0 2px;
}

.attr-line {
    display: flex;
    align-items: center;
    min-height: 32px;
    font-size: 12px;
    line-height: 1.6;
}

.table-tip {
    margin-top: 10px;
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
