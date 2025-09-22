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