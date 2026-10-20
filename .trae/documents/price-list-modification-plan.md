# 修改价格 - 列表修改功能实现计划

## Summary

在批量改价页面（`price/index.vue`）的"列表修改"tab 中，参考"修改标题"的列表修改模式，实现商品一口价和 SKU 价格的内联编辑、单行/批量保存、修改记录查看与恢复功能。

## Current State Analysis

### 前端现状
- **price/index.vue** L366-368：已有"列表修改"tab 占位（`<div class="gray-tip">列表修改功能开发中...</div>`）
- 已引入 `FormShop`、`PriceShopDetail`、`W2AuthDialog` 组件，已有 `useW2Auth` 和 `request` 工具
- 顶部 `el-alert` 显示版本限额（`quotaStatus`）
- "范围修改"tab 已有完整的改价规则表单 + 预览 + 异步任务流程

### 参考实现（Title.vue 列表修改）
- **Title.vue** L17-86：`FormList` 筛选 → `el-table` 展示 → 每行内联编辑(`newTitle`) → 单行保存(`save`) / 批量保存(`batchSave`) → 修改记录弹窗(`TitleListDetail`)
- **FormList.vue**：props=`{withSku, currentPage, pageSize, sort, order}`，emit=`loaded`，调用 PHP `/api/item/get-items`，`withSku=true` 时返回 `item.skus` 数组并在 `item.children` 中生成子行
- **TitleListDetail.vue**：修改记录弹窗，调用 PHP `/api/batch-update-title/get-list-details` 获取记录，`recover-list-detail` 恢复

### Go 后端现状
- **路由** (`router.go` L53-64)：`/api/v1/batch-update-price/*` 下已有 preview、create-task、task-progress、quota-status、check-w2-auth、get-shop-record 等
- **ItemRepository** (`item_repo.go`)：`FindSkusByNumIids`(批量查SKU)、`FindSkuProperties`(查properties参数)、`FindItemsByFilterPaged`(keyset分页)
- **TaobaoPriceClient** (`taobao_price_client.go`)：
  - `UpdateSkuPricesWithItemPrice(ctx, sellerNick, numIid, skus []SkuPriceUpdate, itemPrice string) map[string]error` — 有SKU商品逐个SKU改价+同步一口价
  - `UpdateItemPriceOnly(ctx, sellerNick, numIid, price string) error` — 无SKU商品改一口价
  - `SkuPriceUpdate{SkuID, Properties, Price}`
- **W2授权** (`w2auth.js`)：`ensureW2Auth(onPass)` 预检，过期弹窗+轮询，通过后自动回调
- **数据模型**：`GlyxItem`(num_iid, title, price一口价, status...)、`GlyxItemSKU`(sku_id, price, properties, properties_name, quantity...)、`GlyxPriceTaskDetail`(已有的任务明细表，含 num_iid/sku_id/original_price/new_price/status/msg/recovered/recover_num)

### API 路由代理（vite.config.js）
- `/api/v1` → Go 后端 (localhost:8080)
- `/api` → PHP 后端 (api.taoboss.com.cn，rewrite 去掉 `/api` 前缀)

## Proposed Changes

### 1. 前端：price/index.vue 列表修改 tab（主要改动）

**文件**: `d:\Workspace\taoboss-vue\src\views\batch-update\price\index.vue`

替换 L366-368 占位内容，实现完整的列表修改 UI：

**模板结构**（参考 Title.vue L18-86）：
```
<el-tab-pane label="列表修改" name="list">
  <FormList ref="formListRef" :withSku="true" :sort="listSort" :order="listOrder"
      :currentPage="listCurrentPage" :pageSize="listPageSize" @loaded="handleListLoaded" />
  <el-table :data="listTableData" row-key="id" ref="listTableRef" @sort-change="handleListSortChange">
    <el-table-column type="index" width="50" :index="listIndexMethod" />
    <el-table-column type="selection" width="55" :reserve-selection="true" />
    <el-table-column width="185"> <!-- 商品图+ID+状态+修改状态 -->
    <el-table-column label="价格修改"> <!-- 一口价 + 各SKU 内联编辑 -->
    <el-table-column label="操作" width="185"> <!-- 保存修改 / 修改记录 -->
  </el-table>
  <el-pagination ... /> <!-- 分页 -->
  <PriceListDetail ref="listDetailRef" :numIid="listDetailNumIid" @recovered="handleListRecovered" />
</el-tab-pane>
```

**"价格修改"列内联编辑设计**（核心 UI）：
- 一口价行：`一口价: ¥{row.price} → [el-input-number v-model="row.newItemPrice"]`
- 各 SKU 行（`v-for="sku in row.skus"`）：
  `{sku.properties_name去前缀}: ¥{sku.price} → [el-input-number v-model="sku.newPrice"]`
- 无 SKU 商品只显示一口价行
- 仅发送 newPrice != originalPrice 的变更项

**script 逻辑**（参考 Title.vue L233-390）：
- 列表状态：`listTableData, listSort, listOrder, listCurrentPage, listPageSize, listTotal`
- `handleListLoaded(data, total)`：填充表格，为每行初始化 `newItemPrice = row.price`，每个 sku 初始化 `newPrice = sku.price`
- `handleListSortChange`、`handleCurrentChange`、`handleSizeChange`：排序/分页
- `listIndexMethod`：跨页序号
- `saveListItem(row, index)`：校验至少有一项变更 → `ensureW2Auth` 预检 → 确认弹窗 → 调 `POST /api/v1/batch-update-price/save-list-detail` → 更新行 `updateStatus/failMsg` + 刷新原价
- `batchListSave()`：获取选中行 → 逐行校验 → 确认弹窗 → 调 `POST /api/v1/batch-update-price/batch-save-list` → `updateListSaveStatus(result)` 按返回更新各行
- `showListDetails(numIid, index)`：打开 `PriceListDetail` 弹窗
- `handleListRecovered(recoveredData)`：恢复后更新行原价

**引入组件**：
- `import FormList from '../FormList.vue'`（同目录已有）
- `import PriceListDetail from './PriceListDetail.vue'`（新建，见下文）

### 2. 前端：FormList.vue 微调（向后兼容）

**文件**: `d:\Workspace\taoboss-vue\src\views\batch-update\FormList.vue`

在 `formatItems` 的 withSku 分支中，给 child 补充 `price` 字段（L144 附近）：
```js
child.price = sku.price  // 新增：价格列表修改需要 SKU 原价
```
此改动向后兼容（Title 不使用 child.price）。同时保留 `item.skus` 原始数组供价格 tab 直接访问。

### 3. 前端：PriceListDetail.vue 新建（修改记录弹窗）

**文件**: `d:\Workspace\taoboss-vue\src\views\batch-update\price\PriceListDetail.vue`

参考 `TitleListDetail.vue` 结构，展示改价修改记录 + 恢复：

**表格列**：
- 修改时间 (datetime)
- 原价格 (originalText — 汇总文本如"一口价:¥100; 红色:¥40; 蓝色:¥55")
- 修改后 (newText — 汇总文本如"一口价:¥120; 红色:¥50; 蓝色:¥60")
- 状态 (success/fail)
- 操作 (恢复按钮)

**API 调用**：
- `POST /api/v1/batch-update-price/get-list-details` `{numIid, page, pageSize}` → 获取记录
- `POST /api/v1/batch-update-price/recover-list-detail` `{id}` → 恢复，成功后 emit `recovered`

### 4. Go 后端：数据模型 + 迁移

**文件**: `D:\Workspace\go\taoboss-go\internal\model\price_task.go`（追加结构体）

新建 `GlyxPriceListDetail` 表模型（列表修改记录表，区别于任务明细表）：
```go
// GlyxPriceListDetail 列表修改改价记录表 (glyx_price_list_detail)
// 每次保存（单行/批量中的一行）产生一条记录，original_data/new_data 存 JSON
type GlyxPriceListDetail struct {
    ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
    SellerNick   string    `gorm:"column:seller_nick;size:100;index" json:"seller_nick"`
    NumIid       string    `gorm:"column:num_iid;size:64;index" json:"num_iid"`
    Title        string    `gorm:"column:title;size:500" json:"title"`
    PicURL       string    `gorm:"column:pic_url;size:255" json:"pic_url"`
    OriginalData string    `gorm:"column:original_data;text" json:"original_data"` // JSON: {"item_price":"100","skus":[{"sku_id":"s1","sku_name":"红色","price":"40"}]}
    NewData      string    `gorm:"column:new_data;text" json:"new_data"`           // JSON: {"item_price":"120","skus":[{"sku_id":"s1","price":"50"}]}
    Status       int       `gorm:"column:status" json:"status"`                   // 1成功 0失败
    Msg          string    `gorm:"column:msg;size:500" json:"msg"`
    Recovered    bool      `gorm:"column:recovered;default:false" json:"recovered"`
    RecoverNum   int       `gorm:"column:recover_num;default:0" json:"recover_num"`
    CreatedAt    time.Time `json:"created_at"`
    UpdatedAt    time.Time `json:"updated_at"`
}

func (GlyxPriceListDetail) TableName() string { return "glyx_price_list_detail" }
```

**JSON 数据结构**（originalData / newData）：
```json
{
  "item_price": "100.00",
  "skus": [
    {"sku_id": "s1", "sku_name": "颜色:红色", "price": "40.00"}
  ]
}
```
- `item_price` 为空字符串表示未修改一口价
- `skus` 数组只包含被修改的 SKU（含 sku_name 供展示，price 为价格）
- 部分失败时，在 JSON 内增加 per-item `status`/`msg` 字段，记录整体 status=0

### 5. Go 后端：Repository 层

**文件**: `D:\Workspace\go\taoboss-go\internal\repository\item_repo.go`（追加方法）或新建 `price_list_repo.go`

新增 `PriceListRepository`（或追加到现有 repo）：
```go
func (r *PriceListRepository) Create(ctx, record *model.GlyxPriceListDetail) error
func (r *PriceListRepository) FindByNumIid(ctx, sellerNick, numIid string, page, pageSize int) ([]*model.GlyxPriceListDetail, int64, error)
func (r *PriceListRepository) FindByID(ctx, id uint) (*model.GlyxPriceListDetail, error)
func (r *PriceListRepository) MarkRecovered(ctx, id uint) error
```

### 6. Go 后端：Request/Response DTO

**文件**: `D:\Workspace\go\taoboss-go\internal\dto\request\batch_update_price_request.go`（追加）

```go
// SaveListDetailRequest 列表修改-单行保存
type SaveListDetailRequest struct {
    NumIid    string             `json:"numIid"`
    ItemPrice string             `json:"itemPrice"` // 新一口价，空=未修改
    Skus      []SkuPriceEditItem `json:"skus"`      // 被修改的 SKU
}
type SkuPriceEditItem struct {
    SkuID string `json:"skuId"`
    Price string `json:"price"` // 新价格
}

// BatchSaveListRequest 列表修改-批量保存
type BatchSaveListRequest struct {
    Rows []SaveListDetailRequest `json:"rows"`
}

// GetListDetailsRequest 列表修改-修改记录查询
type GetListDetailsRequest struct {
    NumIid   string `json:"numIid"`
    Page     int    `json:"page"`
    PageSize int    `json:"pageSize"`
}

// RecoverListDetailRequest 列表修改-恢复
type RecoverListDetailRequest struct {
    ID uint `json:"id"`
}
```

**Response** (`D:\Workspace\go\taoboss-go\internal\dto\response\batch_update_price_response.go` 追加)：
```go
// SaveListDetailResult 单行保存结果
type SaveListDetailResult struct {
    NumIid    string           `json:"numIid"`
    Status    string           `json:"status"`    // success / fail
    FailMsg   string           `json:"failMsg"`
}
```

### 7. Go 后端：Service 层

**文件**: `D:\Workspace\go\taoboss-go\internal\service\price_list_service.go`（新建）

```go
type PriceListService struct {
    itemRepo     *repository.ItemRepository
    listRepo     *repository.PriceListRepository
    priceClient  *service.TaobaoPriceClient
    // ...
}

// SaveListDetail 保存单行改价
// 1. 查商品+SKU（ItemRepository.FindSkusByNumIids / FindSkuProperties）
// 2. 构造 SkuPriceUpdate 列表（仅变更项）+ itemPrice
// 3. 有SKU: UpdateSkuPricesWithItemPrice; 无SKU: UpdateItemPriceOnly
// 4. 记录到 glyx_price_list_detail（original_data/new_data JSON）
// 5. 返回 status + msg
func (s *PriceListService) SaveListDetail(ctx, sellerNick, req) (*response.SaveListDetailResult, error)

// BatchSaveList 批量保存（循环调 SaveListDetail，不并发—淘宝乐观锁）
func (s *PriceListService) BatchSaveList(ctx, sellerNick, req) ([]response.SaveListDetailResult, error)

// GetListDetails 查修改记录
func (s *PriceListService) GetListDetails(ctx, sellerNick, req) ([]*model.GlyxPriceListDetail, int64, error)

// RecoverListDetail 恢复：读记录 JSON → 调淘宝API改回原价 → MarkRecovered
func (s *PriceListService) RecoverListDetail(ctx, sellerNick, req) error
```

**改价逻辑细节**（复用 TaobaoPriceClient）：
- **有SKU商品**：收集变更的 SKU → 构造 `[]SkuPriceUpdate`（Properties 从 `FindSkuProperties` 获取）→ `UpdateSkuPricesWithItemPrice(skus, itemPrice)`
  - 若只改一口价未改SKU：取第一个有库存SKU，用其**原价**构造一条 SkuPriceUpdate（不改SKU价但同步item_price）
  - 若只改部分SKU未改一口价：itemPrice 传空字符串
- **无SKU商品**：`UpdateItemPriceOnly(numIid, newItemPrice)`
- 部分失败处理：per-SKU error 收集，任一失败则记录 status=0，msg 含失败 SKU 详情

### 8. Go 后端：Handler + 路由

**文件**: `D:\Workspace\go\taoboss-go\internal\handler\batch_update_price_handler.go`（追加方法）

新增 4 个 handler 方法：
- `SaveListDetail(c *gin.Context)` — 解析 `SaveListDetailRequest`，从 JWT 取 sellerNick，调 service，返回 `SaveListDetailResult`
- `BatchSaveList(c *gin.Context)` — 解析 `BatchSaveListRequest`，循环调 service，返回结果数组
- `GetListDetails(c *gin.Context)` — 解析 `GetListDetailsRequest`，返回记录列表+total
- `RecoverListDetail(c *gin.Context)` — 解析 `RecoverListDetailRequest`，调 service，返回成功/失败

**文件**: `D:\Workspace\go\taoboss-go\internal\router\router.go`（L53-64 追加路由）
```go
batchPrice.POST("/save-list-detail", h.BatchPrice.SaveListDetail)
batchPrice.POST("/batch-save-list", h.BatchPrice.BatchSaveList)
batchPrice.POST("/get-list-details", h.BatchPrice.GetListDetails)
batchPrice.POST("/recover-list-detail", h.BatchPrice.RecoverListDetail)
```

### 9. 数据库迁移

在 Go 服务启动时 AutoMigrate 中追加 `GlyxPriceListDetail{}`，自动建表 `glyx_price_list_detail`。

## Assumptions & Decisions

1. **列表查询复用 FormList（PHP `/api/item/get-items`）**：商品列表+SKU 数据由 PHP 提供（与标题列表修改一致），无需在 Go 重复实现分页查询。仅需在 FormList.formatItems 中补充 `child.price` 字段（向后兼容）。
2. **保存/恢复走 Go 后端**：复用已有的 `TaobaoPriceClient`、W2 授权预检、ItemRepository，不重复实现淘宝改价逻辑。
3. **修改记录用独立表 `glyx_price_list_detail`**：与任务明细表 `glyx_price_task_detail` 分离，一次保存一条记录（JSON 存所有价格变更），符合标题列表修改"一次保存一条记录"的模式。
4. **一口价独立可编辑**：用户可直接输入新一口价，不强制与 SKU 价格联动（区别于范围修改的 setMinPriceAsPrice 选项）。
5. **仅发送变更项**：前端对比 newPrice vs originalPrice，只把变更的 SKU/一口价发给后端，减少 API 调用。
6. **有SKU商品只改一口价时**：取第一个有库存 SKU 用原价构造 SkuPriceUpdate（不改SKU价），借道 item_price 同步一口价。
7. **批量保存串行执行**：淘宝商品有乐观锁，不同商品间可并行但同商品必须串行；为简化实现，批量保存逐行串行处理。

## Verification Steps

1. **Go 编译+重启**：`go build ./...` 通过，重启服务确认新路由 200（非 404）
2. **前端列表加载**：切换到"列表修改"tab，FormList 筛选查询返回商品+SKU（含价格），表格正确渲染一口价和各SKU行
3. **单行保存**：修改一口价/SKU价格 → 点"保存修改" → W2预检 → 确认弹窗 → 调API → 行状态更新为成功/失败
4. **批量保存**：勾选多行 → 修改价格 → "批量保存修改" → 确认弹窗 → 各行状态更新
5. **修改记录**：点"修改记录" → 弹窗展示历史记录 → 分页正常
6. **恢复**：点"恢复" → 原价回写 → 表格行原价更新
7. **无SKU商品**：只显示一口价行，保存走 `UpdateItemPriceOnly`
8. **边界校验**：未修改任何价格时提示"无需修改"；W2 过期时弹授权窗
