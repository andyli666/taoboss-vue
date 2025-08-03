import { ref, watchEffect, toValue } from 'vue'

//分页时自动累加的表格索引
export function useIndexMethod(index, currentPage, pageSize) {
    const newIndex = ref(null)

    const indexMethod = () => {
        newIndex.value = (toValue(index) + 1) + (toValue(currentPage) - 1) * toValue(pageSize)
    }

    watchEffect(() => {
        indexMethod()
    })

    return { newIndex }
}