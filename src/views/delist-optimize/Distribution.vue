<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>上下架优化 </el-breadcrumb-item>
        <el-breadcrumb-item>当前上下架时间分布</el-breadcrumb-item>
    </el-breadcrumb>
    <el-row class="row-wrap">
        <el-col :span="24">
            <div id="delist" style="width:850px;height:400px;"></div>
        </el-col>
    </el-row>
    <el-row class="row-wrap">
        <el-col :span="24">
            <div id="delist-day" style="width:850px;height:400px;"></div>
        </el-col>
    </el-row>
</template>
<script setup>
import request from '@/utils/request'
import { onMounted } from 'vue'
// 引入 echarts 核心模块，核心模块提供了 echarts 使用必须要的接口。
import * as echarts from 'echarts/core'
// 引入柱状图图表，图表后缀都为 Chart
import { BarChart, PieChart } from 'echarts/charts'
// 引入标题，提示框，直角坐标系，数据集，内置数据转换器组件，组件后缀都为 Component
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    // DatasetComponent,
    // TransformComponent
} from 'echarts/components'
// 标签自动布局、全局过渡动画等特性
// import { LabelLayout, UniversalTransition } from 'echarts/features'
import { LabelLayout } from 'echarts/features'
// 引入 Canvas 渲染器，注意引入 CanvasRenderer 或者 SVGRenderer 是必须的一步
import { CanvasRenderer } from 'echarts/renderers'

// 注册必须的组件
echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    // DatasetComponent,
    // TransformComponent,
    BarChart,
    PieChart,
    LabelLayout,
    // UniversalTransition,
    CanvasRenderer
])

const initEchartDelist = () => {
    // 基于准备好的dom，初始化echarts实例
    const myChart = echarts.init(document.getElementById('delist'))
    myChart.showLoading()
    request.post('/api/item/get-delist-distribution').then(response => {
        // 
        myChart.hideLoading()
        // 绘制图表
        if (response.data.status == 0) {
            ElMessage.error(response.data.msg)
            return
        }
        // 绘制图表
        myChart.setOption({
            title: {
                text: '出售中商品一周自动上下架时间分布'
            },
            tooltip: {},
            xAxis: {
                data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
            },
            yAxis: {},
            series: [
                {
                    name: '商品个数',
                    type: 'bar',
                    // data: [5, 20, 36, 10, 10, 20, 50]
                    data: response.data.data
                }
            ]
        })
        // 
        initEchartDelistDay()
    }).catch((error) => {
        ElMessage.error(error)
    })
}

// 
const initEchartDelistDay = () => {
    // 基于准备好的dom，初始化echarts实例
    const myChart = echarts.init(document.getElementById('delist-day'))
    request.post('/api/item/get-delist-distribution-day').then(response => {
        // 绘制图表
        if (response.data.status == 0) {
            ElMessage.error(response.data.msg)
            return
        }
        // 绘制图表
        myChart.setOption({
            title: {
                text: '出售中商品24小时自动上下架时间分布'
            },
            tooltip: {},
            xAxis: {
                data: Array.from({ length: 24 }, (_, index) => index)
            },
            yAxis: {},
            series: [
                {
                    name: '商品个数',
                    type: 'bar',
                    data: response.data.data
                }
            ]
        })
    }).catch((error) => {
        ElMessage.error(error)
    })
}

onMounted(() => {
    initEchartDelist()
})

</script>
