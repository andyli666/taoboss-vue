<template>
    <el-radio-group v-model="radio">
        <el-table :data="tableData" @row-click="handleRowClick">
            <el-table-column property="cid" label="" width="55">
                <template #default="scope">
                    <el-radio :value="scope.row.cid"></el-radio>
                </template>
            </el-table-column>
            <el-table-column property="name" label="" />
            <!-- <el-table-column property="name" label="" width="650" /> -->
        </el-table>
    </el-radio-group>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const tableData = ref([])

const radio = ref()

const getShopCats = () => {
    // axios.post('/getShopCats', {
    axios.post('/api/getShopCats', {
        test: 1
    }).then(response => {
        tableData.value = response.data.rows
    }).catch(function (error) {
        console.log(error)
    })
}

const emit = defineEmits(['row-click'])
const handleRowClick = (row) => {
    console.log('handleRowClick', row)
    if (row === null) {
        return
    }
    radio.value = row.cid
    emit('row-click', row)
}

//
onMounted(() => getShopCats())
</script>
<style scoped></style>