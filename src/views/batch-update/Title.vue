<template>
    <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>批量修改 </el-breadcrumb-item>
        <el-breadcrumb-item>修改标题</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="mtb-15">
        <el-alert title="" type="info" show-icon :closable="false">
            <div>
                每天免费修改<span class="h-b">1500</span>个商品标题，
                <!-- 之后需要消耗API使用数， -->
                今天已用<span class="h-b">{{ useNum }}</span>次，剩余<span class="h-b">{{ 1500 - useNum }}</span>次
                <!-- ，<el-button type="primary" size="small">购买数量包</el-button> -->
            </div>
        </el-alert>
    </div>
    <el-tabs type="border-card" v-model="activeName">
        <el-tab-pane label="列表修改" name="list">
            <FormList ref="formListRef" :sort="sort" :order="order" :currentPage="currentPage" :pageSize="pageSize"
                @loaded="handleLoaded" />
            <el-table :data="tableData" row-key="id" ref="tableRef" @sort-change="handleSortChange">
                <el-table-column type="index" width="50" label="" :index="indexMethod" />
                <el-table-column type="selection" width="55" :reserve-selection="true" />
                <el-table-column width="185">
                    <template #header>
                        <el-button size="small" type="primary" plain @click="batchSave()" :loading="batchSaveLoading">
                            {{ batchSaveLoading ? '保存中' : '批量保存修改' }}
                        </el-button>
                    </template>
                    <template #default="scope">
                        <div class="textarea-wrap">
                            <div>
                                <a :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank">
                                    <el-image :src="scope.row.pic_url + '_60x60.jpg'" style="width:60px">
                                        <template #error>&nbsp;</template>
                                    </el-image>
                                </a>
                            </div>
                            <div class="ml-5 text-gray">
                                <el-row>ID:{{ scope.row.num_iid }}</el-row>
                                <el-row>状态:{{ getApproveStatus(scope.row.approve_status) }}</el-row>
                                <el-row>商家编码:{{ scope.row.outer_id ?? '无' }}</el-row>
                                <el-row v-if="scope.row.updateStatus">
                                    <el-text v-if="scope.row.updateStatus == 'success'" type="success" size="small">
                                        <el-icon>
                                            <CircleCheck />
                                        </el-icon>修改成功
                                    </el-text>
                                    <el-text v-else-if="scope.row.updateStatus == 'fail'" type="danger" size="small"
                                        truncated>
                                        修改出错：{{ scope.row.failMsg }}
                                    </el-text>
                                </el-row>
                            </div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column property="title" label="标题">
                    <template #default="scope">
                        <div class="text-gray">{{ scope.row.title }}</div>
                        <div>
                            <div class="textarea-wrap">
                                <el-input v-model="scope.row.newTitle" :rows="2" type="textarea" />
                                <div :class="{ red: getLength(scope.row.newTitle) > 60 }" class="ml-5">
                                    {{ getLength(scope.row.newTitle) }}/60
                                </div>
                            </div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="185">
                    <template #default="scope">
                        <el-button size="small" type="success" plain @click="save(scope.row, scope.$index)"
                            :loading="scope.row.loading">
                            {{ scope.row.loading ? '保存中' : '保存修改' }}
                        </el-button>
                        <el-button size="small" plain
                            @click="showDetails(scope.row.num_iid, scope.row.newTitle, scope.$index)">修改记录</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination @current-change="handleCurrentChange" @size-change="handleSizeChange"
                :current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper" :total="total">
            </el-pagination>
            <TitleListDetail ref="detailRef" :numIid="detailNumIid" @recovered="handleRecovered" />
        </el-tab-pane>
        <el-tab-pane label="范围修改" name="shop">
            <el-divider content-position="left">修改范围</el-divider>
            <FormShop ref="formShopRef" @form-change="formShopChange" />
            <el-divider content-position="left">修改内容</el-divider>
            <el-form :inline="true" :model="updateContentForm" label-width="auto" style="width:100%">
                <div v-for="(domain, index) in updateContentForm.domains" :key="domain.key">
                    <el-form-item :label="'将关键字' + (index + 1)">
                        <el-input v-model="domain.findWordValue" placeholder="输入关键字" clearable style="width:300px" />
                    </el-form-item>
                    <el-form-item label="替换为">
                        <el-input v-model="domain.replaceWordValue" placeholder="不填将替换为空，可以输入空格" clearable
                            style="width:300px" />
                        <el-button v-if="index == 0" :icon="Plus" class="ml-5" size="small"
                            @click="addDomain">添加一行</el-button>
                        <el-button v-else :icon="Minus" class="ml-5" size="small" @click="removeDomain(domain)" />
                    </el-form-item>
                </div>
                <div>
                    <el-form-item label="添加前缀">
                        <el-input v-model="updateContentForm.prefix" clearable style="width:300px" />
                    </el-form-item>
                    <el-form-item label="添加后缀">
                        <el-input v-model="updateContentForm.suffix" clearable style="width:300px" />
                    </el-form-item>
                </div>
                <div>
                    <el-form-item label="在标题第" style="margin-right: 10px;">
                        <el-select v-model="updateContentForm.addIndex" style="width:100px">
                            <el-option v-for="n in 29" :label="n" :value="n" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="个字后添加">
                        <el-input v-model="updateContentForm.addWord" clearable style="width:300px" />
                    </el-form-item>
                </div>
            </el-form>
            <div class="btn-wrap">
                <el-button type="primary" @click="preview" :loading="loadingPreview">预览修改结果</el-button>
                <el-button type="primary" @click="startUpdate" :disabled="tableDataPreview.length == 0">开始修改</el-button>
            </div>
            <el-divider content-position="left">预览修改结果</el-divider>
            <el-table size="small"
                :data="tableDataPreview.slice((currentPagePreview - 1) * pageSizePreview, currentPagePreview * pageSizePreview)">
                <el-table-column type="index" width="55" label="序号" :index="indexMethodPreview" />
                <el-table-column property="pic_url" label="原标题" width="500">
                    <template #default="scope">
                        <div class="textarea-wrap">
                            <div>
                                <a :href="getItemWirelessUrl(scope.row.num_iid)" target="_blank">
                                    <el-image :src="scope.row.pic_url + '_60x60.jpg'" style="width:60px">
                                        <template #error>&nbsp;</template>
                                    </el-image>
                                </a>
                            </div>
                            <div class="ml-5 text-gray">
                                <el-row>{{ scope.row.title }}</el-row>
                                <el-row>ID:{{ scope.row.num_iid }} 状态:{{ getApproveStatus(scope.row.approve_status)
                                }}</el-row>
                            </div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column property="newTitle" label="修改后">
                    <template #default="scope">
                        <div v-if="scope.row.newTitle == scope.row.title" class="red">
                            标题没有变化，将跳过修改
                        </div>
                        <div v-else class="h">
                            {{ scope.row.newTitle }}
                        </div>
                        <div v-if="scope.row.newTitleLength > 60" class="red">
                            标题不能超过30个汉字或60个字符，已超{{ scope.row.newTitleLength - 60 }}个字符
                        </div>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination @current-change="handleCurrentChangePreview" @size-change="handleSizeChangePreview"
                :current-page="currentPagePreview" v-model:page-size="pageSizePreview" :page-sizes="[10, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper" :total="tableDataPreview.length" size="small" />
            <div class="mt-15">&nbsp;</div>
            <el-divider content-position="left">修改记录</el-divider>
            <el-table size="small" :data="tableDataRecord">
                <el-table-column type="index" width="50" label="序号" />
                <el-table-column property="datetime" label="修改时间" width="150" />
                <el-table-column property="update_range_text" label="修改范围">
                    <template #default="scope">
                        <div v-html="scope.row.update_range_text"></div>
                    </template>
                </el-table-column>
                <el-table-column property="update_content_text" label="修改内容">
                    <template #default="scope">
                        <div v-html="scope.row.update_content_text"></div>
                    </template>
                </el-table-column>
                <el-table-column property="total" label="总数" width="50" />
                <el-table-column property="success" label="成功" width="50" />
                <el-table-column property="fail" label="出错" width="50" />
                <el-table-column property="skip" label="跳过" width="50" />
                <el-table-column label="操作" width="100">
                    <template #default="scope">
                        <el-button size="small" plain
                            @click="recordId = scope.row.id; shopRecordDetailRef.dialogVisible = true">查看</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <el-dialog v-model="dialogProgressVisible" title="修改进度" width="800" :close-on-click-modal="false">
                <el-progress :text-inside="true" :stroke-width="26" :percentage="percentage" />
                <div class="percent-tip">
                    <div>{{ saveCompleteMsg }}</div>
                </div>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button type="primary" @click="dialogProgressVisible = false">确定</el-button>
                    </div>
                </template>
            </el-dialog>
            <TitleShopDetail ref="shopRecordDetailRef" :recordId="recordId" />
        </el-tab-pane>
        <!-- <el-tab-pane label="导入修改" name="import">导入修改</el-tab-pane> --> 
    </el-tabs>
</template>
<script setup>
import { onMounted, ref, useTemplateRef, reactive, watch } from 'vue'
import FormList from './FormList.vue'
import FormShop from './components/FormShop.vue'
import TitleListDetail from './TitleListDetail.vue'
import { getItemWirelessUrl, getApproveStatus, getLength, insertStringAt } from '@/utils/index'
import request from '@/utils/request'
import { useIndexMethod } from '@/composables/useIndexMethod'
import { CircleCheck, Plus, Minus } from '@element-plus/icons-vue'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import TitleShopDetail from './TitleShopDetail.vue'

const activeName = ref('shop')

// 获取使用次数
const useNum = ref(0)
const getUseNum = () => {
    request.post('/api/batch-update-title/get-use-num', {}).then(response => {
        useNum.value = response.data.data
    }).catch((error) => {
        ElMessage.error(error)
    })
}

// 排序
const sort = ref('')
const order = ref('')
const handleSortChange = (column) => {
    sort.value = column.prop
    order.value = column.order === 'ascending' ? 'asc' : 'desc'
}

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const handleCurrentChange = (val) => {
    currentPage.value = val
}
const handleSizeChange = (val) => {
    pageSize.value = val
}

// 数据查询完成
const tableData = ref([])
const handleLoaded = (data, totalNum) => {
    tableData.value = data
    total.value = totalNum
}

// 保存修改
const save = (row, index) => {
    if (row.newTitle == row.title) {
        ElMessage.error('标题未发生变化，无需修改')
        return
    }
    const len = getLength(row.newTitle)
    if (len > 60) {
        ElMessage.error('标题不能超过30个汉字或60个字符')
        return
    }
    ElMessageBox.confirm(
        '确定修改标题？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        }
    ).then(() => {
        doSave(row, index)
    }).catch(() => { })

}
const doSave = (row, index) => {
    const realIndex = getRealIndex(index)
    row.loading = true
    request.post('/api/batch-update-title/save-list-detail', {
        numIid: row.num_iid,
        newTitle: row.newTitle,
        title: row.title
    }).then(response => {
        row.loading = false
        if (response.data.status) {
            ElMessage.success('保存成功')
            tableData.value[realIndex].title = row.newTitle
            getUseNum()
        } else {
            ElMessage.error(response.data.msg)
        }
    }).catch((error) => {
        row.loading = false
        ElMessage.error(error)
    })
}
const getRealIndex = (index) => {
    return (currentPage.value - 1) * pageSize.value + index
}

// 显示修改记录
const detailNumIid = ref()
const detailRef = useTemplateRef('detailRef')
const detailIndex = ref()
const showDetails = (numIid, newTitle, index) => {
    detailNumIid.value = numIid
    detailRef.value.dialogVisible = true
    detailRef.value.dialogTitle = '修改记录|' + newTitle + '(商品ID：' + numIid + ')'
    detailIndex.value = index
}

// 已恢复原标题
const handleRecovered = (recoveredTitle) => {
    const realIndex = getRealIndex(detailIndex.value)
    tableData.value[realIndex].title = recoveredTitle
    tableData.value[realIndex].newTitle = recoveredTitle
}

// 批量保存修改
const tableRef = useTemplateRef('tableRef')
const batchSave = () => {
    const selectionRows = tableRef.value.getSelectionRows()
    if (!selectionRows.length) {
        ElMessage.error('请选择需要修改的商品')
        return
    }
    for (let i = 0; i < selectionRows.length; i++) {
        if (selectionRows[i].newTitle == selectionRows[i].title) {
            ElMessage.error('第' + (i + 1) + '个选择项标题未发生变化，无需修改')
            return
        }
        const len = getLength(selectionRows[i].newTitle)
        if (len > 60) {
            ElMessage.error('第' + (i + 1) + '个选择项标题不能超过30个汉字或60个字符')
            return
        }
    }
    ElMessageBox.confirm(
        '即将修改<span class="h-b">' + selectionRows.length + '</span>个商品标题，确定保存修改？<br />提示：可在修改记录中查看和恢复数据',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info',
            dangerouslyUseHTMLString: true
        }
    ).then(() => {
        doBatchSave(selectionRows)
    }).catch(() => { })
}
const batchSaveLoading = ref(false)
const doBatchSave = (rows) => {
    batchSaveLoading.value = true
    request.post('/api/batch-update-title/batch-save-list', {
        rows
    }).then(response => {
        batchSaveLoading.value = false
        ElMessageBox.alert(
            '成功修改<span class="h-b">' + response.data.data.success + '</span>个商品' + (response.data.data.fail > 0 ? '，出错<span class="h-b">' + response.data.data.fail + '</span>个商品' : ''),
            '提示',
            {
                dangerouslyUseHTMLString: true,
            }
        )
        updateSaveStatus(response.data.data.result)
        if (response.data.data.success > 0) {
            getUseNum()
        }
    }).catch((error) => {
        batchSaveLoading.value = false
        ElMessage.error(error)
    })
}
const updateSaveStatus = (result) => {
    result.forEach(val => {
        let index = getIndex(val['num_iid'])
        if (index > -1) {
            tableData.value[index].updateStatus = val['updateStatus']
            tableData.value[index].failMsg = val['failMsg'] ?? null
            if (val['updateStatus'] == 'success') {
                tableData.value[index].title = tableData.value[index].newTitle
            }
        }
    })
}
const getIndex = (numIid) => {
    return tableData.value.findIndex(val => {
        return numIid == val.num_iid
    })
}

// 分页index递增
const indexMethod = (index) => {
    const { newIndex } = useIndexMethod(index, currentPage, pageSize)
    return newIndex.value
}
// 分页index递增
const indexMethodPreview = (index) => {
    const { newIndex } = useIndexMethod(index, currentPagePreview, pageSizePreview)
    return newIndex.value
}

//
onMounted(() => {
    getUseNum()
    getShopRecord()
})

// 范围修改
const updateContentForm = reactive({
    domains: [
        {
            key: 1,
            findWordValue: '',
            replaceWordValue: ''
        }
    ],
    prefix: '',
    suffix: '',
    addIndex: '1',
    addWord: ''
})
// 动态添加表单项
const addDomain = () => {
    if (updateContentForm.domains.length >= 15) {
        ElMessage.error('最多支持15行')
        return
    }
    updateContentForm.domains.push({
        key: Date.now(),
        findWordValue: '',
        replaceWordValue: ''
    })
}
// 动态删除表单项
const removeDomain = (item) => {
    const index = updateContentForm.domains.indexOf(item)
    if (index !== -1) {
        updateContentForm.domains.splice(index, 1)
    }
}
// 预览
const loadingPreview = ref(false)
const formShopRef = useTemplateRef('formShopRef')
async function preview() {
    if (!checkUpdateContent()) {
        return
    }
    loadingPreview.value = true
    const items = await formShopRef.value.getItems()
    loadingPreview.value = false
    if (items.length) {
        for (let i = 0; i < items.length; i++) {
            items[i].newTitle = getNewTitle(items[i].title)
            items[i].newTitleLength = getLength(items[i].newTitle)
        }
    }
    tableDataPreview.value = items
}
// 修改内容检查
const checkUpdateContent = () => {
    if (updateContentForm.domains.length == 1
        && updateContentForm.domains[0].findWordValue == ''
        && updateContentForm.domains[0].replaceWordValue == ''
        && updateContentForm.prefix.trim() == ''
        && updateContentForm.suffix.trim() == ''
        && updateContentForm.addWord == ''
    ) {
        ElMessage.error('修改内容不能为空')
        return false
    }
    for (let i = 0; i < updateContentForm.domains.length; i++) {
        if (updateContentForm.domains[i].replaceWordValue != '' && updateContentForm.domains[i].findWordValue == '') {
            ElMessage.error('关键字' + (i + 1) + '不能为空')
            return false
        }
        // if (updateContentForm.domains[i].replaceWordValue == '') {
        //     ElMessage.error('关键字' + (i + 1) + '替换内容不能为空')
        //     return false
        // }
        if (updateContentForm.domains[i].findWordValue != '' && updateContentForm.domains[i].findWordValue == updateContentForm.domains[i].replaceWordValue) {
            ElMessage.error('关键字' + (i + 1) + '和替换内容不能相同')
            return false
        }
    }
    if (updateContentForm.prefix != '' && updateContentForm.prefix.trim() == '') {
        ElMessage.error('前缀不能为空格')
        return false
    }
    if (updateContentForm.suffix != '' && updateContentForm.suffix.trim() == '') {
        ElMessage.error('后缀不能为空格')
        return false
    }
    return true
}
// 按照修改内容获取新标题
const getNewTitle = (title) => {
    let newTitle = title
    updateContentForm.domains.forEach(val => {
        let regex = new RegExp(`${val.findWordValue}`, "g")
        newTitle = newTitle.replace(regex, val.replaceWordValue)
    })
    let prefix = updateContentForm.prefix.trim()
    if (prefix != '') {
        newTitle = prefix + newTitle
    }
    let suffix = updateContentForm.suffix.trim()
    if (suffix != '') {
        newTitle = newTitle + suffix
    }
    if (updateContentForm.addWord != '') {
        newTitle = insertStringAt(newTitle, updateContentForm.addWord, updateContentForm.addIndex)
    }
    return newTitle
}
// 分页
const currentPagePreview = ref(1)
const pageSizePreview = ref(10)
const handleCurrentChangePreview = (val) => {
    currentPagePreview.value = val
}
const handleSizeChangePreview = (val) => {
    pageSizePreview.value = val
}
const tableDataPreview = ref([])
// 开始修改
const startUpdate = () => {
    const updatableCount = getUpdatableCount()
    if (!updatableCount) {
        ElMessage.error('没有可修改商品')
        return
    }
    let msg = '即将修改' + updatableCount + '个商品标题，'
    msg += '每天免费修改<span class="h-b">1500</span>个商品标题，'
    msg += '今天已用<span class="h-b">' + useNum.value + '</span>次，'
    msg += '剩余<span class="h-b">' + (1500 - useNum.value) + '</span>次,'
    if ((1500 - useNum) < updatableCount) {
        msg += '剩余次数不够本次修改'
        ElMessageBox.alert(
            msg,
            '提示',
            {
                dangerouslyUseHTMLString: true,
            }
        )
        return
    } else {
        msg += '<br />确定保存修改？'
        ElMessageBox.confirm(
            msg,
            '提示',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'info',
                dangerouslyUseHTMLString: true
            }
        ).then(() => {
            doStartUpdate()
        }).catch(() => { })
    }
}
// 获取可修改商品总数
const getUpdatableCount = () => {
    let count = 0
    tableDataPreview.value.forEach(val => {
        if (val.newTitle != val.title && val.newTitleLength <= 60) {
            count++
        }
    })
    return count
}
// 修改进程
const dialogProgressVisible = ref(false)
const percentage = ref(0)
const saveCompleteMsg = ref('')
const doStartUpdate = () => {
    dialogProgressVisible.value = true
    percentage.value = 0
    saveCompleteMsg.value = ''
    try {
        const ctrl = new AbortController() // 用于中断请求  
        fetchEventSource('/api/batch-update-title/shop-update', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // 设置token 
            },
            method: 'POST',
            body: JSON.stringify({
                rows: tableDataPreview.value,
                updateRangeText: formShopRef.value.getUpdateRangeText(),
                updateContentText: getUpdateContentText()
            }),
            signal: ctrl.signal,
            openWhenHidden: true, // 页面退至后台时保持连接  
            onopen: (response) => {
                console.log('连接已打开', response)
            },
            onmessage: (event) => {
                console.log('收到消息:', event.data)
                const data = JSON.parse(event.data)
                if (data.status == 'progress') {
                    percentage.value = data.progress
                } else if (data.status == 'complete') {
                    saveCompleteMsg.value = data.message
                    ctrl.abort() // 中断请求
                    percentage.value = 100
                    getShopRecord()
                    getUseNum()
                } else if (data.status == 'error') {
                    ElMessage.error(data.message)
                    ctrl.abort() // 中断请求
                }
            },
            onerror: (error) => {
                console.error('连接发生错误:', error)
                ElMessage.error(error.message)
                ctrl.abort() // 中断请求  
            },
            onclose: () => {
                console.log('连接已关闭')
            },
        })
    } catch (err) {
        ElMessage.error(err.message)
        throw new Error("终止连接")
    }
}
// 获取修改内容文字
const getUpdateContentText = () => {
    let text = ''
    updateContentForm.domains.forEach((val, index) => {
        if (val.findWordValue != '') {
            text += `将关键字：${val.findWordValue}，替换为：` + (val.replaceWordValue != '' ? val.replaceWordValue : '空')
            if (index < (updateContentForm.domains.length - 1)) {
                text += '\r\n'
            }
        }
    })
    const prefix = updateContentForm.prefix.trim()
    if (prefix != '') {
        text += '\r\n添加前缀：' + prefix
    }
    const suffix = updateContentForm.suffix.trim()
    if (suffix != '') {
        text += '\r\n添加后缀：' + suffix
    }
    if (updateContentForm.addWord != '') {
        text += '\r\n在标题第' + updateContentForm.addIndex + '个字后添加：' + updateContentForm.addWord
    }
    return text
}
// 修改内容改变时需重新预览
watch(updateContentForm, () => {
    tableDataPreview.value = []
})
const formShopChange = () => {
    tableDataPreview.value = []
}

// 获取范围修改记录
const tableDataRecord = ref([])
const getShopRecord = () => {
    request.post('/api/batch-update-title/get-shop-record', {}).then(response => {
        tableDataRecord.value = response.data.data
    }).catch((error) => {
        ElMessage.error(error)
    })
}
// 查看范围修改记录明细
const recordId = ref()
const shopRecordDetailRef = useTemplateRef('shopRecordDetailRef')
</script>
<style scoped>
.el-pagination {
    margin-top: 15px;
}

.textarea-wrap {
    display: flex;
    align-items: center;
}

.btn-wrap {
    display: flex;
    justify-content: center;

    .el-button:first-of-type {
        margin-left: -100px;
    }

    .el-button+.el-button {
        margin-left: 50px;
    }
}

.percent-tip {
    margin-top: 10px;
    line-height: 2em;
}

.dialog-footer {
    padding-right: 15px;
}
</style>