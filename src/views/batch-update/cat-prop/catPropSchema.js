/**
 * 类目属性（catProp）schema 解析
 *
 * 后端返回淘宝 schema xml（可能是完整的商品 schema，也可能只是 catProp 字段），
 * 前端从 <fields> 中解析每个属性的 type / rule / options，从 <complex-value> 中解析默认值。
 */

const directChildren = (node, tagName) => {
    if (!node || !node.children) {
        return []
    }
    return Array.from(node.children).filter(child => child.tagName === tagName)
}

const firstDirect = (node, tagName) => {
    return directChildren(node, tagName)[0] || null
}

// 解析 rule 集合
const parseRules = (fieldNode) => {
    const rules = []
    const rulesNode = firstDirect(fieldNode, 'rules')
    if (!rulesNode) {
        return rules
    }
    const ruleNodes = directChildren(rulesNode, 'rule')
    ruleNodes.forEach(ruleNode => {
        const name = ruleNode.getAttribute('name')
        if (!name) {
            return
        }
        const rule = {
            name,
            value: ruleNode.getAttribute('value') ?? '',
            unit: ruleNode.getAttribute('unit') || '',
            exProperty: ruleNode.getAttribute('exProperty') || '',
            target: ruleNode.getAttribute('target') || '',
            url: ruleNode.getAttribute('url') || '',
            desc: ruleNode.getAttribute('desc') || '',
            devInfo: ruleNode.getAttribute('devInfo') || ''
        }
        const dependGroupNode = firstDirect(ruleNode, 'depend-group')
        if (dependGroupNode) {
            rule.dependGroup = {
                operator: dependGroupNode.getAttribute('operator') || 'and',
                expresses: directChildren(dependGroupNode, 'depend-express').map(expressNode => ({
                    fieldId: expressNode.getAttribute('fieldId') || '',
                    value: expressNode.getAttribute('value') ?? '',
                    symbol: expressNode.getAttribute('symbol') || ''
                }))
            }
        }
        rules.push(rule)
    })
    return rules
}

// 解析 options（单选/多选的可选值）
const parseOptions = (fieldNode) => {
    const optionsNode = firstDirect(fieldNode, 'options')
    if (!optionsNode) {
        return []
    }
    return directChildren(optionsNode, 'option').map(optionNode => ({
        label: optionNode.getAttribute('displayName') || optionNode.getAttribute('name') || optionNode.textContent || '',
        value: optionNode.getAttribute('value') ?? ''
    })).filter(option => option.value !== '')
}

// multiInput / multiCheck 的 values 集合
const parseValues = (fieldNode) => {
    const valuesNode = firstDirect(fieldNode, 'values')
    if (!valuesNode) {
        return []
    }
    const valueNodes = directChildren(valuesNode, 'value')
    return valueNodes.map(valueNode => {
        const value = valueNode.getAttribute('value') ?? valueNode.textContent ?? ''
        return {
            label: valueNode.getAttribute('displayName') || valueNode.getAttribute('name') || value,
            value
        }
    }).filter(option => option.value !== '')
}

// properties 中的单位、提示
const parsePropertyMeta = (fieldNode) => {
    const meta = { unit: '', propertyTip: '' }
    const propertiesNode = firstDirect(fieldNode, 'properties')
    if (!propertiesNode) {
        return meta
    }
    const propertyNode = firstDirect(propertiesNode, 'property')
    if (!propertyNode) {
        return meta
    }
    const unitNamesNode = firstDirect(propertyNode, 'unitNames')
    const unitNameNode = unitNamesNode ? firstDirect(unitNamesNode, 'unitName') : null
    if (unitNameNode) {
        meta.unit = unitNameNode.getAttribute('value') || ''
    }
    const tipNode = firstDirect(propertyNode, 'tip')
    if (tipNode) {
        meta.propertyTip = tipNode.getAttribute('value') || ''
    }
    return meta
}

// 解析 <value> 默认值（可能多个）
const parseValueNode = (fieldNode) => {
    if (!fieldNode) {
        return { value: null, inputValue: '' }
    }
    const valueNodes = directChildren(fieldNode, 'value')
    if (!valueNodes.length) {
        return { value: null, inputValue: '' }
    }
    if (valueNodes.length === 1) {
        const valueNode = valueNodes[0]
        return {
            value: (valueNode.textContent || '').trim(),
            inputValue: valueNode.getAttribute('inputValue') || ''
        }
    }
    return {
        value: valueNodes.map(valueNode => (valueNode.textContent || '').trim()),
        inputValue: ''
    }
}

// 从 <complex-value> 收集每个属性的默认值（complex 子字段递归收集）
const collectDefaults = (node, defaults) => {
    if (!node) {
        return
    }
    directChildren(node, 'field').forEach(fieldNode => {
        const id = fieldNode.getAttribute('id')
        if (id) {
            defaults.set(id, parseValueNode(fieldNode))
        }
        collectDefaults(firstDirect(fieldNode, 'complex-value'), defaults)
    })
}

const collectComplexValue = (catPropField) => {
    const defaults = new Map()
    if (!catPropField) {
        return defaults
    }
    collectDefaults(firstDirect(catPropField, 'complex-value'), defaults)
    return defaults
}

// 品牌等属性在 tipRule 中声明「该属性支持自定义输入」时，允许手动输入属性值
const supportsCustomInput = (rules) => {
    return rules.some(rule => rule.name === 'tipRule' && !rule.devInfo
        && String(rule.value || '').includes('该属性支持自定义输入'))
}

const getTipText = (rules, propertyTip) => {
    // devTipRule 和带 devInfo 标记的 tipRule（如“请使用SelectProp接口查询并填充完整子属性后提交”）是给开发者的，不展示给用户
    const tips = rules
        .filter(rule => rule.name === 'tipRule' && rule.value && !rule.devInfo)
        .map(rule => rule.value)
    if (propertyTip && !tips.some(tip => tip.includes(propertyTip))) {
        tips.push(propertyTip)
    }
    return tips.join('；')
}

// 展平 <fields>（complex 子属性递归展平；multiComplex 暂不展开）
const flattenFields = (fieldsNode, defaults, result, parentName = '') => {
    directChildren(fieldsNode, 'field').forEach(fieldNode => {
        const type = fieldNode.getAttribute('type')
        // label 仅用于展示说明，不允许修改
        if (!type || type === 'label') {
            return
        }

        const id = fieldNode.getAttribute('id')
        const name = fieldNode.getAttribute('name') || id
        if (!id) {
            return
        }

        if (type === 'complex' || type === 'multiComplex') {
            // complex 和 multiComplex 的嵌套子字段（如省份 → 城市）都递归展平
            // multiComplex 虽然有多份数据实例，但其子字段是独立属性（如城市），可以单实例编辑
            const nestedFieldsNode = firstDirect(fieldNode, 'fields')
            if (nestedFieldsNode) {
                flattenFields(nestedFieldsNode, defaults, result, name)
            }
            return
        }

        const rules = parseRules(fieldNode)
        const options = parseOptions(fieldNode)
        const values = parseValues(fieldNode)
        const allOptions = options.length ? options : values
        const propertyMeta = parsePropertyMeta(fieldNode)

        // 默认值优先取 complex-value，其次取 field 自带的 <value>
        let defaultValue = defaults.get(id)
        if (!defaultValue || defaultValue.value === null) {
            defaultValue = parseValueNode(fieldNode)
        }

        const required = rules.some(rule => rule.name === 'requiredRule' && rule.value === 'true')
        const readOnly = rules.some(rule => rule.name === 'readOnlyRule' && rule.value === 'true')
        // 单选属性（如品牌）声明支持自定义输入时，允许用户手动输入名称
        const allowCustomInput = type === 'singleCheck' && supportsCustomInput(rules)

        let value = defaultValue.value
        if (type === 'multiCheck') {
            value = Array.isArray(value) ? value : (value === null || value === '' ? [] : [value])
        } else if (Array.isArray(value)) {
            value = value[0] ?? ''
        } else if (value === null) {
            value = ''
        }

        // 带单位的 input 属性，淘宝值格式为“值单位”（如 24g），输入框只显示数值部分，提交时由页面拼回单位
        if (type === 'input' && propertyMeta.unit && typeof value === 'string'
            && value !== '' && value.endsWith(propertyMeta.unit)) {
            value = value.slice(0, -propertyMeta.unit.length)
        }

        // 单选默认值不在 options 中时（自定义属性值），补充一个用于回显的选项
        if (type === 'singleCheck' && defaultValue.inputValue
            && value !== '' && !allOptions.some(option => option.value === value)) {
            allOptions.push({ label: defaultValue.inputValue, value })
        }

        if (result.has(id)) {
            return
        }

        result.set(id, {
            id,
            name: parentName ? `${parentName} > ${name}` : name,
            type,
            required,
            readOnly,
            allowCustomInput,
            rules,
            options: allOptions,
            unit: propertyMeta.unit,
            propertyTip: propertyMeta.propertyTip,
            tip: getTipText(rules, propertyMeta.propertyTip),
            value,
            defaultValue: value,
            checked: false
        })
    })
}

// 淘宝 schema 的 tipRule 中可能直接内嵌未转义的 html 片段（如 <a href='...'>），
// 标准 XML 解析器会报错，这里先做兼容处理再解析。
const sanitizeXml = (xml) => {
    let result = String(xml).replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')
    result = result.replace(/="([^"]*)"/g, (match, value) => `="${value.replace(/</g, '&lt;')}"`)
    result = result.replace(/='([^']*)'/g, (match, value) => `='${value.replace(/</g, '&lt;')}'`)
    return result
}

/**
 * 解析 catProp schema
 * @param {string} xml schema xml 字符串
 * @returns {{fields: Array, parseError: string}}
 */
export const parseCatPropSchema = (xml) => {
    if (!xml || !String(xml).trim()) {
        return { fields: [], parseError: '属性数据为空' }
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(sanitizeXml(xml).trim(), 'text/xml')
    if (doc.querySelector('parsererror')) {
        return { fields: [], parseError: '属性数据格式错误' }
    }

    const root = doc.documentElement
    let catPropField = null
    if (root.tagName === 'field' && root.getAttribute('id') === 'catProp') {
        catPropField = root
    } else {
        catPropField = root.querySelector('field[id="catProp"]')
    }

    let fieldsNode = null
    if (catPropField) {
        fieldsNode = firstDirect(catPropField, 'fields')
    }
    if (!fieldsNode) {
        // 兼容后端直接返回 <fields> 的情况
        fieldsNode = root.tagName === 'fields' ? root : root.querySelector('fields')
    }
    if (!fieldsNode) {
        return { fields: [], parseError: '未找到可修改的类目属性' }
    }

    const defaults = collectComplexValue(catPropField)
    const result = new Map()
    flattenFields(fieldsNode, defaults, result)

    return { fields: Array.from(result.values()), parseError: '' }
}

// 计算字符串长度（unit: byte 中文按 2 计，character 中文按 1 计）
export const countLength = (value, unit) => {
    const str = String(value ?? '')
    if (unit === 'character') {
        return Array.from(str).length
    }
    let length = 0
    for (const char of str) {
        length += (char.codePointAt(0) || 0) > 127 ? 2 : 1
    }
    return length
}

// 求规则值
export const getRule = (rules, name) => {
    return (rules || []).find(rule => rule.name === name) || null
}

const toNumber = (value) => {
    if (value === null || value === undefined || String(value).trim() === '') {
        return null
    }
    const number = Number(value)
    return Number.isNaN(number) ? null : number
}

const compareNumber = (actual, expected, symbol) => {
    const actualNumber = toNumber(actual)
    const expectedNumber = toNumber(expected)
    if (actualNumber === null || expectedNumber === null) {
        return false
    }
    switch (symbol) {
        case '>': return actualNumber > expectedNumber
        case '<': return actualNumber < expectedNumber
        case '>=': return actualNumber >= expectedNumber
        case '<=': return actualNumber <= expectedNumber
        case '==': return actualNumber === expectedNumber
        case '!=': return actualNumber !== expectedNumber
        default: return false
    }
}

// 计算 depend-express 是否成立
const evaluateExpress = (express, valueMap) => {
    const actual = valueMap[express.fieldId]
    const actualValue = Array.isArray(actual) ? actual.join(',') : (actual ?? '')
    const expected = express.value ?? ''
    switch (express.symbol) {
        case 'is null':
            return actualValue === ''
        case '==':
            return String(actualValue) === String(expected)
        case '!=':
            return String(actualValue) !== String(expected)
        case '>':
        case '<':
        case '>=':
        case '<=':
            return compareNumber(actualValue, expected, express.symbol)
        case 'contains':
            return String(actualValue).includes(String(expected))
        case 'not contains':
            return !String(actualValue).includes(String(expected))
        default:
            // this field's value in/not in fieldOptions 依赖字段自己的可选值列表，前端不做计算
            return false
    }
}

/**
 * 根据 disableRule + depend-group 计算属性当前是否被禁用
 * @param {Object} attr 属性
 * @param {Object} valueMap 所有属性的当前值（id -> value）
 */
export const isRuleDisabled = (attr, valueMap) => {
    const disableRule = getRule(attr.rules, 'disableRule')
    if (!disableRule || disableRule.value !== 'true') {
        return false
    }
    if (!disableRule.dependGroup) {
        return true
    }
    const expresses = disableRule.dependGroup.expresses || []
    if (!expresses.length) {
        return true
    }
    const results = expresses.map(express => evaluateExpress(express, valueMap))
    return disableRule.dependGroup.operator === 'or' ? results.some(Boolean) : results.every(Boolean)
}
