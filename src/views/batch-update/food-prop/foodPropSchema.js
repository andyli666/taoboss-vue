/**
 * 食品属性（foodProp）固定字段定义
 *
 * 与类目属性（catProp）不同：食品属性字段是固定的，无需从模板商品获取 schema，
 * 字段结构来自淘宝食品类目 schema（taobaoFood* / food_security.* 字段）。
 * 各商品的当前值由后端预览时逐商品获取并在预览结果中展示，
 * 前端表单只提交勾选属性的新值：勾选并填写=修改，勾选但留空=删除该内容。
 *
 * rules 结构与 catPropSchema 解析出的规则保持一致，可直接复用 getRule / isRuleDisabled / countLength。
 */

import { sanitizeXml } from '../cat-prop/catPropSchema'

const rule = (name, value, extra = {}) => ({
    name,
    value: value ?? '',
    unit: '',
    exProperty: '',
    target: '',
    url: '',
    desc: '',
    devInfo: '',
    ...extra
})

const inputRules = (maxLength) => [
    rule('maxLengthRule', String(maxLength), { unit: 'byte', exProperty: 'include' }),
    rule('valueTypeRule', 'text')
]

// 关键字段 id（跨字段校验与模板判断用）
export const FOOD_IDS = {
    organicFood: 'food_security.organic_food',
    organicCert: 'food_security.organic_certification',
    period: 'taobaoFoodPeriod',
    produceDate: 'taobaoFoodProduceDate'
}

// 生产日期的 complex 子字段 id
const PRODUCE_DATE_START_ID = FOOD_IDS.produceDate + '_start'
const PRODUCE_DATE_END_ID = FOOD_IDS.produceDate + '_end'

const formatProduceSide = (start, end) => {
    if (start && end) {
        return `${start} ~ ${end}`
    }
    return start || end || ''
}

/**
 * 合并生产日期子字段的变更
 *
 * 生产日期是 complex 字段，提交与预览都按 _start/_end 两个子字段返回，只返回有变化的子字段。
 * 展示时合并成一行「开始时间 ~ 结束时间」：未变化的子字段取当前填写值（未变化即原值等于新值）。
 *
 * @param {Array} changes 变更列表
 * @param {{start: string, end: string}|null} produceDateValue 当前填写值（预览时可传，修改记录时传 null）
 */
export const mergeProduceDateChanges = (changes, produceDateValue) => {
    if (!Array.isArray(changes) || !changes.length) {
        return changes || []
    }
    const startChange = changes.find(c => c.propId === PRODUCE_DATE_START_ID)
    const endChange = changes.find(c => c.propId === PRODUCE_DATE_END_ID)
    if (!startChange && !endChange) {
        return changes
    }
    const formStart = produceDateValue?.start || ''
    const formEnd = produceDateValue?.end || ''
    const merged = {
        propId: FOOD_IDS.produceDate,
        propName: '生产日期',
        oldValue: formatProduceSide(startChange ? startChange.oldValue : formStart, endChange ? endChange.oldValue : formEnd),
        newValue: formatProduceSide(startChange ? startChange.newValue : formStart, endChange ? endChange.newValue : formEnd)
    }
    const result = []
    changes.forEach(change => {
        if (change.propId === PRODUCE_DATE_START_ID || change.propId === PRODUCE_DATE_END_ID) {
            if (!result.includes(merged)) {
                result.push(merged)
            }
            return
        }
        result.push(change)
    })
    return result
}

/**
 * 解析模板商品 schema 中的食品属性默认值
 *
 * 淘宝 schema 中食品属性的值在 <value>（普通字段）或 <complex-value> 的子字段 <value> 内，
 * 这里统一收集成 id -> 值 的映射，用于从模板商品回填表单。
 *
 * @param {string} xml schema xml 字符串
 * @returns {Object} id -> 值
 */
export const parseFoodDefaults = (xml) => {
    if (!xml || !String(xml).trim()) {
        return {}
    }
    // 后端返回的是并列的多个 <field> 片段（没有唯一根节点），直接解析会报错，先包一层根节点
    const content = sanitizeXml(xml).trim().replace(/^<\?xml[^>]*\?>\s*/i, '')
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<schema>${content}</schema>`, 'text/xml')
    if (doc.querySelector('parsererror')) {
        return {}
    }
    const defaults = {}
    // 包含 complex-value 内的子字段（如生产日期的开始/结束时间）
    doc.querySelectorAll('field').forEach(fieldNode => {
        const id = fieldNode.getAttribute('id')
        if (!id) {
            return
        }
        const valueNode = Array.from(fieldNode.children).find(child => child.tagName === 'value')
        if (valueNode) {
            defaults[id] = (valueNode.textContent || '').trim()
        }
    })
    return defaults
}

export const foodPropFields = [
    {
        id: 'taobaoFoodPrdLicense',
        name: '生产许可证',
        type: 'input',
        required: false,
        readOnly: false,
        unit: '',
        rules: inputRules(50),
        tip: '淘宝网将提醒消费者购买带有生产许可证编号的商品，目前支持生产许可证号QS或者SC，填写示例：QS123456789012或SC12345678901234'
    },
    {
        id: 'taobaoFoodDesignCode',
        name: '产品标准号',
        type: 'input',
        required: false,
        readOnly: false,
        unit: '',
        rules: inputRules(50),
        tip: ''
    },
    {
        id: 'taobaoFoodFactoryName',
        name: '厂名',
        type: 'input',
        required: false,
        readOnly: false,
        unit: '',
        rules: inputRules(100),
        tip: ''
    },
    {
        id: 'taobaoFoodFactorySite',
        name: '厂址',
        type: 'input',
        required: false,
        readOnly: false,
        unit: '',
        rules: inputRules(400),
        tip: '以下信息请按照商品包装显示填写，厂名厂址会在填写生产许可证编号后自动匹配国家网信息'
    },
    {
        id: 'taobaoFoodFactoryContact',
        name: '厂家联系方式',
        type: 'input',
        required: false,
        readOnly: false,
        unit: '',
        rules: inputRules(50),
        tip: ''
    },
    {
        id: FOOD_IDS.organicFood,
        name: '是否为有机食品',
        type: 'singleCheck',
        required: false,
        readOnly: false,
        unit: '',
        rules: [],
        options: [
            { label: '否', value: '0' },
            { label: '是', value: '1' }
        ],
        tip: '请务必如实填写，该信息会透传给消费者，避免客诉和欺诈带来的损失；当前项选择【是】时，请填写有效的有机证书编号'
    },
    {
        id: FOOD_IDS.organicCert,
        name: '有机证书编号',
        type: 'input',
        required: false,
        readOnly: false,
        unit: '',
        rules: [
            ...inputRules(50),
            // 「是否为有机食品」为否（0）时禁用
            rule('disableRule', 'true', {
                dependGroup: {
                    operator: 'and',
                    expresses: [{ fieldId: FOOD_IDS.organicFood, value: '0', symbol: '==' }]
                }
            })
        ],
        tip: '请务必如实填写，避免客诉和欺诈带来的损失'
    },
    {
        id: 'taobaoFoodMix',
        name: '配料',
        type: 'input',
        required: false,
        readOnly: false,
        unit: '',
        rules: inputRules(200),
        tip: ''
    },
    {
        id: 'taobaoFoodPlanStorage',
        name: '储藏方法',
        type: 'input',
        required: false,
        readOnly: false,
        unit: '',
        rules: inputRules(50),
        tip: ''
    },
    {
        id: FOOD_IDS.period,
        name: '保质期',
        type: 'input',
        required: false,
        readOnly: false,
        unit: '天',
        rules: [
            rule('maxValueRule', '100000000', { exProperty: 'not include' }),
            rule('minValueRule', '0', { exProperty: 'not include' }),
            rule('regexRule', '([1-9][0-9]*)?')
        ],
        tip: '保质期≤30天时无需设置生产日期，大于30天时必须设置生产日期'
    },
    {
        id: 'taobaoFoodAdditive',
        name: '食品添加剂',
        type: 'input',
        required: false,
        readOnly: false,
        unit: '',
        rules: inputRules(100),
        tip: ''
    },
    {
        id: FOOD_IDS.produceDate,
        name: '生产日期',
        type: 'complex',
        required: false,
        readOnly: false,
        unit: '',
        rules: [rule('tipRule', '请如实填写并定期更新发货商品的生产日期区间，以更好的突出日期新鲜卖点')],
        tip: '请如实填写并定期更新发货商品的生产日期区间，以更好的突出日期新鲜卖点',
        // complex 子字段：开始/结束时间；提交时拆成两个子字段（value 为空字符串表示删除生产日期）
        subFields: [
            { id: 'taobaoFoodProduceDate_start', name: '开始时间', key: 'start' },
            { id: 'taobaoFoodProduceDate_end', name: '结束时间', key: 'end' }
        ]
    }
]

// 创建可编辑的表单状态（value/checked 每次独立，rules/options 只读共享）
export const createFoodPropFields = () => {
    return foodPropFields.map(f => ({
        ...f,
        options: (f.options || []).map(o => ({ ...o })),
        value: f.type === 'complex' ? { start: '', end: '' } : '',
        checked: false
    }))
}
