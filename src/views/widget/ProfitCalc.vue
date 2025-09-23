<template>
  <el-breadcrumb>
    <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item>小工具 </el-breadcrumb-item>
    <el-breadcrumb-item>利润计算器</el-breadcrumb-item>
  </el-breadcrumb>
  <el-row>
    <el-col :span="6"></el-col>
    <el-col :span="10">
      <el-form ref="formRef" :model="form" label-width="auto" style="margin:40px 0 0 0;max-width: 500px">
        <el-form-item label="品名" prop="name">
          <el-input v-model="form.name" placeholder="保存计算记录时有用" />
        </el-form-item>
        <el-form-item label="拿货价" prop="costPrice">
          <el-input-number v-model="form.costPrice" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="快递费" prop="deliveryFee">
          <el-input-number v-model="form.deliveryFee" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="订单处理费" prop="orderProcessingFee">
          <el-input-number v-model="form.orderProcessingFee" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="包装物料费" prop="packagingMaterialFee">
          <el-input-number v-model="form.packagingMaterialFee" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="防护包装费" prop="protectivePackagingFee">
          <el-input-number v-model="form.protectivePackagingFee" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="消费者体验提升计划服务费" prop="consumerExperienceEnhancementProgramServiceFee">
          <el-input-number v-model="form.consumerExperienceEnhancementProgramServiceFee" :precision="2" :step="1" />
        </el-form-item>
        <!-- <el-form-item label="淘金币软件服务费率(%)" prop="taojinCoinSoftwareServiceFeeRatio">
          <el-input-number v-model="form.taojinCoinSoftwareServiceFeeRatio" :precision="2" :step="1" />
        </el-form-item> -->
        <el-form-item label="基础软件服务费率(%)" prop="basicSoftwareServiceFeeRatio">
          <el-input-number v-model="form.basicSoftwareServiceFeeRatio" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="先用后付技术服务费率(%)" prop="payAfterUseTechnicalServiceFeeRatio">
          <el-input-number v-model="form.payAfterUseTechnicalServiceFeeRatio" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="淘特营销推广服务费率(%)" prop="taoteMarketingServiceFeeRatio">
          <el-input-number v-model="form.taoteMarketingServiceFeeRatio" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="淘宝客佣金费率(%)" prop="tbkCommissionRatio">
          <el-input-number v-model="form.tbkCommissionRatio" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="聚划算佣金费率(%)" prop="jhsCommissionRatio">
          <el-input-number v-model="form.jhsCommissionRatio" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="售价" prop="price">
          <el-input-number v-model="form.price" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="利润" prop="profit">
          <el-input-number v-model="form.profit" :precision="2" disabled />
        </el-form-item>
        <el-form-item label="利润率(%)" prop="profitRate">
          <el-input-number v-model="form.profitRate" :precision="2" disabled />
        </el-form-item>
        <el-form-item label="盈亏平衡ROI" prop="roi">
          <el-input-number v-model="form.roi" :precision="2" disabled />
        </el-form-item>
        <el-form-item label="保存计算记录" prop="autoSave">
          <el-switch v-model="form.autoSave" />
        </el-form-item>
        <el-form-item label=" ">
          <el-button type="primary" @click="onSubmit">计算</el-button>
          <el-button @click="resetForm(formRef)">重置</el-button>
        </el-form-item>
      </el-form>
    </el-col>
    <el-col :span="8"></el-col>
  </el-row>

  <el-form :inline="true" :model="formSearch" @submit.prevent style="margin:40px 0 0 0;max-width:1050px">
    <el-form-item label="品名">
      <el-input v-model="formSearch.itemName" clearable @keyup.enter="getDetails" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="getDetails" plain>查询</el-button>
    </el-form-item>
  </el-form>
  <el-table :data="tableData" row-key="id" highlight-current-row>
    <el-table-column property="name" label="品名" width="180" />
    <el-table-column property="cost_price" label="拿货价" />
    <el-table-column property="delivery_fee" label="快递费" />
    <el-table-column property="order_processing_fee" label="订单处理费" />
    <el-table-column property="packaging_material_fee" label="包装物料费" />
    <el-table-column property="protective_packaging_fee" label="防护包装费" />
    <el-table-column property="consumer_experience_enhancement_program_service_fee" label="消费者体验提升计划服务费" />
    <el-table-column property="basic_software_service_fee_ratio" label="基础软件服务费率(%)" />
    <el-table-column property="pay_after_use_technical_service_fee_ratio" label="先用后付技术服务费率(%)" />
    <el-table-column property="taote_marketing_service_fee_ratio" label="淘特营销推广服务费率(%)" />
    <el-table-column property="tbk_commission_ratio" label="淘宝客佣金费率(%)" />
    <el-table-column property="jhs_commission_ratio" label="聚划算佣金费率(%)" />
    <el-table-column property="price" label="售价" />
    <el-table-column property="profit" label="利润" />
    <el-table-column property="profit_rate" label="利润率(%)" />
    <el-table-column property="roi" label="盈亏平衡ROI" />
    <el-table-column label="操作" width="60">
      <template #default="scope">
        <el-popconfirm width="160" title="确定删除此行吗？" placement="right" @confirm="handleDelete(scope.$index, scope.row)">
          <template #reference>
            <el-button size="small" type="danger">删除</el-button>
          </template>
        </el-popconfirm>
      </template>
    </el-table-column>
  </el-table>
  <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange" :current-page="currentPage"
    v-model:page-size="pageSize" :page-sizes="[10, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
    :total="total">
  </el-pagination>
</template>
<script setup>
import { reactive, ref, onMounted, useTemplateRef, computed } from 'vue'
import request from '@/utils/request'

const form = reactive({
  name: '',
  costPrice: 0,
  deliveryFee: 0,
  orderProcessingFee: 0,
  packagingMaterialFee: 0,
  protectivePackagingFee: 0,
  consumerExperienceEnhancementProgramServiceFee: 0,
  // taojinCoinSoftwareServiceFeeRatio: 0,
  basicSoftwareServiceFeeRatio: 0.6,
  payAfterUseTechnicalServiceFeeRatio: 0.4,
  taoteMarketingServiceFeeRatio: 0,
  tbkCommissionRatio: 0,
  jhsCommissionRatio: 0,
  price: 0,
  profit: 0,
  profitRate: 0,
  roi: 0,
  autoSave: true
})
const formRef = useTemplateRef('formRef')
const onSubmit = () => {
  form.profit = form.price - form.costPrice - form.deliveryFee - form.orderProcessingFee - form.packagingMaterialFee - form.protectivePackagingFee - form.consumerExperienceEnhancementProgramServiceFee - form.price * form.basicSoftwareServiceFeeRatio / 100 - form.price * form.payAfterUseTechnicalServiceFeeRatio / 100 - form.price * form.taoteMarketingServiceFeeRatio / 100 - form.price * form.tbkCommissionRatio / 100 - form.price * form.jhsCommissionRatio / 100
  if (form.price != 0) {
    form.profitRate = form.profit * 100 / form.price
  }
  if (form.profitRate != 0) {
    form.roi = 100 / form.profitRate
  }
  if (form.autoSave && form.profit != 0) {
    saveDetail()
  }
}
const resetForm = (formEl) => {
  if (!formEl) return
  formEl.resetFields()
}

// 保存计算记录
const saveDetail = () => {
  request.post('/api/widget/save-profit-calc-detail', form).then(response => {
    if (response.data.status == 1) {
      ElMessage.success('保存成功')
      getDetails()
    } else {
      ElMessage.error(response.data.msg)
    }
  }).catch((error) => {
    ElMessage.error(error)
  })
}

// 显示计算记录
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)// 每页显示的数据条数
const total = ref(0)// 总数据条数
// 查询条件
const formSearch = reactive({
  itemName: ''
})
// 获取计算记录
const getDetails = () => {
  request.post('/api/widget/get-profit-calc-details', {
    itemName: formSearch.itemName,
    page: currentPage.value,
    pageSize: pageSize.value
  }).then(response => {
    tableData.value = response.data.data.rows
    total.value = response.data.data.total
  }).catch((error) => {
    ElMessage.error(error)
  })
}
const handleCurrentChange = (val) => {
  currentPage.value = val
  getDetails()
}
const handleSizeChange = () => {
  getDetails()
}

// 删除行
const handleDelete = (index, row) => {
  request.post('/api/widget/delete-profit-calc-detail', {
    id: row.id
  }).then(response => {
    if (response.data.status) {
      ElMessage.success('删除成功')
      getDetails()
    } else {
      ElMessage.error(response.data.msg)
    }
  }).catch((error) => {
    ElMessage.error(error)
  })
}

onMounted(() => {
  getDetails()
})
</script>
<style scoped>
.el-pagination {
  margin-top: 16px;
}
</style>