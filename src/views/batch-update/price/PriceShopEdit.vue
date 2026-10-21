<template>
    <el-divider content-position="left">修改范围</el-divider>
    <FormShop ref="formShopRef" @form-change="formShopChange" />

    <el-divider content-position="left">修改内容</el-divider>
    <el-form :inline="true" :model="updateContentForm" label-width="auto" style="width:100%">
        <!-- ========== 第一组：改价类型 ========== -->
        <div class="form-group">
            <div class="form-group-title">改价类型</div>

            <div class="price-type-layout">
                <!-- 左列：选择改价类型 -->
                <div class="price-type-left">
                    <span class="price-type-label">选择改价类型</span>
                    <el-select v-model="updateContentForm.priceType" style="width:200px"
                        @change="onPriceTypeChange">
                        <el-option label="修改一口价/SKU价格" value="all" />
                        <el-option label="只修改第1个SKU价格" value="first" />
                        <el-option label="只修改SKU中最低价" value="min" />
                        <el-option label="只修改SKU中最高价" value="max" />
                    </el-select>
                </div>

                <!-- 右列：两行内容 -->
                <div class="price-type-right">
                    <!-- 第一行：多个SKU处理方式（仅min/max显示） -->
                    <div class="price-type-row"
                        v-if="updateContentForm.priceType === 'min' || updateContentForm.priceType === 'max'">
                        <span class="price-type-label">
                            如果有多个SKU{{ updateContentForm.priceType === 'min' ? '最低价' : '最高价' }}时
                        </span>
                        <el-radio-group v-model="updateContentForm.multiSkuAction" size="small">
                            <el-radio-button label="all">多个SKU都修改</el-radio-button>
                            <el-radio-button label="first">只修改其中1个</el-radio-button>
                            <el-radio-button label="none">都不修改</el-radio-button>
                        </el-radio-group>
                    </div>

                    <!-- 第二行：没有SKU时修改一口价（first/min/max都显示） -->
                    <div class="price-type-row"
                        v-if="updateContentForm.priceType === 'first' || updateContentForm.priceType === 'min' || updateContentForm.priceType === 'max'">
                        <span class="price-type-label">没有SKU时修改一口价</span>
                        <el-switch v-model="updateContentForm.modifyPriceWhenNoSku" />
                    </div>
                </div>
            </div>
        </div>

        <!-- ========== 第二组：改价方式 ========== -->
        <div class="form-group">
            <div class="form-group-title">改价方式</div>

            <!-- 第一行：统一改为 -->
            <div class="price-modify-row">
                <el-radio v-model="updateContentForm.priceModifyType" label="unified"
                    @change="onModifyTypeChange">
                    统一改为
                </el-radio>
                <el-input-number v-model="updateContentForm.unifiedPrice" :min="0" :precision="2"
                    controls-position="right" style="width:150px"
                    :disabled="updateContentForm.priceModifyType !== 'unified'" />
                <span class="ml-5">元</span>
            </div>

            <!-- 第二行：公式修改 -->
            <div class="price-modify-row">
                <el-radio v-model="updateContentForm.priceModifyType" label="formula"
                    @change="onModifyTypeChange">
                    公式修改
                </el-radio>
                <el-select v-model="updateContentForm.operatorMultiply" style="width:80px"
                    :disabled="updateContentForm.priceModifyType !== 'formula'">
                    <el-option label="乘以" value="multiply" />
                    <el-option label="除以" value="divide" />
                </el-select>
                <el-input-number v-model="updateContentForm.multiply" :min="0" :precision="2"
                    controls-position="right" style="width:120px"
                    :disabled="updateContentForm.priceModifyType !== 'formula'" />
                <span class="ml-10">后</span>
                <el-select v-model="updateContentForm.operator" style="width:80px"
                    :disabled="updateContentForm.priceModifyType !== 'formula'">
                    <el-option label="增加" value="add" />
                    <el-option label="减少" value="subtract" />
                </el-select>
                <el-input-number v-model="updateContentForm.addValue" :min="0" :precision="2"
                    controls-position="right" style="width:120px"
                    :disabled="updateContentForm.priceModifyType !== 'formula'" />
                <span class="ml-5">元</span>
            </div>

            <!-- 公式修改下方：价格个位处理 + 价格小数处理（仅公式修改时显示） -->
            <template v-if="updateContentForm.priceModifyType === 'formula'">
                <!-- 价格个位处理 -->
                <div class="price-modify-sub-row">
                    <span class="sub-label">价格个位处理</span>
                    <el-radio-group v-model="updateContentForm.unitHandle" size="small">
                        <el-radio-button label="none">不处理</el-radio-button>
                        <el-radio-button label="uniform">统一改为</el-radio-button>
                    </el-radio-group>
                    <el-form-item v-if="updateContentForm.unitHandle === 'uniform'" label="">
                        <el-input-number v-model="updateContentForm.unitValue" :min="0" :max="9"
                            controls-position="right" style="width:100px" />
                    </el-form-item>
                </div>

                <!-- 价格小数处理 -->
                <div class="price-modify-sub-row">
                    <span class="sub-label">价格小数处理</span>
                    <el-radio-group v-model="updateContentForm.decimalHandle" size="small">
                        <el-radio-button label="none">不处理</el-radio-button>
                        <el-radio-button label="round">四舍五入取整</el-radio-button>
                        <el-radio-button label="oneDecimal">保留一位小数</el-radio-button>
                        <el-radio-button label="uniform">统一改为</el-radio-button>
                    </el-radio-group>
                    <el-form-item v-if="updateContentForm.decimalHandle === 'uniform'" label="">
                        <el-input-number v-model="updateContentForm.decimalValue" :min="0" :max="99"
                            :precision="0" controls-position="right" style="width:80px" />
                        <span class="ml-5">（表示两位小数，如输入5表示 .05）</span>
                    </el-form-item>
                </div>
            </template>
        </div>



        <!-- ========== 第六组：设置有库存的SKU最低价/最高价为一口价（互斥） ========== -->
        <div class="form-group">
            <div class="form-group-title"></div>
            <div class="sku-price-row">
                <el-checkbox v-model="updateContentForm.setMinPriceAsPrice" @change="onMinPriceChange">
                    设置有库存的SKU最低价为一口价
                </el-checkbox>
                <el-checkbox v-model="updateContentForm.setMaxPriceAsPrice" @change="onMaxPriceChange">
                    设置有库存的SKU最高价为一口价
                </el-checkbox>
            </div>
        </div>

        <!-- ========== 第三组：其他筛选 ========== -->
        <div class="form-group">
            <div class="form-group-title">其他筛选</div>

            <!-- 价格区间 -->
            <div class="sku-filter-row">
                <el-checkbox v-model="updateContentForm.enablePriceRange" @change="onPriceRangeChange"
                    style="width:140px; flex-shrink: 0; margin-right: 0;">
                    启用价格区间筛选
                </el-checkbox>
                <template v-if="updateContentForm.enablePriceRange">
                    <el-input-number v-model="updateContentForm.priceRangeMin" :min="0" :precision="2"
                        controls-position="right" style="width:130px" placeholder="最低价" />
                    <span class="ml-5">~</span>
                    <el-input-number v-model="updateContentForm.priceRangeMax" :min="0" :precision="2"
                        controls-position="right" style="width:130px" placeholder="最高价" />
                    <span class="ml-5">元</span>
                    <span class="gray-tip ml-5">（留空表示不限制）</span>
                </template>
            </div>

            <!-- SKU名称包含 -->
            <div class="sku-filter-row">
                <span class="sku-filter-label">SKU名称包含</span>
                <el-input v-model="updateContentForm.skuNameContains" placeholder="多个关键字用英文逗号,分隔" clearable
                    style="width:400px" />
                <span class="gray-tip ml-10">（只修改含有关键字的SKU，留空表示全部修改）</span>
            </div>
        </div>

        <!-- ========== 第四组：执行方式 ========== -->
        <div class="form-group">
            <div class="form-group-title">执行方式</div>
            <div class="sku-filter-row">
                <el-radio-group v-model="executeForm.executeMode">
                    <el-radio value="immediate">立即修改</el-radio>
                    <el-radio value="scheduled">定时修改</el-radio>
                </el-radio-group>
            </div>
            <template v-if="executeForm.executeMode === 'scheduled'">
                <div class="sku-filter-row">
                    <span class="sku-filter-label">任务执行时间</span>
                    <el-date-picker v-model="executeForm.taskTime" type="datetime"
                        placeholder="请选择任务执行时间" style="width:250px"
                        value-format="YYYY-MM-DD HH:mm:ss" />
                    <span class="gray-tip ml-5">（改价操作需商家授权，且每次授权有效时间为30分钟，超过将不能执行改价，所以这里选择的任务执行时间不能超过当前时间30分钟）</span>
                </div>
                <div class="sku-filter-row">
                    <span class="sku-filter-label">重复周期</span>
                    <el-radio-group v-model="executeForm.repeat">
                        <el-radio :value="0">不重复，只执行一次</el-radio>
                        <el-radio :value="1">每天</el-radio>
                        <el-radio :value="2">每周</el-radio>
                        <el-radio :value="3">工作日</el-radio>
                        <el-radio :value="4">周末</el-radio>
                    </el-radio-group>
                </div>
            </template>
        </div>
    </el-form>

    <div class="btn-wrap">
        <el-button type="primary" @click="preview" :loading="loadingPreview">预览修改结果</el-button>
        <el-button type="primary" @click="startUpdate" :disabled="tableDataPreview.length == 0">
            {{ executeForm.executeMode === 'scheduled' ? '创建定时任务' : '开始修改' }}
        </el-button>
    </div>

    <el-divider content-position="left">预览修改结果</el-divider>
    <el-table size="small"
        :data="tableDataPreview.slice((currentPagePreview - 1) * pageSizePreview, currentPagePreview * pageSizePreview)" width="100%">
        <el-table-column type="index" width="50" label="序号" :index="indexMethodPreview" />
        <el-table-column property="picUrl" label="商品信息" width="350">
            <template #default="scope">
                <div class="textarea-wrap">
                    <div>
                        <a :href="getItemWirelessUrl(scope.row.numIid)" target="_blank">
                            <el-image :src="scope.row.picUrl + '_60x60.jpg'" style="width:60px">
                                <template #error>&nbsp;</template>
                            </el-image>
                        </a>
                    </div>
                    <div class="ml-5 text-gray">
                        <el-row>{{ scope.row.title }}</el-row>
                        <el-row class="item-meta">ID:{{ scope.row.numIid }} 一口价:{{ Number(scope.row.price).toFixed(2) }} 状态:{{
                            getApproveStatus(scope.row.approveStatus)
                        }}</el-row>
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="SKU名称" min-width="150">
            <template #default="scope">
                <div v-if="scope.row.newSkus && scope.row.newSkus.length">
                    <div v-for="(sku, idx) in scope.row.newSkus" :key="idx" class="sku-line">
                        {{ sku.propertiesName?.replace(/\d+:/g, '') || 'SKU' }}
                    </div>
                </div>
                <div v-else class="gray-tip">-</div>
            </template>
        </el-table-column>
        <el-table-column label="价格" width="90">
            <template #default="scope">
                <div v-if="scope.row.newSkus && scope.row.newSkus.length">
                    <div v-for="(sku, idx) in scope.row.newSkus" :key="idx" class="sku-line">
                        {{ Number(sku.originalPrice).toFixed(2) }}
                    </div>
                </div>
                <div v-else>{{ Number(scope.row.price).toFixed(2) }}</div>
            </template>
        </el-table-column>
        <el-table-column label="原价格" width="90">
            <template #default="scope">
                <div v-if="scope.row.newSkus && scope.row.newSkus.length">
                    <div v-for="(sku, idx) in scope.row.newSkus" :key="idx" class="sku-line">
                        {{ Number(sku.originalPrice).toFixed(2) }}
                    </div>
                </div>
                <div v-else>{{ Number(scope.row.price).toFixed(2) }}</div>
            </template>
        </el-table-column>
        <el-table-column label="修改后价格" width="110">
            <template #default="scope">
                <div v-if="scope.row.newSkus && scope.row.newSkus.length">
                    <div v-for="(sku, idx) in scope.row.newSkus" :key="idx" class="sku-line">
                        <span :class="{ 'h': sku.price !== sku.originalPrice, 'red': sku.price === sku.originalPrice }">{{ Number(sku.price).toFixed(2) }}</span>
                        <span v-if="sku.price === sku.originalPrice" class="gray-tip ml-5">(未变化)</span>
                    </div>
                </div>
                <div v-else-if="scope.row.newPrice !== undefined && scope.row.newPrice !== null">
                    <span :class="{ 'h': scope.row.newPrice !== scope.row.price, 'red': scope.row.newPrice === scope.row.price }">{{ Number(scope.row.newPrice).toFixed(2) }}</span>
                    <span v-if="scope.row.newPrice === scope.row.price" class="gray-tip ml-5">(未变化)</span>
                </div>
                <div v-else class="gray-tip">无SKU</div>
            </template>
        </el-table-column>
        <el-table-column label="修改状态" width="100">
            <template #default="scope">
                <el-tag v-if="scope.row.hasChange" type="success" size="small">待修改</el-tag>
                <el-tag v-else type="info" size="small">无变化</el-tag>
                <div v-if="!scope.row.hasChange" class="gray-tip">价格未变化，将跳过</div>
            </template>
        </el-table-column>
    </el-table>
    <el-pagination @current-change="handleCurrentChangePreview" @size-change="handleSizeChangePreview"
        :current-page="currentPagePreview" v-model:page-size="pageSizePreview" :page-sizes="[10, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper" :total="tableDataPreview.length" size="small" />

    <div class="mt-15">&nbsp;</div>
    <el-divider content-position="left">
        <div class="record-divider-inner">
            修改记录
            <el-tooltip content="刷新修改记录" placement="top">
                <el-icon class="record-refresh" @click="getShopRecord">
                    <Refresh />
                </el-icon>
            </el-tooltip>
        </div>
    </el-divider>
    <el-table size="small" :data="tableDataRecord">
        <el-table-column type="index" width="50" label="序号" />
        <el-table-column property="datetime" label="修改时间" width="150" />
        <el-table-column label="状态" width="80">
            <template #default="scope">
                <el-tag :type="{ pending: 'warning', running: 'primary', complete: 'success', partial: 'warning', failed: 'danger', cancel: 'info' }[scope.row.status] || 'info'"
                    size="small">
                    {{ { pending: '待执行', running: '执行中', complete: '已完成', partial: '部分成功', failed: '已失败', cancel: '已取消' }[scope.row.status] || scope.row.status }}
                </el-tag>
            </template>
        </el-table-column>
        <el-table-column property="updateRangeText" label="修改范围">
            <template #default="scope">
                <div v-html="scope.row.updateRangeText"></div>
            </template>
        </el-table-column>
        <el-table-column property="updateContentText" label="修改内容">
            <template #default="scope">
                <div v-html="scope.row.updateContentText"></div>
            </template>
        </el-table-column>
        <el-table-column property="total" label="总数" width="70" />
        <el-table-column property="success" label="成功" width="70" />
        <el-table-column property="fail" label="出错" width="70" />
        <el-table-column property="skip" label="跳过" width="70" />
        <el-table-column label="操作" width="100">
            <template #default="scope">
                <el-button size="small" plain
                    @click="recordId = scope.row.id; shopRecordDetailRef.dialogVisible = true">查看</el-button>
            </template>
        </el-table-column>
    </el-table>
    <el-pagination @current-change="handleCurrentChangeRecord" @size-change="handleSizeChangeRecord"
        :current-page="currentPageRecord" v-model:page-size="pageSizeRecord" :page-sizes="[10, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper" :total="totalRecord" size="small">
    </el-pagination>
    <el-dialog v-model="dialogProgressVisible" title="修改进度" width="800" :close-on-click-modal="false"
        @closed="getShopRecord">
        <el-progress :text-inside="true" :stroke-width="26" :percentage="percentage" />
        <div class="percent-tip">
            <div class="progress-stats">
                <span>总商品：<b>{{ progressStats.total }}</b></span>
                <span class="stat-success">成功：<b>{{ progressStats.success }}</b></span>
                <span class="stat-fail">失败：<b>{{ progressStats.fail }}</b></span>
                <span class="stat-skip">跳过：<b>{{ progressStats.skip }}</b></span>
            </div>
            <div>{{ saveCompleteMsg }}</div>
            <div v-if="currentTaskId" class="task-bg-tip">
                任务后台执行中，关闭页面不会中断，重新进入本页面可继续查看进度
            </div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button v-if="!currentTaskId" type="primary"
                    @click="dialogProgressVisible = false">确定</el-button>
            </div>
        </template>
    </el-dialog>
    <W2AuthDialog />
    <PriceShopDetail ref="shopRecordDetailRef" :recordId="recordId" @task-created="handleTaskCreated" />
</template>

<script setup>
import { onMounted, onUnmounted, ref, useTemplateRef, reactive, watch } from 'vue'
import FormShop from '../components/FormShop.vue'
import PriceShopDetail from './PriceShopDetail.vue'
import W2AuthDialog from './W2AuthDialog.vue'
import { getItemWirelessUrl, getApproveStatus } from '@/utils/index'
import request from '@/utils/request'
import { useW2Auth } from '@/utils/w2auth'
import { useIndexMethod } from '@/composables/useIndexMethod'
import { Refresh } from '@element-plus/icons-vue'

const props = defineProps({
    quotaStatus: { type: Object, required: true }
})
const emit = defineEmits(['refreshQuota'])

// 修改内容表单
const updateContentForm = reactive({
    priceType: 'all',
    excludeMinPrice: null,
    excludeMaxPrice: null,
    multiSkuAction: 'all',
    modifyPriceWhenNoSku: false,
    enablePriceRange: false,
    priceRangeMin: null,
    priceRangeMax: null,
    priceModifyType: 'formula',
    unifiedPrice: null,
    operatorMultiply: 'multiply',
    multiply: 1,
    operator: 'add',
    addValue: 0,
    setMinPriceAsPrice: false,
    setMaxPriceAsPrice: false,
    skuNameContains: '',
    unitHandle: 'none',
    unitValue: 0,
    decimalHandle: 'none',
    decimalValue: 0
})

const executeForm = reactive({
    executeMode: 'immediate',
    taskTime: '',
    repeat: 0
})

const onPriceTypeChange = () => {
    updateContentForm.excludeMinPrice = null
    updateContentForm.excludeMaxPrice = null
    updateContentForm.multiSkuAction = 'all'
    updateContentForm.modifyPriceWhenNoSku = false
    tableDataPreview.value = []
}

const onPriceRangeChange = () => {
    if (!updateContentForm.enablePriceRange) {
        updateContentForm.priceRangeMin = null
        updateContentForm.priceRangeMax = null
    }
    tableDataPreview.value = []
}

const onModifyTypeChange = () => {
    tableDataPreview.value = []
}

const onMinPriceChange = (val) => {
    if (val) {
        updateContentForm.setMaxPriceAsPrice = false
    }
    tableDataPreview.value = []
}

const onMaxPriceChange = (val) => {
    if (val) {
        updateContentForm.setMinPriceAsPrice = false
    }
    tableDataPreview.value = []
}

// 预览
const loadingPreview = ref(false)
const formShopRef = useTemplateRef('formShopRef')
const tableDataPreview = ref([])

async function preview() {
    if (!checkUpdateContent()) {
        return
    }
    loadingPreview.value = true
    try {
        const response = await request.post('/api/v1/batch-update-price/preview', {
            filterForm: formShopRef.value.form,
            updateContentForm: updateContentForm
        })
        loadingPreview.value = false
        if (response.data.code === 0) {
            tableDataPreview.value = response.data.data.rows || []
            if (tableDataPreview.value.length === 0) {
                ElMessage.warning('没有符合条件的商品')
            }
        } else {
            ElMessage.error(response.data.msg || '预览失败')
        }
    } catch (error) {
        // 错误已由 request.js 拦截器提示，避免重复弹
        loadingPreview.value = false
    }
}

const checkUpdateContent = () => {
    const hasUnifiedPrice = updateContentForm.unifiedPrice !== null && updateContentForm.unifiedPrice !== undefined
    const hasFormula = updateContentForm.multiply !== 1 || updateContentForm.addValue !== 0

    if (updateContentForm.priceModifyType === 'unified' && !hasUnifiedPrice) {
        ElMessage.error('请设置统一改为的价格')
        return false
    }

    if (updateContentForm.priceModifyType === 'unified' && updateContentForm.unifiedPrice <= 0) {
        ElMessage.error('统一改为的价格必须大于0')
        return false
    }

    if (updateContentForm.enablePriceRange) {
        if (updateContentForm.priceRangeMin !== null && updateContentForm.priceRangeMax !== null) {
            if (updateContentForm.priceRangeMin > updateContentForm.priceRangeMax) {
                ElMessage.error('最低价不能大于最高价')
                return false
            }
        }
    }

    return true
}

const currentPagePreview = ref(1)
const pageSizePreview = ref(10)
const handleCurrentChangePreview = (val) => {
    currentPagePreview.value = val
}
const handleSizeChangePreview = (val) => {
    pageSizePreview.value = val
}

const indexMethodPreview = (index) => {
    const { newIndex } = useIndexMethod(index, currentPagePreview, pageSizePreview)
    return newIndex.value
}

watch(updateContentForm, () => {
    tableDataPreview.value = []
}, { deep: true })

const formShopChange = () => {
    tableDataPreview.value = []
}

// 开始修改
const dialogProgressVisible = ref(false)
const percentage = ref(0)
const saveCompleteMsg = ref('')
const progressStats = reactive({ total: 0, success: 0, fail: 0, skip: 0 })

const startUpdate = () => {
    const updatableCount = getUpdatableCount()
    if (!updatableCount) {
        ElMessage.error('没有可修改商品')
        return
    }

    if (executeForm.executeMode === 'scheduled') {
        if (!executeForm.taskTime) {
            ElMessage.error('请选择任务执行时间')
            return
        }
        const taskTime = new Date(executeForm.taskTime)
        const now = new Date()
        if (taskTime <= now) {
            ElMessage.error('任务执行时间必须晚于当前时间')
            return
        }
        if (taskTime - now > 30 * 60 * 1000) {
            ElMessage.error('任务执行时间不能超过当前时间30分钟（受淘宝授权有效期限制）')
            return
        }
        const repeatText = { 0: '不重复', 1: '每天', 2: '每周', 3: '工作日', 4: '周末' }[executeForm.repeat]
        let msg = `即将创建定时任务：<br />`
        msg += `执行时间：<span class="h-b">${executeForm.taskTime}</span><br />`
        msg += `重复周期：<span class="h-b">${repeatText}</span><br />`
        msg += `修改商品数：<span class="h-b">${updatableCount}</span> 个<br />`
        msg += `确定创建？`
        ElMessageBox.confirm(msg, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info',
            dangerouslyUseHTMLString: true
        }).then(() => {
            doCreateScheduledTask()
        }).catch(() => { })
        return
    }

    let msg = '即将修改<span class="h-b">' + updatableCount + '</span>个商品价格'
    if (props.quotaStatus.dailyLimit > 0) {
        msg += '，批量改价今日限额<span class="h-b">' + props.quotaStatus.dailyLimit + '</span>个'
        msg += '，已用<span class="h-b">' + props.quotaStatus.dailyUsed + '</span>'
        msg += '，剩余<span class="h-b">' + props.quotaStatus.dailyRemain + '</span>'
        if (props.quotaStatus.dailyRemain < updatableCount) {
            msg += '，剩余额度不够本次修改'
            ElMessageBox.alert(msg, '提示', { dangerouslyUseHTMLString: true })
            return
        }
    } else {
        msg += '，今日不限量'
    }
    msg += '，确定保存修改？'
    ElMessageBox.confirm(msg, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
        width: 560,
        dangerouslyUseHTMLString: true
    }).then(() => {
        doStartUpdate()
    }).catch(() => { })
}

const getUpdatableCount = () => {
    let count = 0
    tableDataPreview.value.forEach(val => {
        if (val.hasChange) {
            count++
        }
    })
    return count
}

const currentTaskId = ref(null)
const pollTimer = ref(null)

const stopPolling = () => {
    if (pollTimer.value) {
        clearInterval(pollTimer.value)
        pollTimer.value = null
    }
}

const startPolling = (taskId) => {
    stopPolling()
    pollTimer.value = setInterval(async () => {
        try {
            const response = await request.get('/api/v1/batch-update-price/task-progress', {
                params: { task_id: taskId }
            })
            const data = response.data.data
            progressStats.total = data.total || 0
            progressStats.success = data.success || 0
            progressStats.fail = data.fail || 0
            progressStats.skip = data.skip || 0
            if (data.status === 'running') {
                percentage.value = data.progress
            } else if (data.status === 'complete') {
                percentage.value = 100
                saveCompleteMsg.value = data.message
                stopPolling()
                currentTaskId.value = null
                getShopRecord()
                emit('refreshQuota')
            } else if (data.status === 'error') {
                percentage.value = data.progress
                saveCompleteMsg.value = data.message
                stopPolling()
                currentTaskId.value = null
                getShopRecord()
                emit('refreshQuota')
            }
        } catch (error) {
            console.error('查询任务进度失败:', error)
        }
    }, 2000)
}

const { ensureW2Auth, stopW2Check } = useW2Auth()

const doStartUpdate = async () => {
    if (!(await ensureW2Auth(doStartUpdate))) return
    dialogProgressVisible.value = true
    percentage.value = 0
    saveCompleteMsg.value = ''
    try {
        const response = await request.post('/api/v1/batch-update-price/create-task', {
            filterForm: formShopRef.value.form,
            updateContentForm: updateContentForm
        })
        if (response.data.code === 0) {
            currentTaskId.value = response.data.data.taskId
            getShopRecord()
            startPolling(response.data.data.taskId)
        } else {
            dialogProgressVisible.value = false
            ElMessage.error(response.data.msg || '任务创建失败')
        }
    } catch (error) {
        // 错误已由 request.js 拦截器提示，避免重复弹
        dialogProgressVisible.value = false
    }
}

const handleTaskCreated = (taskId) => {
    dialogProgressVisible.value = true
    percentage.value = 0
    saveCompleteMsg.value = ''
    progressStats.total = 0
    progressStats.success = 0
    progressStats.fail = 0
    progressStats.skip = 0
    currentTaskId.value = taskId
    getShopRecord()
    startPolling(taskId)
}

const doCreateScheduledTask = async () => {
    try {
        const response = await request.post('/api/v1/batch-update-price/create-scheduled-task', {
            filterForm: formShopRef.value.form,
            updateContentForm: {
                ...updateContentForm,
                executeMode: 'scheduled',
                taskTime: executeForm.taskTime,
                repeat: executeForm.repeat
            }
        })
        if (response.data.code === 0) {
            ElMessageBox.alert('定时任务创建成功', '提示', {
                type: 'success',
                callback: () => {
                    tableDataPreview.value = []
                    getShopRecord()
                }
            })
        } else {
            ElMessage.error(response.data.msg || '创建失败')
        }
    } catch (error) {
        // 错误已由 request.js 拦截器提示，避免重复弹
    }
}

// 获取范围修改记录（分页）
const tableDataRecord = ref([])
const currentPageRecord = ref(1)
const pageSizeRecord = ref(10)
const totalRecord = ref(0)
const getShopRecord = () => {
    request.post('/api/v1/batch-update-price/get-shop-record', {
        page: currentPageRecord.value,
        pageSize: pageSizeRecord.value
    }).then(response => {
        tableDataRecord.value = response.data.data.rows || []
        totalRecord.value = response.data.data.total || 0
        const hasActive = (response.data.data.activeCount || 0) > 0
        if (hasActive) {
            startRecordTimer()
        } else {
            stopRecordTimer()
        }
    }).catch(() => {
        // 错误已由 request.js 拦截器提示，避免重复弹
    })
}
const handleCurrentChangeRecord = (val) => {
    currentPageRecord.value = val
    getShopRecord()
}
const handleSizeChangeRecord = () => {
    currentPageRecord.value = 1
    getShopRecord()
}

const recordId = ref()
const shopRecordDetailRef = useTemplateRef('shopRecordDetailRef')

let recordTimer = null

const startRecordTimer = () => {
    if (recordTimer) return
    recordTimer = setInterval(() => {
        if (!document.hidden) getShopRecord()
    }, 30000)
}

const stopRecordTimer = () => {
    if (recordTimer) {
        clearInterval(recordTimer)
        recordTimer = null
    }
}

onMounted(() => {
    getShopRecord()
})

onUnmounted(() => {
    stopPolling()
    stopRecordTimer()
    stopW2Check()
})

defineExpose({ getShopRecord })
</script>

<style scoped>
.record-divider-inner {
    display: flex;
    align-items: center;
    gap: 8px;
}

.record-refresh {
    cursor: pointer;
    color: #909399;
    transition: color 0.2s;
}

.record-refresh:hover {
    color: #409eff;
}

.el-pagination {
    margin-top: 15px;
}

.textarea-wrap {
    display: flex;
    align-items: center;
}

.btn-wrap {
    display: flex;
    justify-content: center;
}

.btn-wrap .el-button:first-of-type {
    margin-left: -100px;
}

.btn-wrap .el-button+.el-button {
    margin-left: 50px;
}

.percent-tip {
    margin-top: 10px;
    line-height: 2em;
}

.progress-stats {
    display: flex;
    gap: 24px;
}

.progress-stats .stat-success b {
    color: #67c23a;
}

.progress-stats .stat-fail b {
    color: #f56c6c;
}

.progress-stats .stat-skip b {
    color: #909399;
}

.task-bg-tip {
    color: #909399;
    font-size: 12px;
    margin-top: 8px;
}

.dialog-footer {
    padding-right: 15px;
}

.form-group {
    margin-bottom: 15px;
    padding: 10px 0;
    border-bottom: 1px dashed #ebeef5;
}

.form-group:last-child {
    border-bottom: none;
}

.form-group-title {
    color: #303133;
    margin-bottom: 10px;
    font-size: 14px;
}

.sku-line {
    line-height: 1.8;
    font-size: 12px;
    color: #606266;
}

.item-meta {
    font-size: 12px;
    color: #909399;
}

.gray-tip {
    color: #909399;
    font-size: 12px;
}

.ml-5 {
    margin-left: 5px;
}

.ml-10 {
    margin-left: 10px;
}

.mt-15 {
    margin-top: 15px;
}

.h-b {
    font-weight: bold;
    color: #409EFF;
}

.red {
    color: #F56C6C;
}

.h {
    color: #FF9900;
}

.text-gray {
    color: #909399;
}

.price-type-layout {
    display: flex;
    align-items: flex-start;
    gap: 40px;
    padding-left: 20px;
}

.price-type-left {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.price-type-right {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.price-type-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}

.price-type-row .price-type-label {
    display: inline-block;
    width: 210px;
    color: #606266;
    font-size: 14px;
    flex-shrink: 0;
    text-align: right;
    padding-right: 15px;
}

.price-type-left .price-type-label {
    display: inline-block;
    color: #606266;
    font-size: 14px;
    margin-right: 15px;
    flex-shrink: 0;
}

.price-type-row .el-form-item {
    margin-bottom: 0;
}

.sku-filter-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    padding-left: 20px;
    margin-bottom: 10px;
}

.sku-filter-row:last-child {
    margin-bottom: 0;
}

.sku-filter-label {
    display: inline-block;
    color: #606266;
    font-size: 14px;
    flex-shrink: 0;
    text-align: left;
}

.sku-filter-row .el-checkbox {
    width: 140px;
    flex-shrink: 0;
    margin-right: 0;
}

.sku-filter-row .el-input-number {
    vertical-align: middle;
}

.price-modify-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    padding-left: 20px;
    margin-bottom: 14px;
}

.price-modify-row:last-child {
    margin-bottom: 0;
}

.price-modify-row .el-radio {
    margin-right: 10px;
}

.price-modify-sub-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    padding-left: 75px;
    margin-top: 10px;
}

.price-modify-sub-row:first-child {
    margin-top: 14px;
}

.price-modify-sub-row .sub-label {
    display: inline-block;
    width: 120px;
    color: #606266;
    font-size: 14px;
    flex-shrink: 0;
    text-align: right;
    padding-right: 15px;
}

.price-modify-sub-row .el-form-item {
    margin-bottom: 0;
}
</style>
