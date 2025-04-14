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