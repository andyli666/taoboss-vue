<template>
    <el-divider content-position="left">修改范围</el-divider>
    <FormShop ref="formShopRef" @form-change="formShopChange" />

    <el-divider content-position="left">修改内容</el-divider>
    <el-alert class="food-prop-tip" type="warning" :closable="false" show-icon
        title="在需要修改的选项前打√；输入框留空表示删除该选项" />

    <el-form :inline="true" label-width="auto" class="template-form">
        <el-form-item label="模板商品">
            <el-input v-model="templateNumIid" placeholder="请选择商品或输入商品id" clearable style="width:300px"
                @input="handleTemplateInput" />
            <el-button plain size="small" class="ml-5" @click="itemSelectVisible = true">选择模板商品</el-button>
            <el-button type="primary" size="small" class="ml-5" :loading="defaultsLoading" @click="fetchDefaults">
                获取默认值
            </el-button>
            <el-tooltip content="可通过模板商品获取属性默认值，也可以不选模板商品，全部手动填写" placement="top"
                :show-after="200">
                <el-icon class="tip-icon ml-5">
                    <QuestionFilled />
                </el-icon>
            </el-tooltip>
        </el-form-item>
    </el-form>
    <div v-if="templateTitle" class="template-title">
        模板商品：{{ templateTitle }}
        <template v-if="filledCount > 0">，已自动填充 {{ filledCount }} 个属性默认值（需打√才会提交修改）</template>
    </div>

    <div class="food-prop-panel">
        <div class="food-prop-summary">
            共 <b>{{ propsState.length }}</b> 个食品属性，已勾选 <b>{{ checkedCount }}</b> 个
        </div>
        <div class="food-prop-grid">
            <div v-for="p in propsState" :key="p.id" class="food-prop-item">
                <div class="food-prop-head">
                    <el-checkbox v-model="p.checked" size="small">
                        <span v-if="p.id === FOOD_IDS.produceDate && produceDateRequired"
                            class="required-star">*</span>{{ p.name }}
                    </el-checkbox>
                </div>
                <div class="food-prop-control">
                    <template v-if="p.type === 'singleCheck'">
                        <el-select v-model="p.value" :disabled="!p.checked || isPropDisabled(p)"
                            placeholder="请选择" clearable style="width:100%">
                            <el-option v-for="opt in p.options" :key="opt.value" :label="opt.label"
                                :value="opt.value" />
                        </el-select>
                    </template>
                    <template v-else-if="p.type === 'complex'">
                        <!-- 生产日期：开始/结束时间上下两个日期控件，中间 - 分隔 -->
                        <div class="date-range-vertical">
                            <el-date-picker v-model="p.value.start" type="date" value-format="YYYY-MM-DD"
                                placeholder="开始时间" :disabled="!p.checked" :disabled-date="disableFutureDate"
                                style="width:100%" />
                            <span class="date-sep">-</span>
                            <el-date-picker v-model="p.value.end" type="date" value-format="YYYY-MM-DD"
                                placeholder="结束时间" :disabled="!p.checked" :disabled-date="disableFutureDate"
                                style="width:100%" />
                        </div>
                    </template>
                    <template v-else>
                        <div class="input-with-unit">
                            <el-input v-model="p.value" :disabled="!p.checked || isPropDisabled(p)"
                                placeholder="请输入" clearable />
                            <span v-if="p.unit" class="unit-text">{{ p.unit }}</span>
                        </div>
                    </template>
                    <div v-if="getRuleHint(p)" class="prop-tip">{{ getRuleHint(p) }}</div>
                </div>
            </div>
        </div>
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

    <FoodPropShopDetail ref="shopRecordDetailRef" :recordId="recordId" @task-created="handleTaskCreated" />

    <!-- 单选模板商品弹窗 -->
    <el-dialog v-model="itemSelectVisible" title="选择模板商品" width="950" append-to-body>
        <ItemSelect ref="itemSelectRef" @row-click="handleTemplateItemSelected" />
    </el-dialog>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, useTemplateRef, watch } from 'vue'
import FormShop from '../components/FormShop.vue'
import FoodPropShopDetail from './FoodPropShopDetail.vue'
import ItemSelect from '@/components/ItemSelect.vue'
import { getItemWirelessUrl, getApproveStatus, isValidNumIid } from '@/utils/index'
import request from '@/utils/request'
import { useIndexMethod } from '@/composables/useIndexMethod'
import { Refresh, QuestionFilled } from '@element-plus/icons-vue'
import { countLength, getRule, isRuleDisabled } from '../cat-prop/catPropSchema'
import { createFoodPropFields, FOOD_IDS, mergeProduceDateChanges, parseFoodDefaults } from './foodPropSchema'

const props = defineProps({
    quotaStatus: { type: Object, required: true }
})
const emit = defineEmits(['refreshQuota'])

// ========== 食品属性（固定字段，字段固定，默认值可从模板商品回填） ==========
const formShopRef = useTemplateRef('formShopRef')
const propsState = ref(createFoodPropFields())

// ========== 模板商品（回填食品属性默认值） ==========
const templateNumIid = ref('')
const templateTitle = ref('')
const loadedTemplateId = ref('')
const filledCount = ref(0)
const defaultsLoading = ref(false)
const itemSelectVisible = ref(false)
const itemSelectRef = useTemplateRef('itemSelectRef')

const handleTemplateInput = () => {
    if (String(templateNumIid.value || '').trim() === loadedTemplateId.value) {
        return
    }
    templateTitle.value = ''
    filledCount.value = 0
}

const handleTemplateItemSelected = (row) => {
    if (!row) {
        return
    }
    templateNumIid.value = String(row.num_iid)
    templateTitle.value = row.title || ''
    itemSelectVisible.value = false
    // 从弹窗选中商品后自动获取默认值，无需手动点击
    fetchDefaults()
}

// 把模板商品的属性值回填到表单（生产日期按开始/结束时间回填）
const applyDefaults = (defaults) => {
    let count = 0
    propsState.value.forEach(p => {
        if (p.type === 'complex') {
            let filled = false
            p.subFields.forEach(sub => {
                const value = defaults[sub.id] || ''
                p.value[sub.key] = value
                filled = filled || !!value
            })
            if (filled) {
                count++
            }
            return
        }
        const value = defaults[p.id]
        p.value = value == null ? '' : String(value)
        if (p.value !== '') {
            count++
        }
    })
    return count
}

const fetchDefaults = async () => {
    const numIid = String(templateNumIid.value || '').trim()
    const valid = isValidNumIid(numIid)
    if (valid !== true) {
        ElMessage.error(valid)
        return
    }
    defaultsLoading.value = true
    try {
        const response = await request.get('/api/v1/batch-update-food-prop/props', {
            params: { numIid }
        })
        if (response.data.code !== 0) {
            ElMessage.error(response.data.msg || '获取默认值失败')
            return
        }
        const data = response.data.data || {}
        const defaults = data.values && typeof data.values === 'object'
            ? data.values
            : parseFoodDefaults(data.schemaXml || data.schema || '')
        const count = applyDefaults(defaults)
        loadedTemplateId.value = numIid
        if (data.title) {
            templateTitle.value = data.title
        }
        filledCount.value = count
        if (count > 0) {
            ElMessage.success(`已从模板商品填充 ${count} 个属性默认值，打√后才提交修改`)
        } else {
            ElMessage.warning('模板商品暂无食品属性值，请手动填写')
        }
    } catch (error) {
        // 错误已由 request.js 拦截器提示，避免重复弹
    } finally {
        defaultsLoading.value = false
    }
}

const getField = (id) => propsState.value.find(p => p.id === id)

// 生产日期不能选择明天及以后的日期（只能选今天及之前）
const disableFutureDate = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date.getTime() > today.getTime()
}

const valueIsEmpty = (value) => value === '' || value === null || value === undefined

// 各属性当前值（用于计算 depend-group 依赖，如有机证书编号随「是否为有机食品」禁用）
const valueMap = computed(() => {
    const map = {}
    propsState.value.forEach(p => {
        map[p.id] = p.type === 'complex' ? '' : (p.value ?? '')
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

const isPropDisabled = (p) => p.readOnly || disabledMap.value[p.id] === true

// 「是否为有机食品」选否（0）时，有机证书编号禁用，自动取消勾选并清空，避免残留提交
watch(() => getField(FOOD_IDS.organicFood)?.value, (val) => {
    if (String(val) === '0') {
        const cert = getField(FOOD_IDS.organicCert)
        if (cert) {
            cert.checked = false
            cert.value = ''
        }
    }
})

// 保质期勾选且大于30天时，生产日期必填（复选框前显示 *）
const produceDateRequired = computed(() => {
    const period = getField(FOOD_IDS.period)
    return !!(period && period.checked && !valueIsEmpty(period.value) && Number(period.value) > 30)
})

const checkedCount = computed(() => propsState.value.filter(p => p.checked).length)

const getValueText = (p) => {
    if (p.type === 'singleCheck') {
        const option = p.options.find(opt => String(opt.value) === String(p.value))
        return option ? option.label : (p.value ?? '')
    }
    return p.value ?? ''
}

// 提交的属性列表；生产日期为 complex 字段，拆成 _start/_end 两个子字段提交（value 留空表示删除），后端合并写入 complex-value
const selectedProps = computed(() => {
    const list = []
    propsState.value.forEach(p => {
        if (!p.checked) {
            return
        }
        if (p.type === 'complex') {
            p.subFields.forEach(sub => {
                const val = p.value[sub.key] || ''
                list.push({ id: sub.id, name: `${p.name}-${sub.name}`, type: 'input', value: val, valueText: val })
            })
            return
        }
        const value = p.value ?? ''
        list.push({ id: p.id, name: p.name, type: p.type, value, valueText: getValueText(p) })
    })
    return list
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

// 规则提示（长度、单位等）
const getRuleHint = (p) => {
    const hints = []
    const maxLengthRule = getRule(p.rules, 'maxLengthRule')
    if (maxLengthRule) {
        hints.push(`最多${maxLengthRule.value}${unitLabel(maxLengthRule.unit)}`)
    }
    if (p.id === FOOD_IDS.period) {
        hints.push('单位：天，只能为正整数')
    }
    if (p.tip) {
        hints.push(p.tip)
    }
    return hints.join('；')
}

// 单个属性校验，返回错误提示（空字符串表示通过）；留空=删除该内容，允许提交
const validateAttr = (p) => {
    if (p.type === 'complex') {
        return ''
    }
    const value = p.value
    if (valueIsEmpty(value)) {
        return ''
    }

    if (p.type === 'singleCheck') {
        return p.options.some(opt => String(opt.value) === String(value)) ? '' : '请选择有效的选项'
    }

    const text = String(value)
    const maxLengthRule = getRule(p.rules, 'maxLengthRule')
    if (maxLengthRule && countLength(text, maxLengthRule.unit) > Number(maxLengthRule.value)) {
        return `长度不能超过${maxLengthRule.value}${unitLabel(maxLengthRule.unit)}`
    }

    const regexRule = getRule(p.rules, 'regexRule')
    if (regexRule && regexRule.value) {
        try {
            // 淘宝 schema 正则按整串匹配（如保质期 [1-9][0-9]*）
            if (!new RegExp('^(?:' + regexRule.value + ')$').test(text)) {
                return p.id === FOOD_IDS.period ? '请输入正整数' : '格式不正确'
            }
        } catch (error) {
            // 淘宝侧正则前端无法识别时忽略
        }
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

    return ''
}

const validateProps = () => {
    const checkedProps = propsState.value.filter(p => p.checked)
    if (!checkedProps.length) {
        ElMessage.error('请至少勾选一个要修改的食品属性')
        return false
    }
    for (const p of checkedProps) {
        if (p.readOnly || isPropDisabled(p)) {
            ElMessage.error(`属性「${p.name}」当前不可修改，请取消勾选`)
            return false
        }
        const message = validateAttr(p)
        if (message) {
            ElMessage.error(`属性「${p.name}」${message}`)
            return false
        }
    }
    // 「是否为有机食品」为是时，必须填写有效的有机证书编号
    const organicFood = getField(FOOD_IDS.organicFood)
    const organicCert = getField(FOOD_IDS.organicCert)
    if (organicFood && organicFood.checked && String(organicFood.value) === '1') {
        if (!organicCert.checked) {
            ElMessage.error('「是否为有机食品」为"是"时，请勾选并填写有效的有机证书编号')
            return false
        }
        if (valueIsEmpty(organicCert.value)) {
            ElMessage.error('「是否为有机食品」为"是"时，请填写有效的有机证书编号')
            return false
        }
    }
    // 生产日期：开始/结束时间必须成对填写，开始不能晚于结束
    const period = getField(FOOD_IDS.period)
    const produceDate = getField(FOOD_IDS.produceDate)
    if (produceDate.checked) {
        const start = produceDate.value.start
        const end = produceDate.value.end
        if (!!start !== !!end) {
            ElMessage.error('生产日期的开始时间和结束时间必须同时填写（留空则删除生产日期）')
            return false
        }
        if (start && String(start) > String(end)) {
            ElMessage.error('生产日期的开始时间不能晚于结束时间')
            return false
        }
    }
    // 保质期大于30天时，必须设置生产日期
    const periodNum = period && period.checked && !valueIsEmpty(period.value) ? Number(period.value) : null
    if (periodNum !== null && periodNum > 30) {
        if (!produceDate.checked) {
            ElMessage.error('保质期大于30天时，必须勾选并设置生产日期')
            return false
        }
        if (!produceDate.value.start || !produceDate.value.end) {
            ElMessage.error('保质期大于30天时，必须填写生产日期的开始时间和结束时间')
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
        props: selectedProps.value
    }
}

const preview = async () => {
    if (!validateProps()) {
        return
    }
    loadingPreview.value = true
    try {
        const response = await request.post('/api/v1/batch-update-food-prop/preview', {
            filterForm: formShopRef.value.form,
            ...buildContentPayload()
        })
        loadingPreview.value = false
        if (response.data.code === 0) {
            // 生产日期的开始/结束时间子字段合并为一行展示，未变化的子字段用当前填写值补齐
            const produceDate = getField(FOOD_IDS.produceDate)
            const produceDateValue = produceDate && produceDate.checked ? { ...produceDate.value } : null
            tableDataPreview.value = (response.data.data.rows || []).map(row => ({
                ...row,
                changes: mergeProduceDateChanges(row.changes, produceDateValue)
            }))
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

    let msg = '即将修改<span class="h-b">' + updatableCount + '</span>个商品的食品属性'
    if (props.quotaStatus.dailyLimit > 0) {
        msg += '，批量改食品属性今日限额<span class="h-b">' + props.quotaStatus.dailyLimit + '</span>个'
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
            const response = await request.get('/api/v1/batch-update-food-prop/task-progress', {
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
        const response = await request.post('/api/v1/batch-update-food-prop/create-task', {
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
        const response = await request.post('/api/v1/batch-update-food-prop/create-scheduled-task', {
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
    request.post('/api/v1/batch-update-food-prop/get-shop-record', {
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
.food-prop-tip {
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

.tip-icon {
    color: #909399;
    cursor: help;
}

.food-prop-panel {
    margin-bottom: 15px;
}

.food-prop-summary {
    margin-bottom: 10px;
    color: #606266;
    font-size: 13px;
}

.food-prop-grid {
    display: grid;
    grid-template-columns: max-content max-content;
    column-gap: 60px;
    row-gap: 18px;
}

.food-prop-item {
    display: flex;
    flex-direction: column;
}

.food-prop-head {
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

.food-prop-control {
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

.date-range-vertical {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.date-sep {
    color: #606266;
    line-height: 1;
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
