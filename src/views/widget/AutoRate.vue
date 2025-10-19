<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>小工具 </el-breadcrumb-item>
        <el-breadcrumb-item>自动评价</el-breadcrumb-item>
    </el-breadcrumb>
    <div style="margin:20px 0">
        <el-alert title="" type="info" show-icon>
            <div>当买家主动评价后，自动给予买家好评并回复评价内容；当买家未主动评价时，也可开启定时评价。</div>
            <div>该功能为官方功能，软件仅为您提供操作入口引导，遇到实际设置问题可以咨询淘宝客服哦</div>
        </el-alert>
    </div>
    <div style="margin:20px 0">
        如何设置：<el-link href="https://myseller.taobao.com/home.htm/smartapp-auto" target="_blank"
            type="primary">点此直达设置页面</el-link>
        ，选择“自动回评（仅淘宝店铺）”，点击“立即使用”
    </div>
    <div style="margin:20px 0">
        <el-image src="https://img.alicdn.com/imgextra/i2/2218998426113/O1CN01YzCgQj1v1oFPDLr98_!!2218998426113.jpg"
            style="width:1000px" />
    </div>
    <div style="margin:10px 0">
        <el-image src="https://img.alicdn.com/imgextra/i3/2218998426113/O1CN01Bq5OtE1v1oFQQLce6_!!2218998426113.jpg"
            style="width:1000px" />
    </div>
</template>