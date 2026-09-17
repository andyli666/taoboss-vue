export const deepCopy = (obj, hash = new WeakMap()) => {
    if (obj === null) return null;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof RegExp) return new RegExp(obj);
    if (typeof obj !== "object") return obj;
    if (obj instanceof Map) return new Map(Array.from(obj, ([key, value]) => [key, deepCopy(value)]));
    if (obj instanceof Set) return new Set(Array.from(obj, (value) => deepCopy(value)));

    if (hash.has(obj)) return hash.get(obj); // 处理循环引用
    const result = Array.isArray(obj) ? [] : {};
    hash.set(obj, result); // 存储原始对象和其副本的映射关系

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            result[key] = deepCopy(obj[key], hash);
        }
    }
    return result;
}

//获取商品的无线链接
export const getItemWirelessUrl = (itemId) => {
    return 'https://h5.m.taobao.com/awp/core/detail.htm?id=' + itemId
}

//获取店铺分类的无线链接
export const getSellerCatWirelessUrl = (sid, sellerId, cid) => {
    return `https://market.m.taobao.com/app/tb-source-app/shop-auction/pages/auction?sellerId=${sellerId}&shopId=${sid}&from=category&wirelessShopCategoryList=${cid}&wh_weex=true&wx_navbar_hidden=true&wx_navbar_transparent=true`
}

export const isEmptyObject = (obj) => {
    return Object.keys(obj).length === 0
}

export const downloadImg = (imgUrl, fileName) => {
    // 打开图片
    // // 创建一个临时链接元素
    // const link = document.createElement('a');
    // link.href = imgUrl;
    // link.download = fileName;

    // // 模拟点击打开
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);

    // 下载（而不是打开）图片
    fetch(imgUrl)
        .then(response => response.blob())
        .then(blob => {
            // 创建对象URL
            const blobUrl = URL.createObjectURL(blob)

            // 创建一个临时链接元素
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = fileName
            link.style.display = 'none'

            // 添加到文档中并模拟点击
            document.body.appendChild(link)
            link.click();

            // 清理
            document.body.removeChild(link)
            URL.revokeObjectURL(blobUrl)

            // 显示成功消息
            ElMessage.success('下载成功！')
        })
        .catch(error => {
            ElMessage.error('下载失败，请稍后重试')
        })
}

// 获取某个日期是周几
export const getWeek = (date) => {
    if (!date) {
        return
    }
    return '周' + '日一二三四五六'.charAt(new Date(date).getDay())
}

// 验证一个字符串是否是有效num_iid（符合“8-18位数字，不以0开头”）
export const isValidNumIid = (str) => {
    // 正则表达式解释：
    // ^[1-9] 表示字符串必须以1到9之间的数字开头（不以0开头）
    // \d{7,17} 表示紧跟着前面的数字后，必须有7到17位数字
    // $ 表示字符串的结束
    const regex = /^[1-9]\d{7,17}$/
    if (regex.test(str)) {
        return true
    } else {
        return '商品ID必须是8~18位数字，不以0开头'
    }
}
// 获取商品状态
export const getApproveStatus = (approveStatus) => {
    if (approveStatus == 'onsale') {
        return '出售中'
    } else if (approveStatus == 'instock') {
        return '仓库中'
    }
    return '未知状态'
}

// 获得字符串实际长度，中文2，英文1
export const getLength = (str) => {
    var realLength = 0, len = str.length, charCode = -1
    for (var i = 0; i < len; i++) {
        charCode = str.charCodeAt(i)
        if (charCode >= 0 && charCode <= 128) {
            realLength += 1
        } else {
            realLength += 2
        }
    }
    return realLength
}

// 在字符串的特定位置插入另一个字符串
export const insertStringAt = (originalString, stringToInsert, position) => {
    return originalString.substring(0, position) + stringToInsert + originalString.substring(position)
}

/**
 * 格式化金额
 * @param {number|string} value 金额
 * @returns {string} 格式化后的金额，保留两位小数
 */
export const formatMoney = (value) => {
    const num = Number(value) || 0
    return num.toFixed(2)
}

/**
 * 获取淘宝订单详情链接
 * @param {string|number} tid 订单号
 * @returns {string} 淘宝订单详情URL
 */
export const getTaobaoOrderUrl = (tid) => {
    return `https://qn.taobao.com/home.htm/trade-platform/tp/detail?bizOrderId=${tid}`
}

import dayjs from 'dayjs'

// 日期范围快捷选项
export const dateShortcuts = [
    {
        text: '今天',
        value: () => {
            const today = new Date()
            return [today, today]
        }
    },
    {
        text: '昨天',
        value: () => {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            return [yesterday, yesterday]
        }
    },
    {
        text: '最近7天',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - 7)
            return [start, end]
        }
    },
    {
        text: '最近30天',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - 30)
            return [start, end]
        }
    },
    {
        text: '本月',
        value: () => {
            const start = dayjs().startOf('month').toDate()
            const end = dayjs().endOf('month').toDate()
            return [start, end]
        }
    },
    {
        text: '上月',
        value: () => {
            const start = dayjs().subtract(1, 'month').startOf('month').toDate()
            const end = dayjs().subtract(1, 'month').endOf('month').toDate()
            return [start, end]
        }
    }
]

// 月份范围快捷选项
export const monthShortcuts = [
    {
        text: '本月',
        value: () => {
            const start = dayjs().startOf('month').toDate()
            const end = dayjs().endOf('month').toDate()
            return [start, end]
        }
    },
    {
        text: '上月',
        value: () => {
            const start = dayjs().subtract(1, 'month').startOf('month').toDate()
            const end = dayjs().subtract(1, 'month').endOf('month').toDate()
            return [start, end]
        }
    },
    {
        text: '最近3个月',
        value: () => {
            const end = new Date()
            const start = dayjs().subtract(2, 'month').startOf('month').toDate()
            return [start, end]
        }
    },
    {
        text: '今年至今',
        value: () => {
            const start = dayjs().startOf('year').toDate()
            const end = new Date()
            return [start, end]
        }
    },
    {
        text: '最近6个月',
        value: () => {
            const end = new Date()
            const start = dayjs().subtract(5, 'month').startOf('month').toDate()
            return [start, end]
        }
    },
    {
        text: '最近12个月',
        value: () => {
            const end = new Date()
            const start = dayjs().subtract(11, 'month').startOf('month').toDate()
            return [start, end]
        }
    },
    {
        text: '去年',
        value: () => {
            const start = dayjs().subtract(1, 'year').startOf('year').toDate()
            const end = dayjs().subtract(1, 'year').endOf('year').toDate()
            return [start, end]
        }
    }
]

// 年份范围快捷选项
export const yearShortcuts = [
    {
        text: '今年',
        value: () => {
            const year = new Date().getFullYear()
            return [new Date(year, 0, 1), new Date(year, 11, 31)]
        }
    },
    {
        text: '去年',
        value: () => {
            const year = new Date().getFullYear() - 1
            return [new Date(year, 0, 1), new Date(year, 11, 31)]
        }
    },
    {
        text: '近3年',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setFullYear(start.getFullYear() - 2)
            start.setMonth(0, 1)
            return [start, end]
        }
    },
    {
        text: '近5年',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setFullYear(start.getFullYear() - 4)
            start.setMonth(0, 1)
            return [start, end]
        }
    }
]

// 获取默认日期范围（最近30天）
export const getDefaultDateRange = () => {
    const end = new Date()
    const start = new Date()
    start.setTime(start.getTime() - 30 * 24 * 3600 * 1000)
    return [dayjs(start).format('YYYY-MM-DD'), dayjs(end).format('YYYY-MM-DD')]
}

// 获取默认月份范围（当月）
export const getDefaultMonthRange = () => {
    const currentMonth = dayjs().format('YYYY-MM')
    return [currentMonth, currentMonth]
}

// 获取默认年份范围（今年）
export const getDefaultYearRange = () => {
    const currentYear = dayjs().format('YYYY')
    return [currentYear, currentYear]
}