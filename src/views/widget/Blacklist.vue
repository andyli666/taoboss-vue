<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>小工具 </el-breadcrumb-item>
        <el-breadcrumb-item>黑名单设置</el-breadcrumb-item>
    </el-breadcrumb>
    <div style="margin:20px 0">
        <el-alert title="" type="info" show-icon>
            <div>可以阻止恶意买家下单</div>
            <div>该功能为官方功能，软件仅为您提供操作入口引导，遇到实际设置问题可以咨询淘宝客服哦</div>
        </el-alert>
    </div>
    <div style="margin:20px 0">
        如何设置：<el-link href="https://ecrm.taobao.com/p/customer/ecrm_member_list.htm" target="_blank"
            type="primary">点此直达设置页面</el-link>
        ，在客户列表中找到需要添加的黑名单，点击添加分组，选择「禁止购买」即可。
    </div>
    <div style="margin:20px 0">
        <el-image src="https://img.alicdn.com/imgextra/i4/2218998426113/O1CN01gfrcmh1v1oF2AzxZB_!!2218998426113.jpg"
            style="width:1000px" />
    </div>
</template>