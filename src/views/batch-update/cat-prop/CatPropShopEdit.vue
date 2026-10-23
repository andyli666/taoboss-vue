<template>
    <el-divider content-position="left">修改范围</el-divider>
    <FormShop ref="formShopRef" @form-change="formShopChange" />

    <el-divider content-position="left">修改内容</el-divider>
    <el-alert class="cat-prop-tip" type="warning" :closable="false" show-icon
        title="只能修改和模板商品相同类目的商品，请先选择或输入模板商品id，然后获取可修改属性" />

    <el-form :inline="true" label-width="auto" class="template-form">
        <el-form-item label="模板商品">
            <el-input v-model="templateNumIid" placeholder="请选择商品或输入商品id" clearable style="width:300px"
                @input="handleTemplateInput" />
            <el-button plain size="small" class="ml-5" @click="itemSelectVisible = true">选择模板商品</el-button>
            <el-button type="primary" size="small" class="ml-5" :loading="schemaLoading" @click="fetchProps">
                获取属性
            </el-button>
        </el-form-item>
    </el-form>
    <div v-if="templateTitle" class="template-title">
        模板商品：{{ templateTitle }}
    </div>

    <div v-if="schemaLoaded" class="cat-prop-panel">
        <div class="cat-prop-summary">
            已获取 <b>{{ propsState.length }}</b> 个可修改属性
            <template v-if="categoryName">（类目：{{ categoryName }}）</template>，
            已勾选 <b>{{ selectedProps.length }}</b> 个
        </div>
        <div v-if="propsState.length" class="cat-prop-grid">
            <div v-for="p in visibleProps" :key="p.id" class="cat-prop-item">
                <div class="cat-prop-head">
                    <el-checkbox v-model="p.checked" :disabled="p.readOnly" size="small">
                        <span v-if="p.required" class="required-star">*</span>{{ p.name }}
                    </el-checkbox>
                    <el-tooltip v-if="p.tip" :content="p.tip" placement="top" :show-after="200">
                        <el-icon class="tip-icon">
                            <QuestionFilled />
                        </el-icon>
                    </el-tooltip>
                    <span v-if="p.readOnly" class="readonly-tag">只读</span>
                </div>
                <div class="cat-prop-control">
                    <template v-if="p.type === 'singleCheck'">
                        <!-- 城市：只能从下拉选择（可搜索），值为城市名（淘宝接受城市名称提交） -->
                        <template v-if="p.name === '城市'">
                            <el-select v-model="p.value" :disabled="!p.checked || isAttrDisabled(p)"
                                placeholder="请选择城市" clearable filterable style="width:100%">
                                <el-option v-for="opt in cityOptions" :key="opt.value" :label="opt.label"
                                    :value="opt.value" />
                            </el-select>
                        </template>
                        <template v-else>
                            <!-- 品牌等声明支持自定义输入的单选属性，允许手动输入名称并回车确认 -->
                            <el-select v-model="p.value" :disabled="!p.checked || isAttrDisabled(p)"
                                :placeholder="p.allowCustomInput ? '请选择或输入' : '请选择'"
                                :allow-create="p.allowCustomInput" :default-first-option="p.allowCustomInput"
                                clearable filterable style="width:100%">
                                <el-option v-for="opt in p.options" :key="opt.value" :label="opt.label"
                                    :value="opt.value" />
                            </el-select>
                        </template>
                    </template>
                    <template v-else-if="p.type === 'multiCheck'">
                        <el-select v-model="p.value" :disabled="!p.checked || isAttrDisabled(p)"
                            placeholder="请选择"
                            clearable filterable multiple collapse-tags collapse-tags-tooltip style="width:100%"
                            :multiple-limit="getMaxInputNum(p)">
                            <el-option v-for="opt in p.options" :key="opt.value" :label="opt.label"
                                :value="opt.value" />
                        </el-select>
                    </template>
                    <template v-else-if="p.type === 'multiInput'">
                        <el-input v-model="p.value" type="textarea" :rows="2"
                            :disabled="!p.checked || isAttrDisabled(p)" placeholder="请输入" />
                    </template>
                    <template v-else>
                        <div class="input-with-unit">
                            <el-input v-model="p.value" :disabled="!p.checked || isAttrDisabled(p)" placeholder="请输入"
                                clearable />
                            <span v-if="p.unit" class="unit-text">{{ p.unit }}</span>
                        </div>
                    </template>
                    <div v-if="getRuleHint(p)" class="prop-tip">{{ getRuleHint(p) }}</div>
                </div>
            </div>
        </div>
        <el-empty v-else description="该商品暂无可修改的类目属性" :image-size="80" />
    </div>

    <!-- ========== 执行方式 ========== -->
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
                <el-date-picker v-model="executeForm.taskTime" type="datetime" placeholder="请选择任务执行时间"
                    style="width:250px" value-format="YYYY-MM-DD HH:mm:ss" />
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

    <div class="btn-wrap">
        <el-button type="primary" @click="preview" :loading="loadingPreview">预览修改结果</el-button>
        <el-button type="primary" @click="startUpdate" :disabled="tableDataPreview.length == 0">
            {{ executeForm.executeMode === 'scheduled' ? '创建定时任务' : '开始修改' }}
        </el-button>
    </div>

    <el-divider content-position="left">预览修改结果</el-divider>
    <el-table size="small"
        :data="tableDataPreview.slice((currentPagePreview - 1) * pageSizePreview, currentPagePreview * pageSizePreview)"
        width="100%">
        <el-table-column type="index" width="55" label="序号" :index="indexMethodPreview" />
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
                        <el-row>ID:{{ scope.row.numIid }} 状态:{{
                            getApproveStatus(scope.row.approveStatus)
                            }}</el-row>
                    </div>
                </div>
            </template>
        </el-table-column>
        <!-- <el-table-column property="categoryName" label="所属类目" width="170">
            <template #default="scope">
                <div class="text-gray">{{ scope.row.categoryName || '-' }}</div>
            </template>
        </el-table-column> -->
        <el-table-column label="修改属性" min-width="280">
            <template #default="scope">
                <div v-if="scope.row.changes && scope.row.changes.length">
                    <div v-for="(change, index) in scope.row.changes" :key="index" class="change-line">
                        <span class="change-name">{{ change.propName }}：</span>
                        <span class="text-gray">{{ change.oldValue || '空' }}</span>
                        <span class="change-arrow">→</span>
                        <span class="h">{{ change.newValue || '空' }}</span>
                    </div>
                </div>
                <div v-else class="text-gray">-</div>
                <div v-if="!scope.row.hasChange" class="gray-tip">{{ scope.row.skipMsg || '属性没有变化，将跳过' }}</div>
            </template>
        </el-table-column>
        <el-table-column label="修改状态" width="100">
            <template #default="scope">
                <el-tag v-if="scope.row.hasChange" type="success" size="small">待修改</el-tag>
                <el-tag v-else type="info" size="small">无变化</el-tag>
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
                <el-tag
                    :type="{ pending: 'warning', running: 'primary', complete: 'success', partial: 'warning', failed: 'danger', cancel: 'info' }[scope.row.status] || 'info'"
                    size="small">
                    {{ {
                        pending: '待执行', running: '执行中', complete: '已完成', partial: '部分成功', failed: '已失败', cancel: '已取消'
                    }[scope.row.status] || scope.row.status }}
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
                <el-button v-if="!currentTaskId" type="primary" @click="dialogProgressVisible = false">确定</el-button>
            </div>
        </template>
    </el-dialog>

    <!-- 单选模板商品弹窗 -->
    <el-dialog v-model="itemSelectVisible" title="选择模板商品" width="950" append-to-body>
        <ItemSelect ref="itemSelectRef" @row-click="handleTemplateItemSelected" />
    </el-dialog>

    <CatPropShopDetail ref="shopRecordDetailRef" :recordId="recordId" @task-created="handleTaskCreated" />
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, useTemplateRef, watch } from 'vue'
import FormShop from '../components/FormShop.vue'
import CatPropShopDetail from './CatPropShopDetail.vue'
import ItemSelect from '@/components/ItemSelect.vue'
import { getItemWirelessUrl, getApproveStatus, isValidNumIid } from '@/utils/index'
import request from '@/utils/request'
import { useIndexMethod } from '@/composables/useIndexMethod'
import { Refresh, QuestionFilled } from '@element-plus/icons-vue'
import { parseCatPropSchema, countLength, getRule, isRuleDisabled } from './catPropSchema'
import { getCitiesByProvince, MUNICIPALITIES, normalizeProvinceName } from './chinaCities'

const props = defineProps({
    quotaStatus: { type: Object, required: true }
})
const emit = defineEmits(['refreshQuota'])

// ========== 模板商品 & 类目属性 ==========
const formShopRef = useTemplateRef('formShopRef')
const templateNumIid = ref('')
const templateTitle = ref('')
const itemSelectVisible = ref(false)
const itemSelectRef = useTemplateRef('itemSelectRef')
const loadedTemplateId = ref('')
const schemaLoading = ref(false)
const schemaLoaded = ref(false)
const categoryName = ref('')
const propsState = ref([])

const handleTemplateInput = () => {
    if (String(templateNumIid.value || '').trim() === loadedTemplateId.value) {
        return
    }
    templateTitle.value = ''
    resetProps()
}

const resetProps = () => {
    propsState.value = []
    schemaLoaded.value = false
    categoryName.value = ''
    loadedTemplateId.value = ''
    tableDataPreview.value = []
}

const handleTemplateItemSelected = (row) => {
    if (!row) {
        return
    }
    templateNumIid.value = String(row.num_iid)
    templateTitle.value = row.title || ''
    itemSelectVisible.value = false
    resetProps()
    // 从弹窗选中商品后自动获取属性，无需手动点击
    fetchProps()
}

const fetchProps = async () => {
    const numIid = String(templateNumIid.value || '').trim()
    const valid = isValidNumIid(numIid)
    if (valid !== true) {
        ElMessage.error(valid)
        return
    }
    schemaLoading.value = true
    try {
        const response = await request.get('/api/v1/batch-update-cat-prop/props', {
            params: { numIid }
        })
        if (response.data.code !== 0) {
            ElMessage.error(response.data.msg || '获取属性失败')
            return
        }
        const data = response.data.data || {}
        const schemaXml = data.schemaXml || data.schema || ''
        const { fields, parseError } = parseCatPropSchema(schemaXml)
        if (parseError) {
            ElMessage.error(parseError)
            return
        }
        // 模板省份为直辖市/其他时，schema 可能不包含城市字段；
        // 省份切换到非直辖市/其他时需要城市选项，这里在省份后补一个城市字段（值为城市名提交，id 为占位 id，后端按名称绑定目标商品的真实字段）
        const provinceIndex = fields.findIndex(f => f.name === '省份')
        if (provinceIndex >= 0 && !fields.some(f => f.name === '城市')) {
            fields.splice(provinceIndex + 1, 0, {
                id: fields[provinceIndex].id + '-13521914',
                name: '城市',
                type: 'singleCheck',
                required: false,
                readOnly: false,
                rules: [],
                options: [],
                unit: '',
                propertyTip: '',
                tip: '',
                value: null,
                defaultValue: null,
                checked: false
            })
        }
        propsState.value = fields
        // 城市属性的 schema 默认值是 vid（数字），但城市控件用城市名作 value，需映射为城市名
        const cityFieldInit = fields.find(f => f.name === '城市')
        if (cityFieldInit && cityFieldInit.value != null) {
            const vid = String(cityFieldInit.value)
            const opt = (cityFieldInit.options || []).find(o => String(o.value) === vid)
            cityFieldInit.value = opt ? opt.label : null
        }
        console.log('[cat-prop fetchProps] 共', fields.length, '个字段，名称：', fields.map(f => f.name).join(', '))
        console.log('[cat-prop fetchProps] 城市字段存在？', !!cityFieldInit, '默认值=', cityFieldInit?.value)
        schemaLoaded.value = true
        loadedTemplateId.value = numIid
        categoryName.value = data.categoryName || ''
        if (data.title) {
            templateTitle.value = data.title
        }
        tableDataPreview.value = []
        if (!fields.length) {
            ElMessage.warning('该商品暂无可修改的类目属性')
        }
    } catch (error) {
        // 错误已由 request.js 拦截器提示，避免重复弹
    } finally {
        schemaLoading.value = false
    }
}

// 各属性当前值（用于计算 depend-group 依赖）
const valueMap = computed(() => {
    const map = {}
    propsState.value.forEach(p => {
        map[p.id] = p.value
    })
    return map
})

const disabledMap = computed(() => {
    const map = {}
    propsState.value.forEach(p => {
        map[p.id] = isRuleDisabled(p, valueMap.value)
    })
    return map
})

const isAttrDisabled = (p) => {
    return p.readOnly || disabledMap.value[p.id] === true
}

const isSelectType = (p) => p.type === 'singleCheck' || p.type === 'multiCheck'

// 带单位的 input 属性提交时拼回单位（如 24 → 24g），与淘宝“值单位”格式一致
const getSubmitValue = (p) => {
    if (p.type === 'input' && p.unit && typeof p.value === 'string'
        && p.value !== '' && !p.value.endsWith(p.unit)) {
        return p.value + p.unit
    }
    return p.value
}

const getValueText = (p) => {
    if (p.type === 'singleCheck') {
        const option = p.options.find(opt => opt.value === p.value)
        return option ? option.label : (p.value ?? '')
    }
    if (p.type === 'multiCheck') {
        if (!Array.isArray(p.value)) {
            return p.value ?? ''
        }
        return p.value.map(value => {
            const option = p.options.find(opt => opt.value === value)
            return option ? option.label : value
        }).join('、')
    }
    return getSubmitValue(p) ?? ''
}

// ========== 产地/省份/城市父子属性联动 ==========
const originProp = computed(() => propsState.value.find(p => p.name === '产地'))
// 「中国大陆」选项的 vid（按 displayName 动态匹配，不同类目 vid 不同）
const chinaOriginVid = computed(() => {
    const opt = (originProp.value?.options || []).find(o => o.label === '中国大陆')
    return opt ? String(opt.value) : null
})
// 产地当前值（勾选修改时随用户选择变化，未勾选时保持模板默认值）
const originActiveValue = computed(() => {
    const v = originProp.value?.value
    return v == null ? null : String(v)
})
// 省份/城市显示规则：
//  - 省份：产地为中国大陆时显示（产地无中国大陆选项时默认显示）
//  - 城市：省份选中后显示，但直辖市和"其他"时隐藏
const provinceField = computed(() => propsState.value.find(p => p.name === '省份'))
const cityField = computed(() => propsState.value.find(p => p.name === '城市'))

// 城市是否应显示（单一数据源，内联所有逻辑避免 computed 链断依赖）
const cityShouldShow = computed(() => {
    const pf = provinceField.value
    if (!pf || pf.value == null) return false
    const opt = (pf.options || []).find(o => String(o.value) === String(pf.value))
    if (!opt) return false
    const name = normalizeProvinceName(opt.label)
    if (!name) return false
    if (MUNICIPALITIES.includes(name) || name === '其他') return false
    return true
})

// 省份规范化名称（给 cityOptions 和调试用）
const provinceDisplayName = computed(() => {
    const pf = provinceField.value
    if (!pf || pf.value == null) return null
    const opt = (pf.options || []).find(o => String(o.value) === String(pf.value))
    return opt ? normalizeProvinceName(opt.label) : null
})

// 调试 computed：值变化时输出
watch([provinceDisplayName, () => provinceField.value?.value, cityShouldShow], ([name, val, show]) => {
    console.log('[cat-prop] 省份名称=', name, '省份value=', val, '城市应显示=', show)
}, { immediate: true })

const isSubPropVisible = (p) => {
    if (p.name === '省份') {
        if (!chinaOriginVid.value) return true
        return originActiveValue.value === chinaOriginVid.value
    }
    if (p.name === '城市') {
        return cityShouldShow.value
    }
    return true
}
const visibleProps = computed(() => propsState.value.filter(p => isSubPropVisible(p)))

// 当前省份对应的城市选项（前端静态中国行政区划数据，按规范化后的省份名查找）
const cityOptions = computed(() => {
    const list = getCitiesByProvince(provinceDisplayName.value)
    return list.map(c => ({ value: c, label: c }))
})

// 产地不是中国大陆时隐藏省份/城市，并清空其勾选与值，避免残留提交
watch(originActiveValue, () => {
    if (chinaOriginVid.value && originActiveValue.value !== chinaOriginVid.value) {
        ;[provinceProp.value, cityProp.value].forEach(p => {
            if (p) {
                p.checked = false
                p.value = null
            }
        })
    }
})

// 省份变化时强制勾选城市并清空城市值，提示用户重选；省份为直辖市/其他时由下方 watcher 取消勾选
watch(() => provinceField.value?.value, (val, oldVal) => {
    if (oldVal !== undefined && val !== oldVal && cityField.value) {
        cityField.value.checked = true
        cityField.value.value = null
    }
})
watch(provinceDisplayName, (name) => {
    if (name && (MUNICIPALITIES.includes(name) || name === '其他') && cityField.value) {
        cityField.value.checked = false
        cityField.value.value = null
    }
})

const selectedProps = computed(() => {
    return propsState.value.filter(p => p.checked && isSubPropVisible(p)).map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        value: getSubmitValue(p),
        valueText: getValueText(p)
    }))
})

const unitLabel = (unit) => {
    if (unit === 'character') {
        return '个字符'
    }
    if (unit === 'byte') {
        return '字节'
    }
    return ''
}

// 规则提示（长度、数值区间等）
const getRuleHint = (p) => {
    const hints = []
    const maxLengthRule = getRule(p.rules, 'maxLengthRule')
    if (maxLengthRule) {
        hints.push(`最多${maxLengthRule.value}${unitLabel(maxLengthRule.unit)}`)
    }
    const minLengthRule = getRule(p.rules, 'minLengthRule')
    if (minLengthRule) {
        hints.push(`至少${minLengthRule.value}${unitLabel(minLengthRule.unit)}`)
    }
    const maxValueRule = getRule(p.rules, 'maxValueRule')
    if (maxValueRule) {
        hints.push(`${maxValueRule.exProperty === 'not include' ? '小于' : '小于等于'}${maxValueRule.value}`)
    }
    const minValueRule = getRule(p.rules, 'minValueRule')
    if (minValueRule) {
        hints.push(`${minValueRule.exProperty === 'not include' ? '大于' : '大于等于'}${minValueRule.value}`)
    }
    if (p.tip) {
        hints.push(p.tip)
    }
    return hints.join('；')
}

const getMaxInputNum = (p) => {
    const maxInputNumRule = getRule(p.rules, 'maxInputNumRule')
    return maxInputNumRule ? Number(maxInputNumRule.value) || 0 : 0
}

const valueIsEmpty = (value) => {
    return Array.isArray(value) ? value.length === 0 : (value === '' || value === null || value === undefined)
}

// 单个属性校验，返回错误提示（空字符串表示通过）
const validateAttr = (p) => {
    const value = p.value
    if (valueIsEmpty(value)) {
        if (p.required) {
            return isSelectType(p) ? '不能为空，请选择' : '不能为空，请填写'
        }
        return ''
    }

    if (Array.isArray(value)) {
        const maxInputNumRule = getRule(p.rules, 'maxInputNumRule')
        if (maxInputNumRule && value.length > Number(maxInputNumRule.value)) {
            return `最多选择${maxInputNumRule.value}个`
        }
        const minInputNumRule = getRule(p.rules, 'minInputNumRule')
        if (minInputNumRule && value.length < Number(minInputNumRule.value)) {
            return `至少选择${minInputNumRule.value}个`
        }
        return ''
    }

    let text = String(value)
    // 带单位的属性用户可能直接输入了“值单位”格式（如 24g），校验前剥离单位，提交时由 getSubmitValue 统一拼接
    if (p.type === 'input' && p.unit && text.endsWith(p.unit)) {
        text = text.slice(0, -p.unit.length)
    }
    // 带单位的属性值格式为“数字+单位”（如净含量 24g），剥离单位后必须是数字；提示要求整数时必须为整数
    if (p.type === 'input' && p.unit && text.trim() !== '') {
        const requireInteger = String(p.propertyTip || p.tip || '').includes('整数')
        const pattern = requireInteger ? /^-?\d+$/ : /^-?\d+(\.\d+)?$/
        if (!pattern.test(text.trim())) {
            return requireInteger ? '请输入整数' : '请输入数字'
        }
    }
    const valueTypeRule = p.rules.find(rule => rule.name === 'valueTypeRule' && !rule.target)
    if (valueTypeRule) {
        if (valueTypeRule.value === 'decimal' && !/^-?\d+(\.\d+)?$/.test(text.trim())) {
            return '请输入数字'
        }
        if ((valueTypeRule.value === 'integer' || valueTypeRule.value === 'long') && !/^-?\d+$/.test(text.trim())) {
            return '请输入整数'
        }
        if (valueTypeRule.value === 'url' && !/^https?:\/\//.test(text.trim())) {
            return '请输入有效的链接'
        }
    }

    const maxLengthRule = getRule(p.rules, 'maxLengthRule')
    if (maxLengthRule && countLength(text, maxLengthRule.unit) > Number(maxLengthRule.value)) {
        return `长度不能超过${maxLengthRule.value}${unitLabel(maxLengthRule.unit)}`
    }
    const minLengthRule = getRule(p.rules, 'minLengthRule')
    if (minLengthRule && countLength(text, minLengthRule.unit) < Number(minLengthRule.value)) {
        return `长度不能少于${minLengthRule.value}${unitLabel(minLengthRule.unit)}`
    }

    const number = Number(text)
    if (!Number.isNaN(number) && text.trim() !== '') {
        const maxValueRule = getRule(p.rules, 'maxValueRule')
        if (maxValueRule) {
            const maxValue = Number(maxValueRule.value)
            if (!Number.isNaN(maxValue) && (maxValueRule.exProperty === 'not include' ? number >= maxValue : number > maxValue)) {
                return `不能大于${maxValueRule.value}`
            }
        }
        const minValueRule = getRule(p.rules, 'minValueRule')
        if (minValueRule) {
            const minValue = Number(minValueRule.value)
            if (!Number.isNaN(minValue) && (minValueRule.exProperty === 'not include' ? number <= minValue : number < minValue)) {
                return `不能小于${minValueRule.value}`
            }
        }
    }

    const regxRule = getRule(p.rules, 'regxRule')
    if (regxRule && regxRule.value) {
        try {
            if (!new RegExp(regxRule.value).test(text)) {
                return '格式不正确'
            }
        } catch (error) {
            // 淘宝侧正则前端无法识别时忽略
        }
    }

    return ''
}

const validateProps = () => {
    const checkedProps = propsState.value.filter(p => p.checked && isSubPropVisible(p))
    if (!checkedProps.length) {
        ElMessage.error('请至少勾选一个要修改的属性')
        return false
    }
    for (const p of checkedProps) {
        if (p.readOnly || isAttrDisabled(p)) {
            ElMessage.error(`属性「${p.name}」当前不可修改，请取消勾选`)
            return false
        }
        const message = validateAttr(p)
        if (message) {
            ElMessage.error(`属性「${p.name}」${message}`)
            return false
        }
    }
    return true
}

// ========== 执行方式 ==========
const executeForm = reactive({
    executeMode: 'immediate',
    taskTime: '',
    repeat: 0
})

// ========== 预览 ==========
const loadingPreview = ref(false)
const tableDataPreview = ref([])

const buildContentPayload = () => {
    return {
        templateNumIid: String(templateNumIid.value || '').trim(),
        props: selectedProps.value
    }
}

const preview = async () => {
    if (!validateProps()) {
        return
    }
    loadingPreview.value = true
    try {
        const response = await request.post('/api/v1/batch-update-cat-prop/preview', {
            filterForm: formShopRef.value.form,
            ...buildContentPayload()
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

watch(propsState, () => {
    tableDataPreview.value = []
}, { deep: true })

const formShopChange = () => {
    tableDataPreview.value = []
}

// ========== 开始修改 ==========
const dialogProgressVisible = ref(false)
const percentage = ref(0)
const saveCompleteMsg = ref('')
const progressStats = reactive({ total: 0, success: 0, fail: 0, skip: 0 })
const currentTaskId = ref(null)
const pollTimer = ref(null)

const getUpdatableCount = () => {
    let count = 0
    tableDataPreview.value.forEach(row => {
        if (row.hasChange) {
            count++
        }
    })
    return count
}

const startUpdate = () => {
    if (!validateProps()) {
        return
    }
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
        if (taskTime <= new Date()) {
            ElMessage.error('任务执行时间必须晚于当前时间')
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

    let msg = '即将修改<span class="h-b">' + updatableCount + '</span>个商品的类目属性'
    if (props.quotaStatus.dailyLimit > 0) {
        msg += '，批量改类目属性今日限额<span class="h-b">' + props.quotaStatus.dailyLimit + '</span>个'
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
            const response = await request.get('/api/v1/batch-update-cat-prop/task-progress', {
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

const doStartUpdate = async () => {
    dialogProgressVisible.value = true
    percentage.value = 0
    saveCompleteMsg.value = ''
    progressStats.total = 0
    progressStats.success = 0
    progressStats.fail = 0
    progressStats.skip = 0
    try {
        const response = await request.post('/api/v1/batch-update-cat-prop/create-task', {
            filterForm: formShopRef.value.form,
            ...buildContentPayload()
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
        const response = await request.post('/api/v1/batch-update-cat-prop/create-scheduled-task', {
            filterForm: formShopRef.value.form,
            ...buildContentPayload(),
            taskTime: executeForm.taskTime,
            repeat: executeForm.repeat
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

// ========== 修改记录 ==========
const tableDataRecord = ref([])
const currentPageRecord = ref(1)
const pageSizeRecord = ref(10)
const totalRecord = ref(0)
const getShopRecord = () => {
    request.post('/api/v1/batch-update-cat-prop/get-shop-record', {
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
    if (recordTimer) {
        return
    }
    recordTimer = setInterval(() => {
        if (!document.hidden) {
            getShopRecord()
        }
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
})

defineExpose({ getShopRecord })
</script>

<style scoped>
.cat-prop-tip {
    margin-bottom: 15px;
}

.template-form {
    margin-bottom: 0;
}

.template-title {
    margin: -5px 0 15px 0;
    color: #909399;
    font-size: 12px;
}

.cat-prop-panel {
    margin-bottom: 15px;
}

.cat-prop-summary {
    margin-bottom: 10px;
    color: #606266;
    font-size: 13px;
}

.cat-prop-grid {
    display: grid;
    grid-template-columns: max-content max-content;
    column-gap: 60px;
    row-gap: 18px;
}

.cat-prop-item {
    display: flex;
    flex-direction: column;
}

.cat-prop-head {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 6px;
    font-size: 13px;
    color: #303133;
}

.required-star {
    color: #f56c6c;
    margin-right: 2px;
}

.tip-icon {
    color: #909399;
    cursor: help;
}

.readonly-tag {
    color: #909399;
    font-size: 12px;
}

.cat-prop-control {
    padding-left: 24px;
    min-width: 350px;
    max-width: 500px;
}

.input-with-unit {
    display: flex;
    align-items: center;
    gap: 6px;
}

.unit-text {
    color: #909399;
    font-size: 13px;
    white-space: nowrap;
}

.prop-tip {
    margin-top: 4px;
    color: #909399;
    font-size: 12px;
    line-height: 1.5;
}

.change-line {
    line-height: 1.8;
}

.change-name {
    color: #606266;
}

.change-arrow {
    margin: 0 5px;
    color: #909399;
}

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

.form-group-title {
    color: #303133;
    margin-bottom: 10px;
    font-size: 14px;
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

.gray-tip {
    color: #909399;
    font-size: 12px;
}

.ml-5 {
    margin-left: 5px;
}

.mt-15 {
    margin-top: 15px;
}

.h-b {
    font-weight: bold;
    color: #409EFF;
}

.h {
    font-weight: 500;
}

.text-gray {
    color: #909399;
}
</style>
