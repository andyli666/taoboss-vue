<template>
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
    <el-row :gutter="10">
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
                    <div id="item" style="width:850px;height:400px;"></div>
                </el-col>
            </el-row>
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
        </el-col>
        <el-col :span="6">
            <el-row class="row-wrap">
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
            </el-row>
            <el-row class="row-wrap">
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
import { onMounted, reactive } from 'vue'
import { Tickets, Clock, SetUp } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

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
const initEchartDelist = () => {
    // 基于准备好的dom，初始化echarts实例
    const myChart = echarts.init(document.getElementById('delist'))
    request.post('/api/item/get-delist-distribution').then(response => {
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
    getUser()
    initEchartItem()
    initEchartDelist()
})

</script>

<style scoped>
.row-wrap {
    border-radius: 4px;
    border: 1px solid #ccc;
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