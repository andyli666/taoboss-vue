<template>
    <el-skeleton :rows="5" :loading="loading" animated>
    </el-skeleton>
    <el-row class="row-wrap">
        <el-col :span="20">
            <el-row style="align-items: center;">
                <el-col :span="2">
                    <el-avatar :size="50" :src="user.picPath" />
                </el-col>
                <el-col :span="22">
                    <div>你好 [{{ user.title }}] 祝今日大卖，财源滚滚</div>
                </el-col>
            </el-row>
        </el-col>
        <el-col :span="4">
            <el-row><el-col :span="12">版本</el-col><el-col :span="12">到期时间</el-col></el-row>
            <el-row>
                <el-col :span="12">{{ user.articleItemName }}</el-col>
                <el-col :span="12">{{ user.subscribeDeadline.substr(0, 10) }}</el-col>
            </el-row>
        </el-col>
    </el-row>
    <el-row>
        <el-col :span="18">
            <el-row class="row-wrap">
                <el-space wrap :size="3" alignment="flex-start">
                    <el-card style="width: 300px" shadow="never">
                        <template #header>
                            <div>
                                <el-avatar :icon="Tickets" />
                                关联推荐
                            </div>
                        </template>
                        <div class="desc">
                            可发布自定义海报或者系统模板生成的关联推荐到商品详情中
                        </div>
                    </el-card>
                    <el-card style="width: 300px" shadow="never">
                        <template #header>
                            <div>
                                <el-avatar :icon="SetUp" />
                                上下架时间优化
                            </div>
                        </template>
                        <div class="desc">
                            将商品自动上下架时间修改到流量高峰时段
                        </div>
                    </el-card>
                    <el-card style="width: 300px" shadow="never">
                        <template #header>
                            <div>
                                <el-avatar :icon="Clock" />
                                定时修改库存
                            </div>
                        </template>
                        <div class="desc">
                            对商品或者sku库存进行定时修改
                        </div>
                    </el-card>
                </el-space>
            </el-row>
            <el-row class="row-wrap">
                <el-col :span="24">
                    <div id="item" style="width:800px;height:400px;"></div>
                </el-col>
            </el-row>
        </el-col>
        <el-col :span="6">
            <!-- <el-row class="row-wrap">
                <el-card style="width: 100%" shadow="never">
                    <template #header>
                        <div>快捷入口</div>
                    </template>
                    <div class="quick-access">
                        <ul>
                            <li><el-link href="/recommend/list" type="primary">关联推荐活动列表</el-link></li>
                            <li><el-link href="/delist-optimize/list" type="primary">上下架时间优化任务列表</el-link></li>
                            <li>
                                <el-link href="/item-timing-update-quantity/list" type="primary">定时修改库存任务列表</el-link>
                            </li>
                        </ul>
                    </div>
                </el-card>
            </el-row> -->
            <el-row class="row-wrap" style="border:0;padding:0 0 0 10px;">
                <el-card style="width: 100%" shadow="never">
                    <template #header>
                        <div>通知公告</div>
                    </template>
                    <div class="notice">暂无</div>
                </el-card>
            </el-row>
        </el-col>
    </el-row>
</template>
<script setup>
import request from '@/utils/request'
import { onMounted, reactive, ref } from 'vue'
import { Tickets, Clock, SetUp } from '@element-plus/icons-vue'
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

//
const loading = ref(true)

// 用户信息
const user = reactive({
    articleItemName: '',
    picPath: '',
    sellerNick: '',
    subscribeDeadline: '',
    title: ''
})
const getUser = () => {
    const userInfo = JSON.parse(localStorage.getItem('user'))
    user.articleItemName = userInfo.article_item_name
    user.picPath = userInfo.pic_path
    user.sellerNick = userInfo.seller_nick
    user.subscribeDeadline = userInfo.subscribe_deadline
    user.title = userInfo.title
}

//
const initEchartItem = () => {
    // 基于准备好的dom，初始化echarts实例
    const myChart = echarts.init(document.getElementById('item'))
    request.post('/api/item/get-item-status').then(response => {
        // 绘制图表
        if (response.data.status == 0) {
            ElMessage.error(response.data.msg)
            return
        }
        myChart.setOption({
            title: {
                text: '商品在架状态'
            },
            tooltip: {},
            series: [
                {
                    name: '商品个数',
                    type: 'pie',
                    // data: [
                    //     {
                    //         value: 335,
                    //         name: '出售中'
                    //     },
                    //     {
                    //         value: 234,
                    //         name: '仓库中'
                    //     }
                    // ]
                    data: response.data.data
                }
            ]
        })
    }).catch((error) => {
        ElMessage.error(error)
    })
}

onMounted(() => {
    loading.value = false
    getUser()
    initEchartItem()
})

</script>

<style scoped>
.row-wrap {
    border-radius: 4px;
    border: 1px solid #e4e7ed;
    padding: 15px;
    margin-bottom: 5px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
}

.desc {
    color: #777;
}

.quick-access ul {
    padding-inline-start: 15px;
    margin-block-start: 0;
    margin-block-end: 0;

    li {
        line-height: 2em;
    }
}

.notice {
    color: #777;
}
</style>