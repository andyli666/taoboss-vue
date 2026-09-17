<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>批量修改</el-breadcrumb-item>
        <el-breadcrumb-item>修改价格</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="mtb-15">
        <el-alert title="" type="info" show-icon :closable="false">
            <div>
                每天免费修改<span class="h-b">1500</span>个商品价格，
                今天已用<span class="h-b">{{ useNum }}</span>次，剩余<span class="h-b">{{ 1500 - useNum }}</span>次
            </div>
        </el-alert>
    </div>
    <el-tabs type="border-card" v-model="activeName">
        <el-tab-pane label="范围修改" name="shop">
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
            </el-form>

            <div class="btn-wrap">
                <el-button type="primary" @click="preview" :loading="loadingPreview">预览修改结果</el-button>
                <el-button type="primary" @click="startUpdate" :disabled="tableDataPreview.length == 0">开始修改</el-button>
            </div>

            <el-divider content-position="left">预览修改结果</el-divider>
            <el-table size="small"
                :data="tableDataPreview.slice((currentPagePreview - 1) * pageSizePreview, currentPagePreview * pageSizePreview)">
                <el-table-column type="index" width="55" label="序号" :index="indexMethodPreview" />
                <el-table-column property="pic_url" label="商品信息" width="400">
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
                                <el-row>{{ scope.row.title }}</el-row>
                                <el-row>ID:{{ scope.row.num_iid }} 状态:{{ getApproveStatus(scope.row.approve_status)
                                }}</el-row>
                            </div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column property="originalPrice" label="原价格" width="200">
                    <template #default="scope">
                        <div v-if="scope.row.skus && scope.row.skus.length">
                            <div v-for="(sku, idx) in scope.row.skus" :key="idx" class="sku-price-row">
                                <span class="sku-name">{{ sku.properties_name?.replace(/\d+:/g, '') || 'SKU' }}</span>
                                <span class="price-value">¥{{ sku.price }}</span>
                            </div>
                        </div>
                        <div v-else>
                            一口价: ¥{{ scope.row.price }}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column property="newPrice" label="修改后价格" width="250">
                    <template #default="scope">
                        <div v-if="scope.row.newSkus && scope.row.newSkus.length">
                            <div v-for="(sku, idx) in scope.row.newSkus" :key="idx" class="sku-price-row">
                                <span class="sku-name">{{ sku.properties_name?.replace(/\d+:/g, '') || 'SKU' }}</span>
                                <span class="price-value" :class="{ 'red': sku.price === sku.originalPrice }">¥{{
                                    sku.price }}</span>
                                <span v-if="sku.price === sku.originalPrice" class="gray-tip ml-5">(未变化)</span>
                            </div>
                        </div>
                        <div v-else-if="scope.row.newPrice !== undefined && scope.row.newPrice !== null">
                            一口价: ¥{{ scope.row.newPrice }}
                            <span v-if="scope.row.newPrice === scope.row.price" class="gray-tip ml-5">(未变化)</span>
                        </div>
                        <div v-else class="gray-tip">无SKU</div>
                    </template>
                </el-table-column>
                <el-table-column label="修改状态" width="120">
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
            <el-divider content-position="left">修改记录</el-divider>
            <el-table size="small" :data="tableDataRecord">
                <el-table-column type="index" width="50" label="序号" />
                <el-table-column property="datetime" label="修改时间" width="150" />
                <el-table-column property="update_range_text" label="修改范围">
                    <template #default="scope">
                        <div v-html="scope.row.update_range_text"></div>
                    </template>
                </el-table-column>
                <el-table-column property="update_content_text" label="修改内容">
                    <template #default="scope">
                        <div v-html="scope.row.update_content_text"></div>
                    </template>
                </el-table-column>
                <el-table-column property="total" label="总数" width="50" />
                <el-table-column property="success" label="成功" width="50" />
                <el-table-column property="fail" label="出错" width="50" />
                <el-table-column property="skip" label="跳过" width="50" />
                <el-table-column label="操作" width="100">
                    <template #default="scope">
                        <el-button size="small" plain
                            @click="recordId = scope.row.id; shopRecordDetailRef.dialogVisible = true">查看</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <el-dialog v-model="dialogProgressVisible" title="修改进度" width="800" :close-on-click-modal="false">
                <el-progress :text-inside="true" :stroke-width="26" :percentage="percentage" />
                <div class="percent-tip">
                    <div>{{ saveCompleteMsg }}</div>
                </div>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button type="primary" @click="dialogProgressVisible = false">确定</el-button>
                    </div>
                </template>
            </el-dialog>
            <PriceShopDetail ref="shopRecordDetailRef" :recordId="recordId" />
        </el-tab-pane>
        <el-tab-pane label="列表修改" name="list">
            <div class="gray-tip">列表修改功能开发中...</div>
        </el-tab-pane>
    </el-tabs>
</template>

<script setup>
import { onMounted, ref, useTemplateRef, reactive, watch } from 'vue'
import FormShop from '../components/FormShop.vue'
import PriceShopDetail from './PriceShopDetail.vue'
import { getItemWirelessUrl, getApproveStatus } from '@/utils/index'
import request from '@/utils/request'
import { useIndexMethod } from '@/composables/useIndexMethod'
import { fetchEventSource } from '@microsoft/fetch-event-source'

const activeName = ref('shop')

// 获取使用次数
const useNum = ref(0)
const getUseNum = () => {
    request.post('/api/batch-update-price/get-use-num', {}).then(response => {
        useNum.value = response.data.data
    }).catch((error) => {
        ElMessage.error(error)
    })
}

// 修改内容表单
const updateContentForm = reactive({
    // 改价类型
    priceType: 'all', // all, first, min, max

    // 最低价排除条件
    excludeMinPrice: null,
    // 最高价排除条件
    excludeMaxPrice: null,

    // 多个SKU处理方式
    multiSkuAction: 'all', // all, first, none
    // 没有SKU时修改一口价
    modifyPriceWhenNoSku: false,

    // 价格区间筛选
    enablePriceRange: false,
    priceRangeMin: null,
    priceRangeMax: null,

    // 修改方式：unified（统一改为） / formula（公式修改）
    priceModifyType: 'formula',

    // 统一改为
    unifiedPrice: null,

    // 公式修改
    operatorMultiply: 'multiply', // multiply / divide
    multiply: 1,
    operator: 'add', // add / subtract
    addValue: 0,

    // 设置有库存的SKU最低价/最高价为一口价（互斥）
    setMinPriceAsPrice: false,
    setMaxPriceAsPrice: false,

    // SKU名称包含
    skuNameContains: '',

    // 价格个位处理
    unitHandle: 'none', // none, uniform
    unitValue: 0,

    // 价格小数处理
    decimalHandle: 'none', // none, round, oneDecimal, uniform
    decimalValue: 0
})

// 改价类型切换
const onPriceTypeChange = () => {
    // 重置相关字段
    updateContentForm.excludeMinPrice = null
    updateContentForm.excludeMaxPrice = null
    updateContentForm.multiSkuAction = 'all'
    updateContentForm.modifyPriceWhenNoSku = false
    tableDataPreview.value = []
}

// 价格区间切换
const onPriceRangeChange = () => {
    if (!updateContentForm.enablePriceRange) {
        updateContentForm.priceRangeMin = null
        updateContentForm.priceRangeMax = null
    }
    tableDataPreview.value = []
}

// 修改方式切换
const onModifyTypeChange = () => {
    tableDataPreview.value = []
}

// 最低价/最高价为一口价互斥
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
    const items = await formShopRef.value.getItems()
    loadingPreview.value = false
    if (items.length) {
        for (let i = 0; i < items.length; i++) {
            const result = getNewPrice(items[i])
            items[i].newSkus = result.newSkus
            items[i].newPrice = result.newPrice
            items[i].hasChange = result.hasChange
        }
    }
    tableDataPreview.value = items
}

// 检查修改内容
const checkUpdateContent = () => {
    // 检查是否选择了修改方式
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

    // 检查价格区间
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

// 检查价格是否在区间内
const isPriceInRange = (price) => {
    if (!updateContentForm.enablePriceRange) {
        return true
    }
    const min = updateContentForm.priceRangeMin
    const max = updateContentForm.priceRangeMax
    if (min !== null && price < min) {
        return false
    }
    if (max !== null && price > max) {
        return false
    }
    return true
}

// 计算新价格
const getNewPrice = (item) => {
    const skus = item.skus || []
    const hasSku = skus.length > 0
    let newSkus = []
    let newPrice = null
    let hasChange = false

    // 根据改价类型筛选要修改的SKU
    let targetSkus = []

    if (updateContentForm.priceType === 'all') {
        // 修改所有SKU
        targetSkus = skus.map((sku, idx) => ({
            ...sku,
            originalPrice: parseFloat(sku.price),
            index: idx,
            skuPrice: parseFloat(sku.price)
        }))
    } else if (updateContentForm.priceType === 'first') {
        // 只修改第1个SKU
        if (skus.length > 0) {
            targetSkus = [{
                ...skus[0],
                originalPrice: parseFloat(skus[0].price),
                index: 0,
                skuPrice: parseFloat(skus[0].price)
            }]
        }
        // 没有SKU时，且开启了"没有SKU时修改一口价"
        if (skus.length === 0 && updateContentForm.modifyPriceWhenNoSku) {
            const originalPrice = parseFloat(item.price || 0)
            // 检查价格区间
            if (!isPriceInRange(originalPrice)) {
                return { newSkus: [], newPrice: null, hasChange: false }
            }
            const newPriceValue = calculateNewPrice(originalPrice)
            const finalPrice = handleDecimal(handleUnit(newPriceValue))
            newPrice = Math.round(finalPrice * 100) / 100
            hasChange = newPrice !== originalPrice
            return { newSkus: [], newPrice, hasChange }
        }
    } else if (updateContentForm.priceType === 'min') {
        // 只修改SKU中最低价
        if (skus.length > 0) {
            let minPrice = Infinity
            let minIndexes = []
            skus.forEach((sku, idx) => {
                const price = parseFloat(sku.price)
                // 排除条件
                if (updateContentForm.excludeMinPrice !== null && price <= updateContentForm.excludeMinPrice) {
                    return
                }
                // 价格区间筛选
                if (!isPriceInRange(price)) {
                    return
                }
                if (price < minPrice) {
                    minPrice = price
                    minIndexes = [idx]
                } else if (price === minPrice) {
                    minIndexes.push(idx)
                }
            })
            // 根据multiSkuAction决定修改哪些
            if (updateContentForm.multiSkuAction === 'first' && minIndexes.length > 1) {
                minIndexes = [minIndexes[0]]
            } else if (updateContentForm.multiSkuAction === 'none') {
                minIndexes = []
            }
            minIndexes.forEach(idx => {
                targetSkus.push({
                    ...skus[idx],
                    originalPrice: parseFloat(skus[idx].price),
                    index: idx,
                    skuPrice: parseFloat(skus[idx].price)
                })
            })
        }
        // 没有SKU时且开启修改一口价
        if (skus.length === 0 && updateContentForm.modifyPriceWhenNoSku) {
            const originalPrice = parseFloat(item.price || 0)
            if (!isPriceInRange(originalPrice)) {
                return { newSkus: [], newPrice: null, hasChange: false }
            }
            const newPriceValue = calculateNewPrice(originalPrice)
            const finalPrice = handleDecimal(handleUnit(newPriceValue))
            newPrice = Math.round(finalPrice * 100) / 100
            hasChange = newPrice !== originalPrice
            return { newSkus: [], newPrice, hasChange }
        }
    } else if (updateContentForm.priceType === 'max') {
        // 只修改SKU中最高价
        if (skus.length > 0) {
            let maxPrice = -Infinity
            let maxIndexes = []
            skus.forEach((sku, idx) => {
                const price = parseFloat(sku.price)
                // 排除条件
                if (updateContentForm.excludeMaxPrice !== null && price >= updateContentForm.excludeMaxPrice) {
                    return
                }
                // 价格区间筛选
                if (!isPriceInRange(price)) {
                    return
                }
                if (price > maxPrice) {
                    maxPrice = price
                    maxIndexes = [idx]
                } else if (price === maxPrice) {
                    maxIndexes.push(idx)
                }
            })
            if (updateContentForm.multiSkuAction === 'first' && maxIndexes.length > 1) {
                maxIndexes = [maxIndexes[0]]
            } else if (updateContentForm.multiSkuAction === 'none') {
                maxIndexes = []
            }
            maxIndexes.forEach(idx => {
                targetSkus.push({
                    ...skus[idx],
                    originalPrice: parseFloat(skus[idx].price),
                    index: idx,
                    skuPrice: parseFloat(skus[idx].price)
                })
            })
        }
        // 没有SKU时且开启修改一口价
        if (skus.length === 0 && updateContentForm.modifyPriceWhenNoSku) {
            const originalPrice = parseFloat(item.price || 0)
            if (!isPriceInRange(originalPrice)) {
                return { newSkus: [], newPrice: null, hasChange: false }
            }
            const newPriceValue = calculateNewPrice(originalPrice)
            const finalPrice = handleDecimal(handleUnit(newPriceValue))
            newPrice = Math.round(finalPrice * 100) / 100
            hasChange = newPrice !== originalPrice
            return { newSkus: [], newPrice, hasChange }
        }
    }

    // 如果没有SKU且没有开启修改一口价
    if (!hasSku && !updateContentForm.modifyPriceWhenNoSku) {
        return { newSkus: [], newPrice: null, hasChange: false }
    }

    // 如果没有目标SKU需要修改
    if (targetSkus.length === 0) {
        return { newSkus: [], newPrice: null, hasChange: false }
    }

    // 处理目标SKU
    targetSkus.forEach(target => {
        const originalPrice = target.originalPrice
        let newPriceValue = calculateNewPrice(originalPrice)

        // 小数处理
        newPriceValue = handleDecimal(newPriceValue)

        // 个位处理
        newPriceValue = handleUnit(newPriceValue)

        // 四舍五入到两位小数
        newPriceValue = Math.round(newPriceValue * 100) / 100

        if (newPriceValue !== originalPrice) {
            hasChange = true
        }

        newSkus.push({
            ...target,
            price: newPriceValue.toFixed(2),
            originalPrice: originalPrice
        })
    })

    // 按原顺序排列
    newSkus.sort((a, b) => a.index - b.index)

    return { newSkus, newPrice: null, hasChange }
}

// 计算新价格（公式修改 + 统一改为）
const calculateNewPrice = (originalPrice) => {
    let newPrice = originalPrice

    // 统一改为
    if (updateContentForm.priceModifyType === 'unified') {
        if (updateContentForm.unifiedPrice !== null && updateContentForm.unifiedPrice !== undefined) {
            newPrice = updateContentForm.unifiedPrice
            return newPrice
        }
    }

    // 公式修改
    if (updateContentForm.priceModifyType === 'formula') {
        let calculatedPrice = originalPrice
        if (updateContentForm.operatorMultiply === 'multiply') {
            calculatedPrice = originalPrice * updateContentForm.multiply
        } else {
            // 除以
            if (updateContentForm.multiply === 0) {
                calculatedPrice = originalPrice // 除数为0时保持不变
            } else {
                calculatedPrice = originalPrice / updateContentForm.multiply
            }
        }
        if (updateContentForm.operator === 'add') {
            calculatedPrice += updateContentForm.addValue
        } else {
            calculatedPrice -= updateContentForm.addValue
        }
        newPrice = calculatedPrice
    }

    return newPrice
}

// 价格个位处理
const handleUnit = (price) => {
    if (updateContentForm.unitHandle === 'none') {
        return price
    }
    if (updateContentForm.unitHandle === 'uniform') {
        const integerPart = Math.floor(price)
        const decimalPart = price - integerPart
        return integerPart - (integerPart % 10) + updateContentForm.unitValue + decimalPart
    }
    return price
}

// 价格小数处理
const handleDecimal = (price) => {
    if (updateContentForm.decimalHandle === 'none') {
        return price
    }
    if (updateContentForm.decimalHandle === 'round') {
        return Math.round(price)
    }
    if (updateContentForm.decimalHandle === 'oneDecimal') {
        return Math.round(price * 10) / 10
    }
    if (updateContentForm.decimalHandle === 'uniform') {
        const integerPart = Math.floor(price)
        return integerPart + updateContentForm.decimalValue / 100
    }
    return price
}

// 分页
const currentPagePreview = ref(1)
const pageSizePreview = ref(10)
const handleCurrentChangePreview = (val) => {
    currentPagePreview.value = val
}
const handleSizeChangePreview = (val) => {
    pageSizePreview.value = val
}

// 分页index递增
const indexMethodPreview = (index) => {
    const { newIndex } = useIndexMethod(index, currentPagePreview, pageSizePreview)
    return newIndex.value
}

// 修改内容改变时需重新预览
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

const startUpdate = () => {
    const updatableCount = getUpdatableCount()
    if (!updatableCount) {
        ElMessage.error('没有可修改商品')
        return
    }
    let msg = '即将修改' + updatableCount + '个商品价格，'
    msg += '每天免费修改<span class="h-b">1500</span>个商品，'
    msg += '今天已用<span class="h-b">' + useNum.value + '</span>次，'
    msg += '剩余<span class="h-b">' + (1500 - useNum.value) + '</span>次，'
    if ((1500 - useNum.value) < updatableCount) {
        msg += '剩余次数不够本次修改'
        ElMessageBox.alert(
            msg,
            '提示',
            {
                dangerouslyUseHTMLString: true,
            }
        )
        return
    } else {
        msg += '<br />确定保存修改？'
        ElMessageBox.confirm(
            msg,
            '提示',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'info',
                dangerouslyUseHTMLString: true
            }
        ).then(() => {
            doStartUpdate()
        }).catch(() => { })
    }
}

// 获取可修改商品总数
const getUpdatableCount = () => {
    let count = 0
    tableDataPreview.value.forEach(val => {
        if (val.hasChange) {
            count++
        }
    })
    return count
}

// 执行修改
const doStartUpdate = () => {
    dialogProgressVisible.value = true
    percentage.value = 0
    saveCompleteMsg.value = ''
    try {
        const ctrl = new AbortController()
        fetchEventSource('/api/batch-update-price/shop-update', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            method: 'POST',
            body: JSON.stringify({
                rows: tableDataPreview.value,
                updateRangeText: formShopRef.value.getUpdateRangeText(),
                updateContentText: getUpdateContentText(),
                updateContentForm: updateContentForm
            }),
            signal: ctrl.signal,
            openWhenHidden: true,
            onopen: (response) => {
                console.log('连接已打开', response)
            },
            onmessage: (event) => {
                console.log('收到消息:', event.data)
                const data = JSON.parse(event.data)
                if (data.status == 'progress') {
                    percentage.value = data.progress
                } else if (data.status == 'complete') {
                    saveCompleteMsg.value = data.message
                    ctrl.abort()
                    percentage.value = 100
                    getShopRecord()
                    getUseNum()
                } else if (data.status == 'error') {
                    ElMessage.error(data.message)
                    ctrl.abort()
                }
            },
            onerror: (error) => {
                console.error('连接发生错误:', error)
                ElMessage.error(error.message)
                ctrl.abort()
            },
            onclose: () => {
                console.log('连接已关闭')
            },
        })
    } catch (err) {
        ElMessage.error(err.message)
        throw new Error("终止连接")
    }
}

// 获取修改内容文字
const getUpdateContentText = () => {
    let text = ''
    const typeMap = {
        'all': '修改一口价/SKU价格',
        'first': '只修改第1个SKU价格',
        'min': '只修改SKU中最低价',
        'max': '只修改SKU中最高价'
    }
    text += '改价类型：' + (typeMap[updateContentForm.priceType] || updateContentForm.priceType)

    if (updateContentForm.priceType === 'min' && updateContentForm.excludeMinPrice !== null) {
        text += '，排除最低价小于等于' + updateContentForm.excludeMinPrice + '元的SKU'
    }
    if (updateContentForm.priceType === 'max' && updateContentForm.excludeMaxPrice !== null) {
        text += '，排除最高价大于等于' + updateContentForm.excludeMaxPrice + '元的SKU'
    }

    if (updateContentForm.priceType === 'min' || updateContentForm.priceType === 'max') {
        const actionMap = {
            'all': '多个SKU都修改',
            'first': '只修改其中1个',
            'none': '都不修改'
        }
        text += '，多个SKU时：' + (actionMap[updateContentForm.multiSkuAction] || '')
    }

    if (updateContentForm.priceType !== 'all' && updateContentForm.modifyPriceWhenNoSku) {
        text += '，没有SKU时修改一口价'
    }

    text += '\r\n'

    if (updateContentForm.enablePriceRange) {
        let rangeText = '价格区间：'
        if (updateContentForm.priceRangeMin !== null) {
            rangeText += updateContentForm.priceRangeMin + '~'
        }
        if (updateContentForm.priceRangeMax !== null) {
            rangeText += updateContentForm.priceRangeMax
        }
        text += rangeText + '\r\n'
    }

    if (updateContentForm.priceModifyType === 'unified') {
        text += '统一改为：' + updateContentForm.unifiedPrice + '元'
    } else {
        const operatorMap = {
            'add': '增加',
            'subtract': '减少'
        }
        const multiplyMap = {
            'multiply': '乘以',
            'divide': '除以'
        }
        text += '公式修改：' + multiplyMap[updateContentForm.operatorMultiply] + updateContentForm.multiply + '后' + operatorMap[updateContentForm.operator] + updateContentForm.addValue + '元'
    }

    text += '\r\n'

    if (updateContentForm.setMinPriceAsPrice) {
        text += '设置有库存的SKU最低价为一口价'
    }
    if (updateContentForm.setMaxPriceAsPrice) {
        text += '设置有库存的SKU最高价为一口价'
    }

    if (updateContentForm.skuNameContains) {
        text += '\r\nSKU名称包含：' + updateContentForm.skuNameContains
    }

    const unitMap = {
        'none': '不处理',
        'uniform': '统一改为' + updateContentForm.unitValue
    }
    text += '\r\n价格个位处理：' + unitMap[updateContentForm.unitHandle]

    const decimalMap = {
        'none': '不处理',
        'round': '四舍五入取整',
        'oneDecimal': '保留一位小数',
        'uniform': '统一改为' + (updateContentForm.decimalValue / 100).toFixed(2)
    }
    text += '\r\n价格小数处理：' + decimalMap[updateContentForm.decimalHandle]

    return text
}

// 获取范围修改记录
const tableDataRecord = ref([])
const getShopRecord = () => {
    request.post('/api/batch-update-price/get-shop-record', {}).then(response => {
        tableDataRecord.value = response.data.data
    }).catch((error) => {
        ElMessage.error(error)
    })
}

// 查看范围修改记录明细
const recordId = ref()
const shopRecordDetailRef = useTemplateRef('shopRecordDetailRef')

onMounted(() => {
    getUseNum()
    getShopRecord()
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
    /* font-weight: 500; */
    color: #303133;
    margin-bottom: 10px;
    font-size: 14px;
}

.formula-wrap {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
}

.sku-price-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    padding-left: 20px;
}

.sku-name {
    color: #606266;
    font-size: 12px;
    min-width: 60px;
}

.price-value {
    font-weight: 500;
    color: #303133;
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

.mtb-15 {
    margin: 15px 0;
}

.h-b {
    font-weight: bold;
    color: #409EFF;
}

.red {
    color: #F56C6C;
}

.h {
    font-weight: 500;
}

.text-gray {
    color: #909399;
}

.flex {
    display: flex;
    align-items: center;
}

/* 改价类型 - 两列布局 */
.price-type-layout {
    display: flex;
    align-items: flex-start;
    gap: 40px;
    padding-left: 20px;
}

/* 左列 */
.price-type-left {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

/* 右列 */
.price-type-right {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* 每一行 */
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

.ml-5 {
    margin-left: 5px;
}

.ml-10 {
    margin-left: 10px;
}

/* 其他筛选行 */
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
    /* width: 140px; */
    color: #606266;
    font-size: 14px;
    flex-shrink: 0;
    text-align: left;
}

/* checkbox 和 label 宽度一致，左对齐 */
.sku-filter-row .el-checkbox {
    width: 140px;
    flex-shrink: 0;
    margin-right: 0;
}

/* 价格区间数字框加一点上下边距，与文字垂直居中 */
.sku-filter-row .el-input-number {
    vertical-align: middle;
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

/* 改价方式行 - 每行独立 */
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

/* 公式修改子行（个位处理、小数处理） */
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