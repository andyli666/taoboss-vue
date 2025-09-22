<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>财务 </el-breadcrumb-item>
        <el-breadcrumb-item>利润分析</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="mt-40">
        <el-divider content-position="left" border-style="dashed">账务明细上传</el-divider>
        <el-upload ref="uploadAccountingDetail" class="upload" action="/api/finance-order-list/upload-accounting-detail"
            :headers="headers" :limit="1" :on-exceed="handleExceed" :on-success="handleSuccess"
            :on-error="handleUploadError" :auto-upload="false" accept=".xlsx,.xls">
            <template #trigger>
                <el-button type="primary" size="small">选择文件</el-button>
            </template>
            <el-button class="ml-1" type="success" @click="submitUpload" size="small">上传</el-button>
            <template #tip>
                <div class="el-upload__tip text-red">
                    请上传支付宝下载的最近几天的账务明细“账务组合查询”文件（下载后先解压），以确保数据的更新，支持.xls/.xlsx格式，最大10M
                    <el-popover title="文件具体下载路径" :width="800" trigger="hover">
                        <template #reference>
                            <el-icon>
                                <Warning />
                            </el-icon>
                        </template>
                        <el-image src="https://img.alicdn.com/imgextra/i4/2218998426113/O1CN01LUGPV01v1oEzAX0AG_!!2218998426113.jpg" />
                    </el-popover>
                </div>
            </template>
        </el-upload>
    </div>
    <el-dialog v-model="dialogProgressVisible" title="保存进度" width="800" :close-on-click-modal="false">
        <el-progress :text-inside="true" :stroke-width="26" :percentage="savePercentage" />
        <div class="publish-percent-tip">
            <div>{{ saveCompleteMsg }}</div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="dialogProgressVisible = false">确定</el-button>
            </div>
        </template>
    </el-dialog>
    <el-divider content-position="left" border-style="dashed" style="margin:40px 0;">订单列表</el-divider>
    <el-form :inline="true" :model="ruleForm" size="small" :rules="rules" ref="formRef" style="max-width: 1000px">
        <el-form-item label="订单创建时间" prop="date">
            <el-date-picker v-model="ruleForm.date" type="daterange" :shortcuts="shortcuts" range-separator="至"
                start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="订单状态">
            <el-select v-model="ruleForm.status">
                <el-option label="全部" value="0" />
                <el-option label="买家已付款" value="WAIT_SELLER_SEND_GOODS" />
                <el-option label="卖家已发货" value="WAIT_BUYER_CONFIRM_GOODS" />
                <el-option label="交易成功" value="TRADE_FINISHED" />
                <el-option label="交易关闭" value="TRADE_CLOSED" />
            </el-select>
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="submitForm(formRef)">查询</el-button>
            <el-button @click="resetForm(formRef)">重置</el-button>
        </el-form-item>
    </el-form>
    <div><el-text size="small" class="fixed-label">固定左侧两列：</el-text><el-switch v-model="fixed" /></div>
    <el-table :data="tableData" size="small" max-height="1000" show-summary sum-text="本页合计" highlight-current-row>
        <!-- <el-table-column type="index" width="55" label="序号" /> -->
        <!-- <el-table-column type="expand">
            <template #default="props">
                <div>
                    <h3>子订单</h3>
                    <el-table :data="props.row.orders">
                        <el-table-column label="订单编号" prop="oid" />
                        <el-table-column property="pic_path" label="商品" width="350">
                            <template #default="scope">
                                <el-row>
                                    <el-col :span="4">
                                        <el-image :src="scope.row.pic_path" style="width:50px">
                                            <template #error>&nbsp;</template>
                                        </el-image>
                                    </el-col>
                                    <el-col :span="20">
                                        <span>
                                            [{{ scope.row.num_iid }}]
                                            <a :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank"
                                                class="link">
                                                {{ scope.row.title }}
                                            </a>
                                        </span>
                                    </el-col>
                                </el-row>
                            </template>
                        </el-table-column>
                        <el-table-column label="数量" prop="num" />
                        <el-table-column label="应付金额" prop="total_fee" />
                        <el-table-column label="实付金额" prop="payment" />
                        <el-table-column label="SKU" prop="sku_properties_name" />
                        <el-table-column label="订单状态" prop="status" />
                    </el-table>
                </div>
            </template>
        </el-table-column> -->
        <el-table-column property="tid" label="订单编号" :fixed="fixed" width="150" />
        <el-table-column property="payment" label="买家实付金额" :fixed="fixed" width="100" />
        <el-table-column property="seller_nick" label="卖家昵称" width="100" />
        <el-table-column property="status_text" label="订单状态" width="130" />
        <el-table-column property="pay_time" label="付款时间" width="150" />
        <el-table-column property="received_payment" label="确认收货打款金额" width="115" />
        <el-table-column property="consign_time" label="发货时间" width="150" />
        <el-table-column property="receiver_state" label="收件省" />
        <el-table-column property="goods_cost" label="货品成本" />
        <el-table-column property="consumer_experience_enhancement_program_service_fee" label="消费者体验提升计划服务费" />
        <el-table-column property="taojin_coin_software_service_fee" label="淘金币软件服务费" />
        <el-table-column property="cross_border_service_basic_fee" label="淘宝天猫跨境服务基础费" />
        <el-table-column property="cross_border_service_value_added_fee" label="淘宝天猫跨境服务增值费" />
        <el-table-column property="basic_software_service_fee" label="基础软件服务费" />
        <el-table-column property="marketing_hosting_software_service_fee" label="品牌新享-淘宝营销托管软件服务费" />
        <el-table-column property="pay_after_use_technical_service_fee" label="先用后付技术服务费" />
        <el-table-column property="taote_marketing_service_fee" label="淘特营销推广服务费" />
        <el-table-column property="tbk_commission" label="淘宝客佣金" />
        <el-table-column property="taobao_alliance_commission" label="淘宝联盟佣金" />
        <el-table-column property="jhs_commission" label="聚划算佣金" />
        <el-table-column property="order_processing_fee" label="订单处理费" />
        <el-table-column property="forward_delivery_fee" label="正向配送费" />
        <el-table-column property="packaging_material_fee" label="包装物料费" />
        <el-table-column property="protective_packaging_fee" label="多品防护包装费" />
        <el-table-column property="profit" label="利润" />
    </el-table>
    <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange" :current-page="currentPage"
        v-model:page-size="pageSize" :page-sizes="[10, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
        :total="total" size="small">
    </el-pagination>
</template>
<script setup>
import { ref, useTemplateRef, onMounted, reactive, computed } from 'vue'
import { genFileId } from 'element-plus'
import request from '@/utils/request'
import { getItemWirelessUrl } from '@/utils/index'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { Warning } from '@element-plus/icons-vue'

//订单列表上传
const uploadAccountingDetailRef = useTemplateRef('uploadAccountingDetail')
const token = localStorage.getItem('token')
const headers = computed(() => {
    return {
        Authorization: `Bearer ${token}`
    }
})
const handleExceed = (files) => {
    uploadAccountingDetailRef.value.clearFiles()
    const file = files[0]
    file.uid = genFileId()
    uploadAccountingDetailRef.value.handleStart(file)
}
const submitUpload = () => {
    uploadAccountingDetailRef.value.submit()
}
const handleSuccess = (response, uploadFile, uploadFiles) => {
    if (response.status) {
        ElMessage.success('上传成功，正在保存数据，请稍等')
        saveAccountingDetail(response.fileName)
    } else {
        uploadFiles.pop()
        ElMessage.error(response.msg)
    }
}
const handleUploadError = (error) => {
    console.log('handleUploadError', error)
    ElMessage.error(error)
}
const dialogProgressVisible = ref(false)
const savePercentage = ref(0)
const saveCompleteMsg = ref('')
const saveAccountingDetail = (fileName) => {
    dialogProgressVisible.value = true
    const url = '/api/finance-order-list/save-accounting-detail/' + encodeURIComponent(fileName)
    // 创建EventSource连接
    // const eventSource = new EventSource(url)
    const eventSource = new EventSourcePolyfill(url, {
        headers: {
            'Authorization': `Bearer ${token}`,//设置token
        },
        withCredentials: true  // 携带跨域凭据
    })
    // 监听进度更新
    eventSource.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data)
        savePercentage.value = data.progress
    })
    // 监听完成事件
    eventSource.addEventListener('complete', (e) => {
        const data = JSON.parse(e.data)
        saveCompleteMsg.value = data.message
        eventSource.close() // 关闭连接
    })

    // 错误处理
    eventSource.onerror = (e) => {
        console.error('EventSource错误:', e)
        eventSource.close()
        setTimeout(() => {
            new EventSource(url)
        }, 3000)
    }
}
//订单列表
const formRef = useTemplateRef('formRef')
const ruleForm = reactive({
    date: [],
    status: 'TRADE_FINISHED'
})
// 自定义验证规则函数 for 结束日期
const validateEndDate = (rule, value, callback) => {
    // 如果结束日期为空，触发 required 规则，这里不管
    if (!value) {
        callback(new Error('请选择结束日期'))
        return
    }

    // 如果开始日期为空，无法比较，也先不处理（开始日期的required规则会捕获）
    if (!ruleForm.startDateTime) {
        callback()
        return
    }

    // 比较日期字符串（因为设置了 value-format）
    if (new Date(value) < new Date(ruleForm.startDateTime)) {
        callback(new Error('结束日期不能早于开始日期'))
    } else {
        callback() // 验证通过
    }
}

const rules = reactive({
    date: [
        { type: 'array', required: true, message: '请选择日期', trigger: 'change' }
    ]
})

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(50)
const total = ref(0)
const submitForm = async (formEl) => {
    if (!formEl) return
    await formEl.validate((valid) => {
        if (valid) {
            request.post('/api/finance-order-list/order-list', {
                date: ruleForm.date,
                status: ruleForm.status,
                page: currentPage.value,
                pageSize: pageSize.value
            }).then(response => {
                if (response.data.status) {
                    tableData.value = response.data.data.trades
                    total.value = parseInt(response.data.data.total_results)
                } else {
                    ElMessage.error(response.data.msg)
                }
            }).catch((error) => {
                ElMessage.error(error)
            })
        }
    })


}
// 重置表单
const resetForm = (formEl) => {
    if (!formEl) return
    formEl.resetFields()
    // 重新设置默认值
    ruleForm.date = getCurrentMonthRange()

}
const handleCurrentChange = (val) => {
    currentPage.value = val
    submitForm(formRef.value)
}
const handleSizeChange = () => {
    submitForm(formRef.value)
}
const shortcuts = [
    {
        text: '今天',
        value: () => {
            const end = new Date()
            const start = new Date()
            return [start, end]
        },
    },
    {
        text: '昨天',
        value: () => {
            const end = new Date()
            const start = new Date()
            end.setDate(start.getDate() - 1)
            start.setDate(start.getDate() - 1)
            return [start, end]
        },
    },
    {
        text: '过去1周',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - 7)
            return [start, end]
        },
    },
    {
        text: '过去1月',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setMonth(start.getMonth() - 1)
            return [start, end]
        },
    },
    {
        text: '过去3月',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setMonth(start.getMonth() - 3)
            return [start, end]
        },
    },
]

// 获取本月1号和今天的日期
const getCurrentMonthRange = () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

    const formatDate = (date) => {
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    return [formatDate(firstDay), formatDate(today)]
}

//固定表格列
const fixed = ref(false)

//
onMounted(() => {
    ruleForm.date = getCurrentMonthRange()

    // request.get('/api/finance-sync-order-list').then(response => {
    //     if (response.data.status) {
    //         ElMessage.success('订单数据后台同步中')
    //     } else {
    //         ElMessage.error(response.data.msg)
    //     }
    // }).catch((error) => {
    //     ElMessage.error(error)
    // })
})
</script>
<style>
.text-red {
    --un-text-opacity: 1;
    color: #f87171;
}

.upload {
    margin-top: 18px;
}

.publish-percent-tip {
    margin-top: 10px;
    line-height: 2em;
}

.el-pagination {
    margin-top: 16px;
}

/* 去除超链接的下划线和默认的蓝色 */
.link {
    text-decoration: none;
    color: inherit;
}

.el-select {
    --el-select-width: 100px;
}

.fixed-label {
    margin: 15px 0 0 11px;
    display: inline-block;
}
</style>