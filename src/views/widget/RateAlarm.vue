<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>小工具 </el-breadcrumb-item>
        <el-breadcrumb-item>中差评提醒</el-breadcrumb-item>
    </el-breadcrumb>
    <div style="margin:20px 0">
        <el-alert title="" type="info" show-icon>
            <div>当订单评价为中差评时，自动发送预警通知给商家。</div>
            <div>该功能为官方功能，软件仅为您提供操作入口引导，遇到实际设置问题可以咨询淘宝客服哦</div>
        </el-alert>
    </div>
    <div style="margin:20px 0">
        如何设置：<el-link href="https://myseller.taobao.com/home.htm/smartapp-auto" target="_blank"
            type="primary">点此直达设置页面</el-link>
        ，选择“中差评提醒（仅淘宝店铺）”，点击“立即使用”
    </div>
    <div style="margin:20px 0">
        <el-image src="https://img.alicdn.com/imgextra/i3/2218998426113/O1CN01PDjAGS1v1oFQQMtdO_!!2218998426113.jpg"
            style="width:1000px" />
    </div>
    <div style="margin:10px 0">
        <el-image src="https://img.alicdn.com/imgextra/i1/2218998426113/O1CN01UMCRjJ1v1oFPPPbYj_!!2218998426113.jpg"
            style="width:1000px" />
    </div>
</template>