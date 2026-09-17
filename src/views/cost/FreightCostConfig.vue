<template>
    <div class="freight-cost-config">
        <!-- 页面标题 -->
        <div class="page-header">
            <div>
                <h2>运费成本配置</h2>
                <p class="page-desc">配置运费计算方式和价格规则</p>
            </div>
            <div class="header-actions">
                <el-button type="primary" @click="showExpressImport = true">
                    <el-icon>
                        <Upload />
                    </el-icon>
                    导入快递对账单
                </el-button>
            </div>
        </div>

        <!-- 🔥 运费方式说明卡片 -->
        <el-card class="intro-card">
            <template #header>
                <span>运费方式说明</span>
            </template>
            <el-row :gutter="20">
                <el-col :span="8">
                    <div class="intro-item">
                        <div class="intro-icon">📦</div>
                        <div class="intro-title">方式一：菜鸟云仓自动导入</div>
                        <div class="intro-desc">导入支付宝流水时自动识别并提取每笔订单的运费</div>
                        <div class="intro-tip">✅ 适用：菜鸟云仓发货的商家，实际扣款，数据最准确</div>
                    </div>
                </el-col>
                <el-col :span="8">
                    <div class="intro-item">
                        <div class="intro-icon">📋</div>
                        <div class="intro-title">方式二：快递对账单导入</div>
                        <div class="intro-desc">从快递公司获取对账单，导入系统自动匹配订单运费</div>
                        <div class="intro-tip">📌 适用：非菜鸟云仓 + 有对账单</div>
                    </div>
                </el-col>
                <el-col :span="8">
                    <div class="intro-item">
                        <div class="intro-icon">⚙️</div>
                        <div class="intro-title">方式三：按单计费规则</div>
                        <div class="intro-desc">设置规则后订单发货时系统自动计算运费</div>
                        <div class="intro-tip">📌 适用：非菜鸟云仓 + 无对账单</div>
                    </div>
                </el-col>
            </el-row>
        </el-card>

        <!-- 运费优先级说明 -->
        <el-card class="priority-card" style="margin: 20px 0">
            <el-alert title="运费优先级说明" type="info" :closable="false" show-icon>
                <template #default>
                    <div style="margin: 8px 0 0 4px; padding: 0; line-height: 2;">
                        <div><span style="font-weight: 600;">1️⃣ 支付宝流水中的运费</span>（使用菜鸟云仓的商家）← 实际扣款，最准确</div>
                        <div style="padding-left: 24px; color: #909399;">↓ 没有则取</div>
                        <div><span style="font-weight: 600;">2️⃣ 快递对账单导入</span></div>
                        <div style="padding-left: 24px; color: #909399;">↓ 没有则取</div>
                        <div><span style="font-weight: 600;">3️⃣ 按单计费规则</span>（系统自动计算）</div>
                        <div style="padding-left: 24px; color: #909399;">↓ 没有则</div>
                        <div><span style="font-weight: 600;">4️⃣ 运费为 0</span>（需手动补充）</div>
                    </div>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #d6e8ff;">
                        <el-button type="primary" link size="small" @click="goToHelp">
                            📖 了解更多运费成本设置说明 →
                        </el-button>
                    </div>
                </template>
            </el-alert>
        </el-card>

        <!-- 基础配置 -->
        <el-card class="config-card">
            <template #header>
                <span>基础配置</span>
            </template>

            <el-form :model="configForm" label-width="140px">
                <!-- 按单计费开关 -->
                <el-form-item label="按单计费" required>
                    <div class="switch-wrapper">
                        <div class="switch-row">
                            <el-switch v-model="configForm.enable_by_order" active-text="启用" inactive-text="禁用"
                                @change="onEnableChange" />
                            <el-tag v-if="hasUnsavedChange" type="warning" size="small" effect="dark">
                                未保存，请点击"保存配置"按钮使设置生效
                            </el-tag>
                        </div>
                        <div class="form-tip">启用后系统将根据订单实际使用的快递公司和下方价格规则自动匹配运费</div>
                    </div>
                </el-form-item>

                <!-- 仅在启用时显示 -->
                <template v-if="configForm.enable_by_order">
                    <!-- <el-form-item label="运费计算方式" required>
                        <el-radio-group v-model="configForm.calc_method">
                            <el-radio :label="1">按单计费</el-radio>
                        </el-radio-group>
                        <div class="form-tip">当前仅支持按单计费，后续将支持更多方式</div>
                    </el-form-item> -->
                </template>

                <!-- 禁用时的提示 -->
                <div v-else class="disabled-tip">
                    <el-alert title="按单计费已禁用" type="info" description="禁用按单计费后，系统将不会自动计算运费，请通过导入快递对账单录入实际运费" show-icon
                        :closable="false" />
                </div>

                <el-form-item>
                    <el-button type="primary" @click="saveConfig">保存配置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 价格规则配置 - 只在启用按单计费时显示 -->
        <el-card class="price-card" style="margin-top: 20px">
            <template #header>
                <div class="card-header">
                    <span>价格规则配置</span>
                    <el-button type="primary" size="small" @click="openAddDialog"
                        :disabled="!configForm.enable_by_order">添加规则</el-button>
                </div>
            </template>

            <!-- 禁用时的提示 -->
            <div v-if="!configForm.enable_by_order" class="disabled-overlay">
                <el-alert title="按单计费已禁用" type="info" :closable="false" show-icon>
                    <template #default>
                        如需添加或修改价格规则，请先启用按单计费
                    </template>
                </el-alert>
            </div>

            <!-- 快递公司 Tab 切换 -->
            <el-tabs v-model="activeCompany" @tab-click="handleCompanyChange">
                <el-tab-pane v-for="company in logisticsCompanies" :key="company" :label="company" :name="company" />
                <!-- 没有数据时显示提示 -->
                <div v-if="logisticsCompanies.length === 0" class="empty-tip">
                    暂无价格规则，请点击"添加规则"添加
                </div>
            </el-tabs>

            <el-table v-if="currentCompanyRules.length > 0" :data="currentCompanyRules" border stripe
                v-loading="loading" style="width: 100%" row-key="id">
                <!-- 收货省份列 - 添加表头筛选 -->
                <el-table-column prop="receiver_province" label="收货省份" min-width="150" :filters="provinceFilters"
                    :filter-method="filterByProvince" filter-placement="bottom-end" />

                <el-table-column prop="price" label="运费(元)" min-width="100">
                    <template #default="{ row }">
                        ¥{{ row.price }}
                    </template>
                </el-table-column>

                <el-table-column prop="effective_date" label="生效日期" min-width="120" />

                <el-table-column prop="expire_date" label="失效日期" min-width="120">
                    <template #default="{ row }">
                        {{ row.expire_date || '长期有效' }}
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="100" fixed="right">
                    <template #default="{ row }">
                        <el-button type="danger" link @click="handleDelete(row)"
                            :disabled="!configForm.enable_by_order">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <!-- 无数据提示 -->
            <div v-else class="empty-tip">
                暂无 {{ activeCompany }} 的价格规则，请点击"添加规则"添加
            </div>
        </el-card>

        <!-- 添加规则弹窗 -->
        <el-dialog v-model="dialogVisible" title="添加价格规则" width="500px">
            <el-form :model="ruleForm" label-width="100px">
                <el-form-item label="快递公司" required>
                    <el-select v-model="ruleForm.logistics_company">
                        <el-option label="中通" value="中通" />
                        <el-option label="圆通" value="圆通" />
                        <el-option label="申通" value="申通" />
                        <el-option label="韵达" value="韵达" />
                        <el-option label="顺丰" value="顺丰" />
                        <el-option label="邮政" value="邮政" />
                        <el-option label="极兔" value="极兔" />
                    </el-select>
                </el-form-item>
                <el-form-item label="收货省份" required>
                    <el-select v-model="ruleForm.receiver_province" multiple filterable allow-create
                        placeholder="请选择或输入省份" collapse-tags collapse-tags-tooltip>
                        <el-option label="全国通用" value="全国通用" />
                        <el-option v-for="p in provinces" :key="p" :label="p" :value="p" />
                    </el-select>
                    <div class="form-tip">支持多选，选择"全国通用"时其他省份无效</div>
                </el-form-item>
                <el-form-item label="运费价格" required>
                    <el-input-number v-model="ruleForm.price" :precision="2" :min="0" :step="0.5" />
                    <span class="unit">元/单</span>
                </el-form-item>
                <el-form-item label="生效日期" required>
                    <el-date-picker v-model="ruleForm.effective_date" type="date" format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD" placeholder="选择生效日期" />
                </el-form-item>
                <el-form-item label="失效日期">
                    <el-date-picker v-model="ruleForm.expire_date" type="date" format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD" placeholder="留空表示长期有效" clearable />
                    <div class="form-tip">留空表示长期有效</div>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="saving" @click="savePriceRule">保存</el-button>
            </template>
        </el-dialog>
    </div>

    <!-- 导入快递对账单弹窗 -->
    <el-dialog v-model="showExpressImport" title="导入快递对账单" width="750px">
        <div class="import-content">
            <el-alert title="导入说明" type="info" :closable="false" show-icon>
                <template #default>
                    <ul>
                        <li>支持 .xlsx, .xls 格式</li>
                        <li>只需包含以下两列：<strong>运单号</strong>、<strong>运费</strong>，系统会根据运单号自动匹配订单</li>
                        <li>系统会自动识别列名，<strong>列顺序无影响</strong></li>
                        <li>支持的列名：</li>
                    </ul>
                    <div class="column-mapping">
                        <el-row :gutter="16">
                            <el-col :span="11">
                                <div class="mapping-item">
                                    <span class="mapping-label">运单号：</span>
                                    <span class="mapping-value">运单号、快递单号、物流单号</span>
                                </div>
                            </el-col>
                            <el-col :span="13">
                                <div class="mapping-item">
                                    <span class="mapping-label">运费：</span>
                                    <span class="mapping-value">运费、金额、费用、计费金额、计费金额合计(CNY)</span>
                                </div>
                            </el-col>
                        </el-row>
                    </div>
                    <ul style="margin-top: 12px">
                        <li>如需其他列名，请联系客服添加</li>
                        <!-- <li>
                            <a href="/api/freight/template/express" target="_blank" class="download-link">下载标准模板</a>
                        </li> -->
                    </ul>
                </template>
            </el-alert>

            <div class="upload-area">
                <el-upload ref="expressUploadRef" drag :http-request="customUploadExpress" :before-upload="beforeUpload"
                    accept=".xlsx,.xls">
                    <el-icon class="upload-icon">
                        <UploadFilled />
                    </el-icon>
                    <div class="upload-text">将文件拖到此处，或点击上传</div>
                    <div class="upload-hint">支持 .xlsx, .xls 格式</div>
                </el-upload>
            </div>
        </div>
        <template #footer>
            <el-button @click="showExpressImport = false">关闭</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { getFreightConfig, saveFreightConfig, getPriceRules, savePriceRule as apiSavePriceRule, deletePriceRule, importAlipay, importExpress } from '@/api/freight'
import dayjs from 'dayjs'
import { Upload, UploadFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)  // 🔥 添加保存状态，防止重复提交

const configForm = reactive({
    calc_method: 1,
    enable_by_order: true,  // 添加开关状态
})

// 原始数据
const allPriceRules = ref([])

// 已设置规则的快递公司列表（动态计算）
const logisticsCompanies = computed(() => {
    const companies = [...new Set(allPriceRules.value.map(item => item.logistics_company))]
    return companies.sort()  // 排序显示
})

// 当前激活的快递公司（默认选中第一个）
const activeCompany = ref('')

// 监听快递公司列表变化，自动选中第一个
watch(logisticsCompanies, (newCompanies) => {
    if (newCompanies.length > 0 && !activeCompany.value) {
        activeCompany.value = newCompanies[0]
    }
}, { immediate: true })

// 当前快递公司的规则
const currentCompanyRules = computed(() => {
    if (!activeCompany.value) return []
    return allPriceRules.value.filter(item => item.logistics_company === activeCompany.value)
})

// 省份筛选选项（动态从当前快递公司的数据中提取）
const provinceFilters = computed(() => {
    const rules = currentCompanyRules.value
    const provinces = [...new Set(rules.map(item => item.receiver_province))]
    return provinces.map(p => ({ text: p, value: p }))
})

// 筛选方法
const filterByProvince = (value, row) => {
    return row.receiver_province === value
}

// 切换快递公司时重置筛选（可选）
const handleCompanyChange = () => {
    // 可以在这里重置表格的筛选状态
    // 表格筛选会自动重置，因为数据源变了
}

const ruleForm = reactive({
    logistics_company: '中通',
    receiver_province: [],
    price: 0,
    effective_date: dayjs().format('YYYY-MM-DD'),
    expire_date: null
})

const provinces = [
    '北京市', '天津市', '上海市', '重庆市',
    '江苏省', '浙江省', '广东省', '福建省',
    '安徽省', '江西省', '山东省', '河南省',
    '湖北省', '湖南省', '广西壮族自治区', '海南省',
    '四川省', '贵州省', '云南省', '西藏自治区',
    '陕西省', '甘肃省', '青海省', '宁夏回族自治区',
    '新疆维吾尔自治区', '内蒙古自治区', '辽宁省',
    '吉林省', '黑龙江省', '河北省', '山西省'
]

const loadConfig = async () => {
    const res = await getFreightConfig()
    if (res.data.code === 200 && res.data.data) {
        configForm.calc_method = res.data.data.calc_method || 1
        configForm.enable_by_order = res.data.data.enable_by_order !== undefined ? !!res.data.data.enable_by_order : true
        originalConfig.value = { ...configForm }
        hasUnsavedChange.value = false
    }
}

// 监听配置变化
const originalConfig = ref({})
const hasUnsavedChange = ref(false)
const onEnableChange = () => {
    hasUnsavedChange.value = true
}

const loadPriceRules = async () => {
    loading.value = true
    try {
        const res = await getPriceRules()
        // 因为拦截器返回 response，所以真正的数据在 res.data.data
        if (res.data.code === 200) {
            allPriceRules.value = res.data.data || []
        }
    } finally {
        loading.value = false
    }
}

const saveConfig = async () => {
    // 保存前禁用按钮，防止重复提交
    const saving = ref(true)

    try {
        const res = await saveFreightConfig(configForm)
        if (res.data.code === 200) {
            ElMessage.success('保存成功')
            hasUnsavedChange.value = false
            originalConfig.value = { ...configForm }

            if (configForm.enable_by_order) {
                await loadPriceRules()
            }
        } else {
            // 根据错误码显示不同的提示
            if (res.data.code === 400) {
                ElMessage.warning(res.data.msg || '参数错误')
            } else if (res.data.code === 401) {
                ElMessage.error('请重新登录')
            } else {
                ElMessage.error(res.data.msg || '保存失败，请稍后重试')
            }

            // 重新加载配置，恢复正确的状态
            await loadConfig()
            hasUnsavedChange.value = false
        }
    } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

const openAddDialog = () => {
    if (!configForm.enable_by_order) {
        ElMessage.warning('请先启用按单计费')
        return
    }

    ruleForm.logistics_company = logisticsCompanies.value[0] || '中通'
    ruleForm.receiver_province = []
    ruleForm.price = 0
    ruleForm.effective_date = dayjs().format('YYYY-MM-DD')
    ruleForm.expire_date = null
    dialogVisible.value = true
}

const savePriceRule = async () => {
    // 🔥 防止重复提交
    if (saving.value) {
        return
    }
    if (!ruleForm.receiver_province || ruleForm.receiver_province.length === 0) {
        ElMessage.warning('请选择收货省份')
        return
    }
    if (ruleForm.price <= 0) {
        ElMessage.warning('请输入运费价格')
        return
    }
    saving.value = true
    try {
        // 如果包含"全国通用"，只保存"全国通用"
        let provincesToSave = [...ruleForm.receiver_province]
        if (provincesToSave.includes('全国通用')) {
            provincesToSave = ['全国通用']
        }

        // 遍历保存每个省份
        for (const province of provincesToSave) {
            const res = await apiSavePriceRule({
                ...ruleForm,
                receiver_province: province
            })
            if (res.data.code !== 200) {
                throw new Error(res.data.msg)
            }
        }

        ElMessage.success(`成功保存 ${provincesToSave.length} 条规则`)
        dialogVisible.value = false
        await loadPriceRules()

        // 自动切换到新添加的快递公司 tab
        activeCompany.value = ruleForm.logistics_company
    } catch (error) {
        ElMessage.error('保存失败：' + (error.message || '未知错误'))
    } finally {
        saving.value = false
    }

}

const handleDelete = async (row) => {
    if (!configForm.enable_by_order) {
        ElMessage.warning('请先启用按单计费')
        return
    }

    await ElMessageBox.confirm('确定删除该规则吗？', '提示', { type: 'warning' })
    const res = await deletePriceRule(row.id)
    if (res.data.code === 200) {
        ElMessage.success('删除成功')
        await loadPriceRules()  // 重新加载，快递公司列表会自动更新
        // 如果当前激活的快递公司没有规则了，自动切换到第一个
        if (currentCompanyRules.value.length === 0 && logisticsCompanies.value.length > 0) {
            activeCompany.value = logisticsCompanies.value[0]
        }
    }
}

// 添加规则成功后的回调
const handleAddRuleSuccess = () => {
    loadPriceRules()
    // 可选：切换到新添加的快递公司 tab
    // activeCompany.value = ruleForm.logistics_company
}

// 导入弹窗控制
const showAlipayImport = ref(false)
const showExpressImport = ref(false)

// 上传headers
const uploadHeaders = {
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
}

// 文件上传前校验
const beforeUpload = (file) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel'
    if (!isExcel) {
        ElMessage.error('只能上传Excel文件')
        return false
    }
    return true
}

const customUploadExpress = async (options) => {
    const formData = new FormData()
    formData.append('file', options.file)

    try {
        const res = await importExpress(formData)
        if (res.data.code === 200) {
            let message = res.data.msg
            const hasError = message.includes('失败') || message.includes('错误')

            // 将分号分隔的错误换行显示
            if (hasError) {
                message = message.replace(/；|;/g, '<br/>')
            }

            ElMessageBox.alert(message, '导入结果', {
                confirmButtonText: '确定',
                type: hasError ? 'warning' : 'success',
                dangerouslyUseHTMLString: true,
            }).then(() => {
                showExpressImport.value = false
            }).catch(() => {
                showExpressImport.value = false
            })
        } else {
            ElMessage.error(res.data.msg || '导入失败')
        }
    } catch (error) {
        console.error('上传失败:', error)
        ElMessage.error('上传失败，请稍后重试')
    }
}

const goToHelp = () => {
    router.push({
        path: '/help/detail',
        query: { doc: 'freight-cost-guide' }
    })
}

onMounted(() => {
    loadConfig()
    loadPriceRules()
})
</script>

<style scoped>
.freight-cost-config {
    padding: 20px;
    background: #f5f7fa;
    min-height: 100vh;
}


/* 🔥 使用 :deep() 只影响当前页面内的 el-card */
.freight-cost-config :deep(.el-card) {
    border-radius: 12px !important;
}

/* 🔥 如果有嵌套的 el-card，确保内部卡片不受影响 */
.freight-cost-config :deep(.el-card .el-card) {
    border-radius: 8px !important;
    /* 内部卡片用更小的圆角 */
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.page-header h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
}

.page-desc {
    margin: 0;
    color: #909399;
    font-size: 14px;
}

.form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    padding-left: 4px;
}

.unit {
    margin-left: 8px;
    color: #909399;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-actions {
    display: flex;
    gap: 12px;
}

/* 让 el-alert 内容充满宽度 */
.import-content :deep(.el-alert) {
    width: 100%;
}

.import-content :deep(.el-alert__content) {
    width: 100%;
    flex: 1;
}

.import-content :deep(.el-alert__content p) {
    margin: 0;
}

/* 让列映射说明区域正常显示 */
.import-content :deep(.el-alert .el-alert__content) {
    overflow: visible;
}

.import-content ul {
    margin: 8px 0 0 20px;
    padding: 0;
}

.import-content li {
    margin: 4px 0;
    color: #606266;
}

.upload-area {
    margin-top: 20px;
}

.upload-icon {
    font-size: 48px;
    color: #c0c4cc;
    margin-bottom: 12px;
}

.upload-text {
    font-size: 14px;
    color: #606266;
    margin-bottom: 4px;
}

.upload-hint {
    font-size: 12px;
    color: #909399;
}

/* 说明卡片样式 */
.intro-card {
    margin-bottom: 20px;
}

/* 确保三列高度一致 */
.intro-card :deep(.el-row) {
    display: flex;
    flex-wrap: wrap;
}

.intro-card :deep(.el-col) {
    display: flex;
}

.intro-item {
    text-align: center;
    padding: 20px 16px;
    background: #f8fafc;
    border-radius: 12px;
    width: 100%;
    display: flex;
    flex-direction: column;
    transition: all 0.3s;
}

.intro-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.intro-icon {
    font-size: 32px;
    margin-bottom: 12px;
}

.intro-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
}

.intro-desc {
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
    margin-bottom: 16px;
    flex: 1;
}

.intro-tip {
    font-size: 12px;
    color: #909399;
    background: #fff;
    padding: 8px 10px;
    border-radius: 6px;
}

.disabled-tip {
    margin: 0 0 24px 140px;
    /* 左边距与表单项label宽度对齐 */
}

.price-disabled-tip {
    margin-top: 20px;
}

.price-disabled-tip :deep(.el-alert) {
    border-radius: 12px;
}

.switch-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
}

.empty-tip {
    text-align: center;
    padding: 40px 20px;
    color: #909399;
    font-size: 14px;
}

.price-card {
    position: relative;
}

.disabled-overlay {
    margin-bottom: 16px;
}

/* 列映射说明样式 */
.column-mapping {
    background: #f8fafc;
    padding: 12px;
    border-radius: 8px;
    margin-top: 8px;
}

.mapping-item {
    padding: 6px 0;
    font-size: 13px;
}

.mapping-label {
    font-weight: 600;
    color: #303133;
    display: inline-block;
    /*width: 70px;*/
}

.mapping-value {
    color: #606266;
    font-family: monospace;
    font-size: 12px;
}

.download-link {
    color: #409eff;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.download-link:hover {
    text-decoration: underline;
}
</style>