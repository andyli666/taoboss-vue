# 批量修改其他（other）后端接口需求

> 前端页面已开发完成：`/batch-update/other`（批量修改 → 修改其他）。
> 本文档列出前端当前实际调用的全部接口、请求/响应字段，以及后端需要实现的淘宝侧逻辑，后端按此实现即可联调。
> 整体链路复用现有「批量修改库存 / 类目属性」：范围修改 → 预览 → 立即/定时任务 → 2 秒轮询进度 → 修改记录 → 成功恢复 / 失败重试。

## 一、通用约定

- 路由前缀：`/api/v1/batch-update-other`
- 统一响应结构：

```json
{
  "code": 0,
  "msg": "",
  "data": {}
}
```

- `code = 0` 表示成功，非 0 时前端直接展示 `msg`。
- 限额超限沿用现有约定返回 `code = 4031`（`request.js` 已有全局弹窗）。
- 字段命名使用 camelCase（Go struct 显式写 json tag）。
- 本功能修改的是商品普通字段，非 W2 安全级接口，前端不做 W2 授权预检（与改标题 / 改库存 / 改类目属性一致）。
- 本功能只有「范围修改」，没有「列表修改」。

***

## 二、修改字段与淘宝 schema 映射

字段定义来自 `schema.xml`（`d:\Workspace\go\taoboss-go\schema.xml`）：

| 页面名称       | schema 字段 id       | 类型          | 取值                                 | 备注                        |
| ---------- | ------------------ | ----------- | ---------------------------------- | ------------------------- |
| 库存扣减方式     | `subStock`         | singleCheck | `1` = 拍下减库存，`0` = 付款减库存            | schema 默认值 `1`            |
| 保修服务       | `warranty`         | singleCheck | `1` = 有，`0` = 无                    | 页面展示为「无 / 有」，提交值映射为 0 / 1 |
| 服务承诺【7天退货】 | `sevenDayOptional` | singleCheck | `true` = 是，`false` = 否             | 见下方说明                     |
| 物流体积       | `deliverVolumn`    | input       | 文本，单位 m³（schema `unitTypeRule=立方`） | 留空表示清空                    |
| 物流重量       | `deliverWeight`    | input       | 文本，单位 kg（schema `unitTypeRule=千克`） | 留空表示清空                    |

**7天退货说明**

- 页面固定使用 `sevenDayOptional`（可支持七天退货），不要修改 `sevenDaySupport`（该类目必须支持，schema 中 `readOnlyRule=true`）。
- 如果商品 schema 中只有 `sevenDaySupport` 而没有 `sevenDayOptional`，说明该类目必须支持 7 天退货，无法取消：该商品按「跳过」处理，`skipMsg = "该类目必须支持7天退货，无法修改"`。
- 页面 tooltip 文案已与需求一致：选择只是其中一个因素，最终以类目和属性条件由淘宝判断。

**取值格式**

- `subStock`、`warranty`、`sevenDayOptional` 提交时统一按**字符串**处理：`"1" / "0"`、`"true" / "false"`。
- `deliverVolumn`、`deliverWeight` 按用户输入的原始文本提交（不自动补单位，单位由淘宝 schema 决定）。空字符串表示清空已有值。前端已限制只能输入正数：物流重量最多 3 位小数、物流体积最多 6 位小数，非法字符无法输入；后端仍需校验必须为大于 0 的数。

***

## 三、接口清单

### 1. 预览修改结果

```
POST /api/v1/batch-update-other/preview
```

**请求体**

```json
{
  "filterForm": {
    "approveStatus": "onsale",
    "shopCategory": null,
    "numIid": [],
    "exceptNumIid": [],
    "exceptTitle": [],
    "title": "",
    "priceStart": null,
    "priceEnd": null
  },
  "updateContentForm": {
    "subStock": {
      "enabled": true,
      "mode": "replace",
      "unifiedValue": "1",
      "currentValue": "0",
      "targetValue": "1"
    },
    "warranty": { "enabled": true, "value": "1" },
    "sevenDayOptional": { "enabled": true, "value": "false" },
    "deliverVolumn": { "enabled": false, "value": "" },
    "deliverWeight": { "enabled": false, "value": "" }
  }
}
```

**`updateContentForm`** **字段说明**

| 字段                       | 说明                                            |
| ------------------------ | --------------------------------------------- |
| `xxx.enabled`            | 页面是否勾选了该内容；**只有 enabled=true 的字段才参与修改/预览**    |
| `subStock.mode`          | `unified` = 统一替换；`replace` = 选择替换             |
| `subStock.unifiedValue`  | 统一替换时统一改成的值（`1` 拍下 / `0` 付款），mode=unified 时有效 |
| `subStock.currentValue`  | 选择替换时「将当前是」的值，mode=replace 时有效                |
| `subStock.targetValue`   | 选择替换时「的修改为」的值，mode=replace 时有效                |
| `warranty.value`         | `1` 有 / `0` 无                                 |
| `sevenDayOptional.value` | `"true"` 是 / `"false"` 否                      |
| `deliverVolumn.value`    | 物流体积文本，空字符串表示清空                               |
| `deliverWeight.value`    | 物流重量文本，空字符串表示清空                               |

> 未勾选的字段前端也会带上默认值（`enabled=false`），后端一律以 `enabled` 判断是否生效，不要根据 `value` 是否为空来判断。

**响应 data**

```json
{
  "rows": [
    {
      "numIid": "12345678",
      "title": "商品标题",
      "picUrl": "https://img.alicdn.com/...",
      "approveStatus": "onsale",
      "hasChange": true,
      "skipMsg": "",
      "changes": [
        { "propName": "库存扣减方式", "oldValue": "付款减库存", "newValue": "拍下减库存" },
        { "propName": "保修服务", "oldValue": "无", "newValue": "有" }
      ]
    },
    {
      "numIid": "87654321",
      "title": "商品标题2",
      "picUrl": "https://img.alicdn.com/...",
      "approveStatus": "onsale",
      "hasChange": false,
      "skipMsg": "内容没有变化，将跳过",
      "changes": []
    }
  ]
}
```

| 字段                                   | 说明                                                           |
| ------------------------------------ | ------------------------------------------------------------ |
| `numIid`                             | 商品 ID（字符串）                                                   |
| `title` / `picUrl` / `approveStatus` | 商品标题、主图、上架状态，与现有批量修改预览一致                                     |
| `hasChange`                          | 是否实际有变化（决定是否计入可修改数）                                          |
| `skipMsg`                            | `hasChange=false` 时展示的跳过原因                                   |
| `changes`                            | 变化明细，`propName` 用中文名；`oldValue` / `newValue` 用**中文显示值**（见下表） |

**changes 显示值转换（后端负责转成中文）**

| 字段                  | oldValue / newValue 显示值     |
| ------------------- | --------------------------- |
| 库存扣减方式              | `1` → `拍下减库存`；`0` → `付款减库存` |
| 保修服务                | `1` → `有`；`0` → `无`         |
| 服务承诺【7天退货】          | `true` → `是`；`false` → `否`  |
| 物流体积(m³) / 物流重量(kg) | 原文本；空值返回空字符串，前端展示为「空」       |

<br />

***

### 2. 创建修改任务

```
POST /api/v1/batch-update-other/create-task
```

#### 2.1 立即修改

请求体与预览一致：

```json
{
  "filterForm": { "...": "同预览" },
  "updateContentForm": { "...": "同预览" }
}
```

响应：

```json
{ "code": 0, "data": { "taskId": 456 } }
```

#### 2.2 恢复（修改记录弹窗）

```json
{
  "action": "recover",
  "recordId": 123,
  "detailIds": [1, 2, 3],
  "exceptRecovered": false
}
```

#### 2.3 重试（修改记录弹窗）

```json
{
  "action": "retry",
  "recordId": 123,
  "detailIds": [1, 2, 3]
}
```

- `detailIds` 不传表示「全部恢复 / 全部重试」。
- 恢复：按明细记录中保存的原值改回去；只处理 `status=1` 且 `recovered=false`（`exceptRecovered=true` 时排除已恢复）的明细。
- 重试：只处理 `status=0`（失败）的明细。
- 恢复/重试不产生新任务记录，直接复用源任务并重新统计状态；执行前把源任务置为 `running`，防止并发重复操作。
- 响应：`data.taskId`（数字或字符串均可，前端只透传给进度接口）。

**创建任务时的后端逻辑**

1. 按 `filterForm` 查询商品，逐商品取原值（可放到异步执行阶段做），按第二节规则计算实际变更；无变化的商品不提交淘宝。
2. 创建任务表、明细表（商品级一行，明细中保存本次要改的字段 JSON 和原值 JSON，供恢复使用）。
3. 检查限额：`CheckQuotaByCount(本次可修改商品数)`，超限返回 `4031`；今日用量按本功能任务表 `SUM(changed)` 统计。
4. 立即返回 `taskId`，后台异步执行，前端 2 秒轮询进度。

***

### 3. 创建定时任务

```
POST /api/v1/batch-update-other/create-scheduled-task
```

**请求体**

```json
{
  "filterForm": { "...": "同预览" },
  "updateContentForm": { "...": "同预览" },
  "taskTime": "2026-11-05 10:00:00",
  "repeat": 0
}
```

- `repeat`：0 不重复、1 每天、2 每周、3 工作日、4 周末。
- `taskTime`：`YYYY-MM-DD HH:mm:ss`，前端已校验必须晚于当前时间。
- 响应只需 `code = 0`，前端弹「定时任务创建成功」。
- 待执行（pending）任务服务重启后自动重新执行；执行中（running）不自动重跑（与现有定时任务一致）。

***

### 4. 查询任务进度

```
GET /api/v1/batch-update-other/task-progress?task_id=456
```

**响应 data**

```json
{
  "status": "running",
  "progress": 45,
  "total": 10,
  "success": 5,
  "fail": 1,
  "skip": 0,
  "message": ""
}
```

| 字段                      | 说明                               |
| ----------------------- | -------------------------------- |
| status                  | `running` / `complete` / `error` |
| progress                | 0\~100 整数                        |
| total/success/fail/skip | **商品级**统计（一个商品算 1，即使修改多个字段）      |
| message                 | 完成后提示文案，如“成功 5 个，失败 1 个，跳过 0 个”  |

> 前端在 `complete` / `error` 时停止轮询，刷新修改记录和限额。
> 恢复/重试任务的进度按选中的明细统计，不能返回源任务创建时的总数。

***

### 5. 版本限额状态

```
GET /api/v1/batch-update-other/quota-status
```

**响应 data**

```json
{
  "planName": "专业版",
  "singleTaskCap": 1000,
  "dailyLimit": 5000,
  "dailyUsed": 120,
  "dailyRemain": 4880
}
```

- 与批量改价/改标题共用 `plans` 配置。
- `dailyLimit = 0` 表示今日不限量。

***

### 6. 范围修改记录列表

```
POST /api/v1/batch-update-other/get-shop-record
```

**请求体**

```json
{ "page": 1, "pageSize": 10 }
```

**响应 data**

```json
{
  "rows": [
    {
      "id": 123,
      "datetime": "2026-11-04 10:00:00",
      "status": "complete",
      "updateRangeText": "上架状态：出售中<br>...",
      "updateContentText": "库存扣减方式：付款减库存 → 拍下减库存<br>保修服务：无 → 有",
      "total": 10,
      "success": 9,
      "fail": 1,
      "skip": 0
    }
  ],
  "total": 20,
  "activeCount": 1
}
```

- `status`：`pending / running / complete / partial / failed / cancel`，前端已做中文映射。
- `activeCount > 0` 时前端每 30 秒自动刷新记录列表。
- `updateRangeText`、`updateContentText` 允许 HTML（前端用 `v-html` 展示），与现有批量修改记录一致。

***

### 7. 修改记录明细

```
POST /api/v1/batch-update-other/get-shop-record-details
```

**请求体**

```json
{
  "recordId": 123,
  "status": 1,
  "page": 1,
  "pageSize": 10
}
```

- `status`：`1` 成功、`0` 失败、`-1` 跳过。

**响应 data**

```json
{
  "rows": [
    {
      "id": 1,
      "numIid": "12345678",
      "title": "商品标题",
      "picUrl": "https://img.alicdn.com/...",
      "status": 1,
      "recovered": false,
      "recoverNum": 0,
      "msg": "",
      "changes": [
        { "propName": "库存扣减方式", "oldValue": "付款减库存", "newValue": "拍下减库存" }
      ],
      "changeText": ""
    }
  ],
  "total": 10
}
```

| 字段           | 说明                           |
| ------------ | ---------------------------- |
| `changes`    | 修改明细（失败/跳过时也返回，便于用户查看计划修改内容） |
| `changeText` | 可选，无 changes 时的 HTML/文本兜底    |
| `recoverNum` | 已恢复成功次数，成功页展示「已恢复成功 N 次」     |
| `msg`        | 失败原因 / 最近一次恢复信息 / 跳过原因       |

***

## 四、后端执行逻辑（淘宝 API）

### 1. 原值获取

- `alibaba.item.edit.schema.get`（参数 `item_id`），返回 XML 中按字段 id 取 `<value>`：
  - `subStock`、`warranty`、`sevenDayOptional`、`deliverVolumn`、`deliverWeight`。
- 该接口逐一调用成本较高，务必复用现有全局 20 QPS 节流和 `FetchItemSchemas`；预览限制商品数（建议 200）。
- 同一商品同一轮任务内只取一次原值。

### 2. 提交修改

走alibaba.item.edit.submit接口

### 3. 成功后的本地同步

- `subStock` / `warranty` 若本地 `glyx_item` 有对应字段可同步；当前表没有这些列，可不做本地同步（下次预览仍以 schema.get 原值为准）。
- `deliverVolumn` / `deliverWeight` 不在商品列表同步字段内，不需要改本地表。

### 4. 恢复/重试

- 明细表保存本次修改的字段新值和**修改前原值**（JSON）。
- 恢复时查询新shema并按原值构造 schema 改回去；原值为空表示恢复为空（清空）。
- 重试只针对失败明细，重新取原值后按任务保存的新值提交。

***

## 五、前端交互约定（后端需知）

1. **库存扣减方式两个下拉自动取反**（仅 `mode=replace` 时）：
   - 两个下拉初始为空；用户选择任一项后，另一项自动变为相反的值：
   - 「将当前是」选「拍下减库存」→「的修改为」自动变为「付款减库存」；
   - 「的修改为」选「拍下减库存」→「将当前是」自动变为「付款减库存」；
   - 因此正常提交时 `currentValue` 和 `targetValue` 必然不同；前端仍保留「两者必须选择且不能相同」的校验。
2. **勾选才生效**：未勾选的内容不参与预览和修改，即使它有默认值。
3. **物流体积/重量留空 = 清空**：前端允许空串提交，后端必须按「清空」处理，不能当作「未填写、跳过」。
4. **物流体积/重量只允许正数**：前端输入框实时过滤非法字符（字母、负号等无法输入），小数位上限为物流重量 3 位、物流体积 6 位（超出无法继续输入）；提交前校验数值必须大于 0。后端按同样规则做兜底校验。
5. **列表修改不存在**：所有修改都走范围筛选，后端无需提供 save-list-detail / batch-save-list 接口。

***

## 六、前端调用时序

| 步骤 | 方法   | 接口                                                   | 触发时机                     |
| -- | ---- | ---------------------------------------------------- | ------------------------ |
| 1  | GET  | `/api/v1/batch-update-other/quota-status`            | 进入页面                     |
| 2  | POST | `/api/v1/batch-update-other/preview`                 | 点击「预览修改结果」               |
| 3  | POST | `/api/v1/batch-update-other/create-task`             | 点击「开始修改」/ 恢复 / 重试        |
| 4  | POST | `/api/v1/batch-update-other/create-scheduled-task`   | 定时修改时点击「创建定时任务」          |
| 5  | GET  | `/api/v1/batch-update-other/task-progress`           | 任务创建后每 2 秒轮询             |
| 6  | POST | `/api/v1/batch-update-other/get-shop-record`         | 进入页面 / 任务完成 / 每 30 秒自动刷新 |
| 7  | POST | `/api/v1/batch-update-other/get-shop-record-details` | 点击记录「查看」/ 切换成功、出错、跳过 tab |

> 商品筛选使用现有接口 `POST /api/item/get-items`（前端 `FormShop` 组件），无需新增。

***

## 七、联调自测清单

1. 只勾选「保修服务 = 有」，预览能返回「无 → 有」，创建任务后进度正常结束。
2. 库存扣减方式「选择替换」：`currentValue=0`（付款）、`targetValue=1`（拍下）时，只修改原值为付款减库存的商品；原值为拍下的商品 `hasChange=false`。
3. 库存扣减方式「统一替换」：所有商品统一改为目标值，原值相同的商品跳过。
4. 物流体积/重量留空：预览显示「原值 → 空」，执行后淘宝侧清空成功。
5. 7 天退货：`sevenDayOptional` 存在时可改；只有 `sevenDaySupport`（只读）的商品返回跳过及原因。
6. 恢复：成功页恢复后，商品原值回到修改前；重试：失败商品可再次提交。
7. 定时任务：`repeat`、`taskTime` 正确落库，到点执行并在记录中可查看进度。
8. 限额：超过 `singleTaskCap` 或当日剩余额度时，创建任务返回 `4031`，前端弹限额提示。

