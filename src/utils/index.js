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