<template>
    <el-radio-group v-model="radio">
        <el-table :data="tableData" @row-click="handleRowClick" row-key="id" default-expand-all
            class="hide-table-header">
            <el-table-column property="id" label="" width="100">
                <template #default="scope">
                    <el-radio :value="scope.row.id"></el-radio>
                </template>
            </el-table-column>
            <!-- <el-table-column property="text" label="" /> -->
            <el-table-column property="text" label="" width="650" />
        </el-table>
    </el-radio-group>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const tableData = ref([])

const radio = ref()

const getSellerCats = () => {
    axios.post('/api/Item/sellercatsListGet', { with_root: 0 }).then(response => {
        if (response.data.msg !== undefined) {
            ElMessage.error(`获取店铺分类出错：${response.data.msg}`)
        } else {
            tableData.value = response.data
        }
    }).catch((error) => {
        ElMessage.error(error)
    })
}

const emit = defineEmits(['row-click'])
const handleRowClick = (row) => {
    if (row === null) {
        return
    }
    radio.value = row.id
    emit('row-click', row)
}

const clearSelect = () => {
    radio.value = ''
}
defineExpose({
    clearSelect
})

//
onMounted(() => getSellerCats())
</script>
<style scoped>
:deep(.hide-table-header .el-table__header-wrapper) {
    display: none;
}
</style>