// 条形码前端校验
// 淘宝 schema：barcode / skuBarcode 为 input，maxLengthRule=32(byte)、valueTypeRule=text。
// 这里额外做标准条码规则校验：纯数字 + 8/12/13/14 位（EAN-8/UPC-A/EAN-13/ITF-14）+ 校验位。
// 商家编码模式下无法在前端判断合法性，由后端预览/提交时判定。
export const BARCODE_MAX_BYTES = 32

const BARCODE_LENGTHS = [8, 12, 13, 14]

export const getByteLength = (str) => new TextEncoder().encode(str).length

// GTIN mod-10 校验位算法（EAN-8/UPC-A/EAN-13/ITF-14 通用）
const isValidCheckDigit = (code) => {
    const digits = code.split('').map(Number)
    const check = digits.pop()
    let sum = 0
    // 从右往左，末位权重 3、依次 1/3 交替
    for (let i = digits.length - 1, weight = 3; i >= 0; i--, weight = weight === 3 ? 1 : 3) {
        sum += digits[i] * weight
    }
    return (10 - (sum % 10)) % 10 === check
}

// 返回空字符串表示通过，否则返回错误提示
export const validateBarcode = (value) => {
    const str = String(value ?? '')
    if (str === '') return ''
    if (getByteLength(str) > BARCODE_MAX_BYTES) {
        return '条形码不能超过32字节（1个汉字按3字节计算）'
    }
    if (/[\s\u0000-\u001f\u007f]/.test(str)) {
        return '条形码不能包含空格、换行等字符'
    }
    if (!/^\d+$/.test(str)) {
        return '条形码只能填写数字'
    }
    if (!BARCODE_LENGTHS.includes(str.length)) {
        return '条形码长度应为 8、12、13 或 14 位数字'
    }
    if (!isValidCheckDigit(str)) {
        return '条形码校验位不正确，请核对后重新填写'
    }
    return ''
}
