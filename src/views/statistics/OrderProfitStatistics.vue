<template>
    <div class="order-profit-dashboard">
        <!-- 页面标题 -->
        <div class="page-header">
            <div>
                <h2>订单及利润查询与统计</h2>
                <p class="page-desc">查看订单利润明细及汇总，支持成本微调和特殊订单标记</p>
            </div>
            <div class="header-actions">
                <!-- <el-button type="info" plain @click="goToHelp">
                    <el-icon>
                        <Document />
                    </el-icon>
                    使用指南
                </el-button> -->
                <!-- <el-button type="primary" @click="exportData">
                    <el-icon>
                        <Download />
                    </el-icon>
                    导出数据
                </el-button> -->
            </div>
        </div>

        <el-alert title="说明" type="info" :closable="false" show-icon style="margin-bottom: 16px">
            <div>利润 = 订单金额 + 邮费 - 商品成本 - 运费成本 - 其他支出（服务费、营销费、保险费等） - 退款金额 + 微调成本</div>
            <div style="margin-top: 8px; font-size: 12px; color: #606266; line-height: 1.8;">
                <div>📌 商品成本：请到 <a href="/cost/item-cost-manage" target="_blank"
                        style="color: #1677FF; text-decoration: none; font-weight: 500;">商品成本配置</a> 页面设置</div>
                <div>📌 运费成本：请到 <a href="/cost/freight-cost-config" target="_blank"
                        style="color: #1677FF; text-decoration: none; font-weight: 500;">运费成本配置</a> 页面设置</div>
                <div>📌 其他支出：需通过支付宝/微信账单流水导入，请到 <a href="/cost/expense" target="_blank"
                        style="color: #1677FF; text-decoration: none; font-weight: 500;">支出明细</a> 页面设置</div>
            </div>
        </el-alert>

        <!-- Tab 切换 -->
        <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="profit-tabs">
            <!-- 明细 Tab -->
            <el-tab-pane label="明细" name="detail">
                <!-- 明细专用筛选栏 -->
                <el-card class="filter-card" style="margin-bottom: 16px">
                    <el-form :inline="true" :model="detailFilter" class="filter-form">
                        <el-form-item label="日期范围">
                            <el-date-picker v-model="detailFilter.dateRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD"
                                value-format="YYYY-MM-DD" style="width: 260px" @change="loadDetailData" />
                        </el-form-item>
                        <el-form-item label="订单状态">
                            <el-select v-model="detailFilter.status" placeholder="全部" clearable style="width: 120px"
                                @change="loadDetailData">
                                <el-option label="买家已付款" value="WAIT_SELLER_SEND_GOODS" />
                                <el-option label="卖家已发货" value="WAIT_BUYER_CONFIRM_GOODS" />
                                <el-option label="交易成功" value="TRADE_FINISHED" />
                                <el-option label="卖家部分发货" value="SELLER_CONSIGNED_PART" />
                                <el-option label="买家已签收,货到付款专用" value="TRADE_BUYER_SIGNED" />
                                <el-option label="已付款禁发" value="PAID_FORBID_CONSIGN" />
                                <el-option label="退款成功" value="TRADE_CLOSED" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="特殊标记">
                            <el-select v-model="detailFilter.isSpecial" placeholder="全部" clearable style="width: 120px"
                                @change="loadDetailData">
                                <el-option label="正常订单" :value="0" />
                                <el-option label="特殊订单" :value="1" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="订单号">
                            <el-input v-model="detailFilter.tid" placeholder="请输入订单号" clearable style="width: 180px"
                                @change="loadDetailData" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="loadDetailData">查询</el-button>
                            <el-button type="primary" @click="resetDetailFilter">重置</el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
                <div class="summary-bar">
                    <el-row :gutter="16">
                        <el-col :span="4"><span class="summary-label">订单数：</span><strong>{{ summary.totalOrders
                                }}</strong></el-col>
                        <el-col :span="4"><span class="summary-label">订单金额：</span><strong>¥{{
                            formatMoney(summary.totalPayment) }}</strong></el-col>
                        <el-col :span="4"><span class="summary-label">商品成本：</span><strong>¥{{
                            formatMoney(summary.totalGoodsCost) }}</strong></el-col>
                        <el-col :span="4"><span class="summary-label">运费成本：</span><strong>¥{{
                            formatMoney(summary.totalFreight) }}</strong></el-col>
                        <el-col :span="4"><span class="summary-label">其他支出：</span><strong>¥{{
                            formatMoney(summary.totalOtherExpense) }}</strong></el-col>
                        <el-col :span="4"><span class="summary-label">利润：</span><strong
                                :style="{ color: summary.totalProfit >= 0 ? '#67c23a' : '#f56c6c' }">¥{{
                                    formatMoney(summary.totalProfit) }}</strong></el-col>
                    </el-row>
                </div>

                <el-table :data="detailList" border stripe v-loading="loading" style="width: 100%"
                    :row-class-name="getRowClassName">
                    <el-table-column prop="tid" label="订单号" width="180">
                        <template #default="{ row }">
                            <a :href="getTaobaoOrderUrl(row.tid)" target="_blank" class="order-link">{{ row.tid
                            }}</a>
                        </template>
                    </el-table-column>
                    <el-table-column prop="pay_time" label="付款时间" width="160" />
                    <el-table-column prop="status" label="订单状态" width="120">
                        <template #default="{ row }">
                            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status)
                            }}</el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column prop="payment" label="订单金额" width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.payment) }}</template>
                    </el-table-column>
                    <el-table-column prop="post_fee" label="邮费" width="100" align="right">
                        <template #default="{ row }">{{ formatMoney(row.post_fee) }}</template>
                    </el-table-column>
                    <el-table-column prop="refund_fee" label="退款金额" width="100" align="right">
                        <template #default="{ row }">{{ formatMoney(row.refund_fee) }}</template>
                    </el-table-column>

                    <el-table-column prop="goods_cost" label="商品成本" width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.goods_cost) }}</template>
                    </el-table-column>
                    <el-table-column prop="freight" label="运费成本" width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.freight) }}</template>
                    </el-table-column>
                    <el-table-column prop="other_expense" label="其他支出" width="120" align="right">
                        <template #header>
                            <span>
                                其他支出
                                <el-tooltip content="点击金额可查看具体明细" placement="top">
                                    <el-icon style="margin-left: 4px; cursor: help;">
                                        <QuestionFilled />
                                    </el-icon>
                                </el-tooltip>
                            </span>
                        </template>
                        <template #default="{ row }">
                            <span v-if="row.other_expense > 0" class="expense-link" @click="viewExpenseDetail(row)">
                                {{ formatMoney(row.other_expense) }}
                            </span>
                            <span v-else>¥0.00</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="adjust_amount" label="微调成本" width="120" align="right">
                        <template #default="{ row }">
                            <span v-if="row.adjust_amount !== 0"
                                :style="{ color: row.adjust_amount > 0 ? '#f56c6c' : '#67c23a' }">
                                {{ row.adjust_amount > 0 ? `+${formatMoney(row.adjust_amount)}` :
                                    formatMoney(row.adjust_amount) }}
                            </span>
                            <span v-else class="text-muted">-</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="总成本" width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.total_cost) }}</template>
                    </el-table-column>

                    <el-table-column prop="profit" label="利润" width="120" align="right">
                        <template #default="{ row }">
                            <strong :style="{ color: row.profit >= 0 ? '#67c23a' : '#f56c6c' }">{{
                                formatMoney(row.profit) }}</strong>
                        </template>
                    </el-table-column>
                    <el-table-column prop="profit_rate" label="利润率" width="100" align="right">
                        <template #default="{ row }">
                            <span :style="{ color: row.profit_rate >= 0 ? '#67c23a' : '#f56c6c' }">{{
                                row.profit_rate }}%</span>
                        </template>
                    </el-table-column>

                    <el-table-column prop="received_payment" label="已收款" width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.received_payment) }}</template>
                    </el-table-column>

                    <el-table-column prop="unreceived_amount" label="未收款" width="120" align="right">
                        <template #default="{ row }">
                            {{ formatMoney((row.payment || 0) - (row.received_payment || 0)) }}
                        </template>
                    </el-table-column>

                    <el-table-column label="操作" width="200">
                        <template #default="{ row }">
                            <el-button type="warning" size="small" link @click="openCostAdjust(row)">微调成本</el-button>
                            <el-button v-if="row.adjust_amount !== 0" type="danger" size="small" link
                                @click="cancelCostAdjust(row)">取消微调</el-button>
                            <el-button v-if="!row.is_special" type="danger" size="small" link
                                @click="markSpecial(row)">标记特殊</el-button>
                            <el-button v-else type="info" size="small" link @click="unmarkSpecial(row)">取消标记</el-button>
                        </template>
                    </el-table-column>
                </el-table>

                <div class="pagination-wrapper">
                    <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.pageSize"
                        :page-sizes="[20, 50, 100]" :total="pagination.total"
                        layout="total, sizes, prev, pager, next, jumper" @size-change="loadDetailData"
                        @current-change="loadDetailData" />
                </div>
            </el-tab-pane>

            <!-- 日汇总 Tab -->
            <el-tab-pane label="日汇总" name="day">
                <el-card class="filter-card" style="margin-bottom: 16px">
                    <el-form :inline="true" :model="dayFilter" class="filter-form">
                        <el-form-item label="日期范围">
                            <el-date-picker v-model="dayFilter.dateRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD"
                                value-format="YYYY-MM-DD" style="width: 260px" @change="loadDaySummary" />
                        </el-form-item>
                        <el-form-item label="订单状态">
                            <el-select v-model="dayFilter.status" placeholder="全部" clearable style="width: 120px"
                                @change="loadDaySummary">
                                <el-option label="买家已付款" value="WAIT_SELLER_SEND_GOODS" />
                                <el-option label="卖家已发货" value="WAIT_BUYER_CONFIRM_GOODS" />
                                <el-option label="交易成功" value="TRADE_FINISHED" />
                                <el-option label="卖家部分发货" value="SELLER_CONSIGNED_PART" />
                                <el-option label="买家已签收,货到付款专用" value="TRADE_BUYER_SIGNED" />
                                <el-option label="已付款禁发" value="PAID_FORBID_CONSIGN" />
                                <el-option label="退款成功" value="TRADE_CLOSED" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="特殊标记">
                            <el-select v-model="dayFilter.isSpecial" placeholder="全部" clearable style="width: 120px"
                                @change="loadDaySummary">
                                <el-option label="正常订单" :value="0" />
                                <el-option label="特殊订单" :value="1" />
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="loadDaySummary">查询</el-button>
                            <el-button type="primary" @click="resetDayFilter">重置</el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
                <el-table :data="daySummaryList" border stripe v-loading="loading" style="width: 100%" row-key="date">
                    <el-table-column prop="day" label="日期" width="120" />
                    <el-table-column prop="order_count" label="订单数" width="100" align="right" />
                    <el-table-column prop="payment" label="订单金额" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.payment) }}</template>
                    </el-table-column>
                    <el-table-column prop="goods_cost" label="商品成本" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.goods_cost) }}</template>
                    </el-table-column>
                    <el-table-column prop="freight" label="运费成本" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.freight) }}</template>
                    </el-table-column>
                    <el-table-column prop="other_expense" label="其他支出" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.other_expense) }}</template>
                    </el-table-column>
                    <el-table-column prop="profit" label="利润" min-width="120" align="right">
                        <template #default="{ row }">
                            <strong :style="{ color: row.profit >= 0 ? '#67c23a' : '#f56c6c' }">{{
                                formatMoney(row.profit) }}</strong>
                        </template>
                    </el-table-column>
                    <el-table-column prop="profit_rate" label="利润率" min-width="100" align="right">
                        <template #default="{ row }">
                            <span :style="{ color: row.profit_rate >= 0 ? '#67c23a' : '#f56c6c' }">{{ row.profit_rate
                                }}%</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="received_payment" label="已收款" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.received_payment) }}</template>
                    </el-table-column>
                    <el-table-column prop="unreceived_amount" label="未收款" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.unreceived_amount) }}</template>
                    </el-table-column>
                    <el-table-column label="操作" width="100" align="center">
                        <template #default="{ row }">
                            <el-button type="primary" size="small" link @click="drillDownToDay(row)">查看明细</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>

            <!-- 月汇总 Tab -->
            <el-tab-pane label="月汇总" name="month">
                <el-card class="filter-card" style="margin-bottom: 16px">
                    <el-form :inline="true" :model="monthFilter" class="filter-form">
                        <el-form-item label="月份范围">
                            <el-date-picker v-model="monthFilter.monthRange" type="monthrange" range-separator="至"
                                start-placeholder="开始月份" end-placeholder="结束月份" format="YYYY-MM" value-format="YYYY-MM"
                                style="width: 260px" @change="loadMonthSummary" />
                        </el-form-item>
                        <el-form-item label="订单状态">
                            <el-select v-model="monthFilter.status" placeholder="全部" clearable style="width: 120px"
                                @change="loadMonthSummary">
                                <el-option label="买家已付款" value="WAIT_SELLER_SEND_GOODS" />
                                <el-option label="卖家已发货" value="WAIT_BUYER_CONFIRM_GOODS" />
                                <el-option label="交易成功" value="TRADE_FINISHED" />
                                <el-option label="卖家部分发货" value="SELLER_CONSIGNED_PART" />
                                <el-option label="买家已签收,货到付款专用" value="TRADE_BUYER_SIGNED" />
                                <el-option label="已付款禁发" value="PAID_FORBID_CONSIGN" />
                                <el-option label="退款成功" value="TRADE_CLOSED" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="特殊标记">
                            <el-select v-model="monthFilter.isSpecial" placeholder="全部" clearable style="width: 120px"
                                @change="loadMonthSummary">
                                <el-option label="正常订单" :value="0" />
                                <el-option label="特殊订单" :value="1" />
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="loadMonthSummary">查询</el-button>
                            <el-button type="primary" @click="resetMonthFilter">重置</el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
                <el-table :data="monthSummaryList" border stripe v-loading="loading" style="width: 100%"
                    row-key="month">
                    <el-table-column prop="month" label="月份" width="100" />
                    <el-table-column prop="order_count" label="订单数" width="100" align="right" />
                    <el-table-column prop="payment" label="订单金额" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.payment) }}</template>
                    </el-table-column>
                    <el-table-column prop="goods_cost" label="商品成本" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.goods_cost) }}</template>
                    </el-table-column>
                    <el-table-column prop="freight" label="运费成本" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.freight) }}</template>
                    </el-table-column>
                    <el-table-column prop="other_expense" label="其他支出" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.other_expense) }}</template>
                    </el-table-column>
                    <el-table-column prop="profit" label="利润" min-width="120" align="right">
                        <template #default="{ row }">
                            <strong :style="{ color: row.profit >= 0 ? '#67c23a' : '#f56c6c' }">{{
                                formatMoney(row.profit) }}</strong>
                        </template>
                    </el-table-column>
                    <el-table-column prop="profit_rate" label="利润率" min-width="100" align="right">
                        <template #default="{ row }">
                            <span :style="{ color: row.profit_rate >= 0 ? '#67c23a' : '#f56c6c' }">{{ row.profit_rate
                                }}%</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="received_payment" label="已收款" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.received_payment) }}</template>
                    </el-table-column>
                    <el-table-column prop="unreceived_payment" label="未收款" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.unreceived_payment) }}</template>
                    </el-table-column>
                    <el-table-column label="操作" width="100" align="center">
                        <template #default="{ row }">
                            <el-button type="primary" size="small" link @click="drillDownToMonth(row)">查看明细</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>

            <!-- 年汇总 Tab -->
            <el-tab-pane label="年汇总" name="year">
                <el-card class="filter-card" style="margin-bottom: 16px">
                    <el-form :inline="true" :model="yearFilter" class="filter-form">
                        <el-form-item label="年份范围">
                            <el-date-picker v-model="yearFilter.yearRange" type="yearrange" range-separator="至"
                                start-placeholder="开始年份" end-placeholder="结束年份" format="YYYY" value-format="YYYY"
                                style="width: 260px" @change="loadYearSummary" />
                        </el-form-item>
                        <el-form-item label="订单状态">
                            <el-select v-model="yearFilter.status" placeholder="全部" clearable style="width: 120px"
                                @change="loadYearSummary">
                                <el-option label="买家已付款" value="WAIT_SELLER_SEND_GOODS" />
                                <el-option label="卖家已发货" value="WAIT_BUYER_CONFIRM_GOODS" />
                                <el-option label="交易成功" value="TRADE_FINISHED" />
                                <el-option label="卖家部分发货" value="SELLER_CONSIGNED_PART" />
                                <el-option label="买家已签收,货到付款专用" value="TRADE_BUYER_SIGNED" />
                                <el-option label="已付款禁发" value="PAID_FORBID_CONSIGN" />
                                <el-option label="退款成功" value="TRADE_CLOSED" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="特殊标记">
                            <el-select v-model="yearFilter.isSpecial" placeholder="全部" clearable style="width: 120px"
                                @change="loadYearSummary">
                                <el-option label="正常订单" :value="0" />
                                <el-option label="特殊订单" :value="1" />
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="loadYearSummary">查询</el-button>
                            <el-button type="primary" @click="resetYearFilter">重置</el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
                <el-table :data="yearSummaryList" border stripe v-loading="loading" style="width: 100%" row-key="year">
                    <el-table-column prop="year" label="年份" width="100" />
                    <el-table-column prop="order_count" label="订单数" width="100" align="right" />
                    <el-table-column prop="payment" label="订单金额" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.payment) }}</template>
                    </el-table-column>
                    <el-table-column prop="goods_cost" label="商品成本" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.goods_cost) }}</template>
                    </el-table-column>
                    <el-table-column prop="freight" label="运费成本" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.freight) }}</template>
                    </el-table-column>
                    <el-table-column prop="other_expense" label="其他支出" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.other_expense) }}</template>
                    </el-table-column>
                    <el-table-column prop="profit" label="利润" min-width="120" align="right">
                        <template #default="{ row }">
                            <strong :style="{ color: row.profit >= 0 ? '#67c23a' : '#f56c6c' }">{{
                                formatMoney(row.profit) }}</strong>
                        </template>
                    </el-table-column>
                    <el-table-column prop="profit_rate" label="利润率" min-width="100" align="right">
                        <template #default="{ row }">
                            <span :style="{ color: row.profit_rate >= 0 ? '#67c23a' : '#f56c6c' }">{{ row.profit_rate
                                }}%</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="received_payment" label="已收款" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.received_payment) }}</template>
                    </el-table-column>
                    <el-table-column prop="unreceived_payment" label="未收款" min-width="120" align="right">
                        <template #default="{ row }">{{ formatMoney(row.unreceived_payment) }}</template>
                    </el-table-column>
                    <el-table-column label="操作" width="100" align="center">
                        <template #default="{ row }">
                            <el-button type="primary" size="small" link @click="drillDownToYear(row)">查看明细</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>
        </el-tabs>

        <!-- 成本微调弹窗 -->
        <el-dialog v-model="costAdjustVisible" title="成本微调" width="500px">
            <el-form :model="costAdjustForm" label-width="100px">
                <el-form-item label="订单号">
                    <el-input v-model="costAdjustForm.tid" disabled />
                </el-form-item>
                <el-form-item label="调整金额" required>
                    <el-input-number v-model="costAdjustForm.adjust_amount" :precision="2" :step="0.5"
                        placeholder="正数增加成本，负数减少成本" />
                    <span class="form-tip">元（正数增加成本，负数减少成本）</span>
                </el-form-item>
                <el-form-item label="备注">
                    <el-input v-model="costAdjustForm.remark" type="textarea" :rows="2" placeholder="调整原因" />
                </el-form-item>
                <el-form-item label="退款取消成本">
                    <el-radio-group v-model="costAdjustForm.refund_cancel_cost">
                        <el-radio :label="0">否</el-radio>
                        <el-radio :label="1">是</el-radio>
                    </el-radio-group>
                    <div class="form-tip">订单关闭或退款时是否取消此成本调整</div>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="costAdjustVisible = false">取消</el-button>
                <el-button type="primary" @click="saveCostAdjust">保存</el-button>
            </template>
        </el-dialog>

        <!-- 支出明细弹窗 -->
        <el-dialog v-model="expenseDetailVisible" :title="`支出明细 - ${currentOrderNo}`" width="800px">
            <el-table :data="expenseDetailList" border stripe size="small" max-height="400">
                <el-table-column prop="fee_name" label="费用名称" width="180" />
                <el-table-column prop="amount" label="金额(元)" width="100" align="right">
                    <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
                </el-table-column>
                <el-table-column prop="fee_date" label="费用日期" width="100" />
                <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
            </el-table>
            <template #footer>
                <el-button @click="expenseDetailVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { QuestionFilled,Document, Download } from '@element-plus/icons-vue'
import { getOrderProfitList, getOrderProfitSummary, getProfitSummary, adjustCost, cancelCostAdjust as cancelCostAdjustApi, markSpecialOrder, getOrderExpenseDetail } from '@/api/profit'
import { formatMoney, getTaobaoOrderUrl } from '@/utils/index'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'

const router = useRouter()

// 状态
const loading = ref(false)
const activeTab = ref('detail')

// 明细筛选条件
const detailFilter = reactive({
    tid: '',
    dateRange: [],
    status: '',
    isSpecial: ''
})

// 日汇总筛选条件
const dayFilter = reactive({
    tid: '',
    dateRange: [],
    status: '',
    isSpecial: ''
})

// 月汇总筛选条件
const monthFilter = reactive({
    tid: '',
    monthRange: [],
    status: '',
    isSpecial: ''
})

// 年汇总筛选条件
const yearFilter = reactive({
    tid: '',
    yearRange: [],
    status: '',
    isSpecial: ''
})

// 分页
const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0
})

// 明细数据
const detailList = ref([])
const summary = reactive({
    totalOrders: 0,
    totalPayment: 0,
    totalGoodsCost: 0,
    totalFreight: 0,
    totalOtherExpense: 0,
    totalProfit: 0
})

// 汇总数据
const daySummaryList = ref([])
const monthSummaryList = ref([])
const yearSummaryList = ref([])

// 成本微调弹窗
const costAdjustVisible = ref(false)
const costAdjustForm = reactive({
    id: 0,
    tid: '',
    adjust_amount: 0,
    refund_cancel_cost: 0,  // 默认0（否）
    remark: ''
})

// 订单状态映射
const getStatusText = (status) => {
    const map = {
        'WAIT_BUYER_PAY': '等待买家付款',
        'WAIT_SELLER_SEND_GOODS': '买家已付款',
        'WAIT_BUYER_CONFIRM_GOODS': '卖家已发货',
        'TRADE_FINISHED': '交易成功',
        'TRADE_CLOSED': '退款成功',
        'TRADE_BUYER_SIGNED': '买家已签收,货到付款专用'
    }
    return map[status] || status || '-'
}

const getStatusType = (status) => {
    const map = {
        'WAIT_BUYER_PAY': 'warning',
        'WAIT_SELLER_SEND_GOODS': 'info',
        'WAIT_BUYER_CONFIRM_GOODS': 'primary',
        'TRADE_FINISHED': 'success',
        'TRADE_CLOSED': 'danger'
    }
    return map[status] || 'info'
}

// 特殊订单行样式
const getRowClassName = ({ row }) => {
    return row.is_special === 1 ? 'special-order-row' : ''
}

// 加载明细数据
const loadDetailData = async () => {
    loading.value = true
    try {
        const params = {
            page: pagination.current,
            page_size: pagination.pageSize,
            tid: detailFilter.tid,
            start_date: detailFilter.dateRange?.[0],
            end_date: detailFilter.dateRange?.[1],
            status: detailFilter.status,
            is_special: detailFilter.isSpecial
        }
        const res = await getOrderProfitList(params)
        if (res.data.code === 200) {
            detailList.value = res.data.data.list || []
            pagination.total = res.data.data.total || 0
            await loadSummary()
        }
    } catch (error) {
        ElMessage.error('加载失败')
    } finally {
        loading.value = false
    }
}

// 加载汇总数据
const loadSummary = async () => {
    const params = {
        tid: detailFilter.tid,
        start_date: detailFilter.dateRange?.[0],
        end_date: detailFilter.dateRange?.[1],
        status: detailFilter.status,
        is_special: detailFilter.isSpecial
    }
    const res = await getOrderProfitSummary(params)
    if (res.data.code === 200) {
        summary.totalOrders = res.data.data.total_orders || 0
        summary.totalPayment = res.data.data.total_payment || 0
        summary.totalGoodsCost = res.data.data.total_goods_cost || 0
        summary.totalFreight = res.data.data.total_freight || 0
        summary.totalOtherExpense = res.data.data.total_other_expense || 0
        summary.totalProfit = res.data.data.total_profit || 0
    }
}

// 加载日汇总
const loadDaySummary = async () => {
    loading.value = true
    try {
        const params = {
            start_date: dayFilter.dateRange?.[0],
            end_date: dayFilter.dateRange?.[1],
            status: dayFilter.status,
            is_special: dayFilter.isSpecial,
            tid: dayFilter.tid
        }
        const res = await getProfitSummary({ ...params, type: 'day' })
        if (res.data.code === 200) {
            daySummaryList.value = res.data.data || []
        }
    } finally {
        loading.value = false
    }
}

// 加载月汇总
const loadMonthSummary = async () => {
    loading.value = true
    try {
        const params = {
            start_month: monthFilter.monthRange?.[0],
            end_month: monthFilter.monthRange?.[1],
            status: monthFilter.status,
            is_special: monthFilter.isSpecial,
            tid: monthFilter.tid
        }
        const res = await getProfitSummary({ ...params, type: 'month' })
        if (res.data.code === 200) {
            monthSummaryList.value = res.data.data || []
        }
    } finally {
        loading.value = false
    }
}

// 加载年汇总
const loadYearSummary = async () => {
    loading.value = true
    try {
        const params = {
            start_year: yearFilter.yearRange?.[0],
            end_year: yearFilter.yearRange?.[1],
            status: yearFilter.status,
            is_special: yearFilter.isSpecial,
            tid: yearFilter.tid
        }
        const res = await getProfitSummary({ ...params, type: 'year' })
        if (res.data.code === 200) {
            yearSummaryList.value = res.data.data || []
        }
    } finally {
        loading.value = false
    }
}


// 重置明细筛选
const resetDetailFilter = () => {
    detailFilter.tid = ''
    detailFilter.dateRange = []
    detailFilter.status = ''
    detailFilter.isSpecial = ''
    pagination.current = 1
    loadDetailData()
}

// 重置日汇总筛选
const resetDayFilter = () => {
    dayFilter.tid = ''
    dayFilter.dateRange = []
    dayFilter.status = ''
    dayFilter.isSpecial = ''
    loadDaySummary()
}

// 重置月汇总筛选
const resetMonthFilter = () => {
    monthFilter.tid = ''
    monthFilter.monthRange = []
    monthFilter.status = ''
    monthFilter.isSpecial = ''
    loadMonthSummary()
}

// 重置年汇总筛选
const resetYearFilter = () => {
    yearFilter.tid = ''
    yearFilter.yearRange = []
    yearFilter.status = ''
    yearFilter.isSpecial = ''
    loadYearSummary()
}

// 切换Tab时加载对应数据
const handleTabClick = (tab) => {
    const currentTab = tab.props.name

    switch (currentTab) {
        case 'detail':
            loadDetailData()
            break
        case 'day':
            loadDaySummary()
            break
        case 'month':
            loadMonthSummary()
            break
        case 'year':
            loadYearSummary()
            break
    }
}

// 查询
const searchData = () => {
    pagination.current = 1
    if (activeTab.value === 'detail') {
        loadDetailData()
    } else if (activeTab.value === 'day') {
        loadDaySummary()
    } else if (activeTab.value === 'month') {
        loadMonthSummary()
    } else if (activeTab.value === 'year') {
        loadYearSummary()
    }
}

// 导出
const exportData = () => {
    ElMessage.info('导出功能开发中')
}

// 打开成本微调弹窗
const openCostAdjust = (row) => {
    costAdjustForm.id = row.id
    costAdjustForm.tid = row.tid
    costAdjustForm.adjust_amount = 0
    costAdjustForm.remark = ''
    costAdjustForm.refund_cancel_cost = row.refund_cancel_cost ?? 0
    costAdjustVisible.value = true
}

// 保存成本微调
const saveCostAdjust = async () => {
    if (costAdjustForm.adjust_amount === 0) {
        ElMessage.warning('请填写调整金额')
        return
    }
    try {
        const res = await adjustCost({
            id: costAdjustForm.id,
            adjust_amount: costAdjustForm.adjust_amount,
            refund_cancel_cost: costAdjustForm.refund_cancel_cost,
            remark: costAdjustForm.remark
        })
        if (res.data.code === 200) {
            ElMessage.success('调整成功')
            costAdjustVisible.value = false
            loadDetailData()
        } else {
            ElMessage.error(res.data.msg || '调整失败')
        }
    } catch (error) {
        ElMessage.error('调整失败')
    }
}

// 取消成本调整
const cancelCostAdjust = async (row) => {
    await ElMessageBox.confirm('确定取消该订单的成本调整吗？', '提示', { type: 'warning' })
    const res = await cancelCostAdjustApi({ id: row.id })
    if (res.data.code === 200) {
        ElMessage.success('取消成功')
        loadDetailData()
    }
}

// 标记特殊订单
const markSpecial = async (row) => {
    await ElMessageBox.confirm('标记为特殊订单后，该订单将不计入利润统计，是否继续？', '提示', { type: 'warning' })
    const res = await markSpecialOrder({ id: row.id, is_special: 1 })
    if (res.data.code === 200) {
        ElMessage.success('标记成功')
        loadDetailData()
    }
}

// 取消标记
const unmarkSpecial = async (row) => {
    const res = await markSpecialOrder({ id: row.id, is_special: 0 })
    if (res.data.code === 200) {
        ElMessage.success('已取消标记')
        loadDetailData()
    }
}
// 下钻：日汇总 -> 明细
const drillDownToDay = (row) => {
    detailFilter.dateRange = [row.day, row.day]
    activeTab.value = 'detail'
    pagination.current = 1
    loadDetailData()
}

// 下钻：月汇总 -> 日汇总
const drillDownToMonth = (row) => {
    const year = row.month.substring(0, 4)
    const month = row.month.substring(5, 7)
    const startDay = `${year}-${month}-01`
    const endDay = dayjs(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD')
    dayFilter.dateRange = [startDay, endDay]
    activeTab.value = 'day'
    loadDaySummary()
}

// 下钻：年汇总 -> 月汇总
const drillDownToYear = (row) => {
    monthFilter.monthRange = [`${row.year}-01`, `${row.year}-12`]
    activeTab.value = 'month'
    loadMonthSummary()
}

// 添加支出明细弹窗状态
const expenseDetailVisible = ref(false)
const expenseDetailList = ref([])
const currentOrderNo = ref('')

// 查看支出明细
const viewExpenseDetail = async (row) => {
    currentOrderNo.value = row.tid
    try {
        const res = await getOrderExpenseDetail(row.tid)
        if (res.data.code === 200) {
            expenseDetailList.value = res.data.data.details || []
            expenseDetailVisible.value = true
        } else {
            ElMessage.error('获取支出明细失败')
        }
    } catch (error) {
        ElMessage.error('获取支出明细失败')
    }
}

// 跳转到帮助文档
const goToHelp = () => {
    router.push({
        path: '/help/detail',
        query: { doc: 'order-profit-guide' }
    })
}

onMounted(() => {
    loadDetailData()
})
</script>

<style scoped>
.order-profit-dashboard {
    padding: 20px;
    background: #f5f7fa;
    min-height: 100vh;
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

.header-actions {
    display: flex;
    gap: 12px;
}

.filter-card {
    margin-bottom: 20px;
    border-radius: 12px;
}

.filter-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
}

.profit-tabs {
    background: white;
    border-radius: 12px;
    padding: 16px;
}

.summary-bar {
    background: #f8fafc;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
}

.summary-label {
    color: #909399;
    font-size: 14px;
}

.order-link {
    color: #409eff;
    text-decoration: none;
}

.order-link:hover {
    text-decoration: underline;
}

.pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}

.text-muted {
    color: #c0c4cc;
}

.form-tip {
    margin-left: 8px;
    font-size: 12px;
    color: #909399;
}

:deep(.special-order-row) {
    background-color: #fdf6ec !important;
}

:deep(.special-order-row:hover) {
    background-color: #fdf0df !important;
}

/* 只针对操作列 */
:deep(.el-table__row .el-button--small + .el-button--small) {
    margin-left: 4px;
}

.expense-link {
    color: #409eff;
    cursor: pointer;
}

.expense-link:hover {
    color: #66b1ff;
}
</style>