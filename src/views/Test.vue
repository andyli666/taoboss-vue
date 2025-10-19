<template>
    <div style="display:flex;">
        <div style="width:800px;">
            <vue-hot-image v-model="data" :url="url" @select="handleSelect" />
        </div>
        <div style="width:100px;">
            1
        </div>
    </div>

</template>
<script setup>
import { ref } from 'vue'
import VueHotImage from 'vue-hot-image'

const url = ref('https://img2.baidu.com/it/u=1595246485,3592807511&fm=253&app=138&f=JPEG?w=536&h=500')
const max = ref(15)
// const data = ref([])
const data = ref([
    {
        x: 100, y: 100, width: 100, height: 100
    }
])

const handleSelect = (index) => {
    console.log(index)
    console.log(data.value)
}
</script>