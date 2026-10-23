# 批量修改类目属性（catProp）后端接口需求

> 前端页面已开发完成：`/batch-update/cat-prop`（批量修改 → 修改类目属性）。
> 本文档列出前端当前实际调用的全部接口、请求/响应字段和后端需要补齐的逻辑，后端按此实现即可联调。
> 整体模式完全复用「批量修改标题」（异步任务 + 2 秒轮询进度 + 修改记录 + 恢复/重试）。

## 一、通用约定

- 路由前缀：`/api/v1/batch-update-cat-prop`
- 统一响应结构：

```json
{
  "code": 0,
  "msg": "",
  "data": {}
}
```

- `code = 0` 表示成功，非 0 时前端直接展示 `msg`。
- 限额超限沿用现有约定返回 `code = 4031`（前端 `request.js` 已有全局弹窗）。
- 字段命名使用 camelCase（Go struct 显式写 json tag）。
- 本功能修改的是商品类目属性字段 `catProp`，非 W2 安全级接口，前端不做 W2 授权预检（与改标题/导购标题一致）。

---

## 二、接口清单

### 1. 获取模板商品可修改属性

```
GET /api/v1/batch-update-cat-prop/props?numIid=12345678
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| numIid | string | 是 | 模板商品 ID |

**响应 data**

```json
{
  "numIid": "12345678",
  "cid": 50008045,
  "categoryName": "鹿茸",
  "title": "模板商品标题",
  "schemaXml": "<field id=\"catProp\" name=\"类目属性\" type=\"complex\">...</field>"
}
```

| 字段 | 说明 |
| --- | --- |
| cid | 模板商品类目 ID，前端仅展示/透传，不参与解析 |
| categoryName | 类目名称，可选；有值时前端展示“（类目：xxx）” |
| title | 模板商品标题，可选；有值时前端展示“模板商品：xxx” |
| schemaXml | **必填，原始 schema XML 字符串**，前端自行解析 |

**后端实现建议**

1. 从本地库 `glyx_item` 取商品标题和类目 ID（需新增 `cid` 列，见第五节），本地没有时回退 `taobao.item.get`（`fields=cid,title`）。
2. 调 `alibaba.item.edit.schema.get`（参数 `item_id`），返回结构为 `{ "result": "<schema xml>" }`。
3. 从 `result` 中提取 `<field id="catProp">...</field>` 返回。如果没有该字段，返回 `code != 0`，`msg = "该商品类目暂不支持修改类目属性"`。
4. `schemaXml` 原样返回即可，不要做 HTML 转义；JSON 序列化会自动处理引号。淘宝返回的 `tipRule` 中可能带未转义的 `<a>` 标签，前端已做兼容。

**schema 结构（前端解析约定）**

前端从 `<fields>` 读取属性定义（`type`、`rules`、`options`、`properties` 中的单位/提示），从 `<complex-value>` 读取当前默认值：

```xml
<field id="catProp" name="类目属性" type="complex">
  <rules>...</rules>
  <complex-value>
    <field id="p-192256048" name="储存条件" type="singleCheck">
      <value inputValue="冷藏">11455246</value>
    </field>
    <field id="p-147956252" name="净含量" type="input">
      <value>24g</value>
    </field>
    <field id="p-122216499" name="种类" type="singleCheck">
      <value inputValue="其他">14863995</value>
    </field>
  </complex-value>
  <fields>
    <field id="p-192256048" name="储存条件" type="singleCheck">
      <options>
        <option displayName="常温" value="10252754"/>
        <option displayName="冷藏" value="11455246"/>
      </options>
    </field>
    <field id="p-147956252" name="净含量" type="input">
      <rules>
        <rule name="requiredRule" value="true"/>
        <rule name="maxLengthRule" value="40" exProperty="include" unit="byte"/>
        <rule name="tipRule" value="格式为 :值单位，单位为g，输入的值必须为整数"/>
      </rules>
      <properties>
        <property key="147956252" value="净含量" type="taoSirProperty">
          <unitNames><unitName value="g"/></unitNames>
          <tip value="输入的值必须为整数"/>
        </property>
      </properties>
    </field>
    <field id="p-122216499" name="种类" type="singleCheck">
      <options>...</options>
    </field>
  </fields>
</field>
```

前端已支持：

- `input`、`multiInput`、`singleCheck`、`multiCheck`
- `complex` 子字段递归展平；`multiComplex` 暂不展示
- `requiredRule`、`readOnlyRule`、`disableRule` + `depend-group`、`maxLengthRule`、`minLengthRule`、`maxValueRule`、`minValueRule`、`maxInputNumRule`、`minInputNumRule`、`regxRule`、`valueTypeRule`、`tipRule`
- `options` / `values`
- `properties` 中的单位（如 `g`）和提示

---

### 2. 预览修改结果

```
POST /api/v1/batch-update-cat-prop/preview
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
  "templateNumIid": "12345678",
  "props": [
    {
      "id": "p-147956252",
      "name": "净含量",
      "type": "input",
      "value": "24g",
      "valueText": "24g"
    },
    {
      "id": "p-192256048",
      "name": "储存条件",
      "type": "singleCheck",
      "value": "11455246",
      "valueText": "冷藏"
    },
    {
      "id": "p-122216499",
      "name": "种类",
      "type": "multiCheck",
      "value": ["110122", "110123"],
      "valueText": "鹿茸片、鹿茸枝"
    }
  ]
}
```

> `filterForm` 与批量修改标题的预览完全一致，可直接复用现有商品筛选逻辑。
> `props` 只包含用户勾选（要修改）的属性；未勾选的属性不会提交。
> `value` 为提交值：单选/多选是 option 的 `value`（多选为数组），输入型是文本；`valueText` 只用于列表展示和后端生成记录文案。

**响应 data**

```json
{
  "rows": [
    {
      "numIid": "22334455",
      "title": "商品标题",
      "picUrl": "https://img.alicdn.com/...",
      "approveStatus": "onsale",
      "cid": 50008045,
      "categoryName": "鹿茸",
      "hasChange": true,
      "skipMsg": "",
      "changes": [
        {
          "propId": "p-147956252",
          "propName": "净含量",
          "oldValue": "20g",
          "newValue": "24g"
        }
      ]
    },
    {
      "numIid": "44556677",
      "title": "属性本来就一样的商品",
      "picUrl": "https://img.alicdn.com/...",
      "approveStatus": "onsale",
      "cid": 50008045,
      "categoryName": "鹿茸",
      "hasChange": false,
      "skipMsg": "属性没有变化",
      "changes": []
    },
    {
      "numIid": "33445566",
      "title": "其他类目商品",
      "picUrl": "https://img.alicdn.com/...",
      "approveStatus": "instock",
      "cid": 50008046,
      "categoryName": "其他类目",
      "hasChange": false,
      "skipMsg": "类目与模板商品不一致",
      "changes": []
    }
  ]
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| numIid / title / picUrl / approveStatus | 是 | 商品信息，与原批量修改一致 |
| cid / categoryName | 否 | 商品类目，前端展示 |
| hasChange | 是 | true 显示“待修改”，false 显示“无变化” |
| skipMsg | 否 | `hasChange=false` 时的原因，前端灰色小字展示 |
| changes | 是 | 该商品将要修改的属性列表；无变化时返回 `[]` |
| changes[].propId / propName | 是 | 属性 ID / 名称 |
| changes[].oldValue / newValue | 是 | 原值 / 新值（展示文案）。**oldValue 必须取自该商品 schema 的真实原值**：singleCheck/multiCheck 映射 option 的 `displayName`（多选用「、」拼接），input 用原文（如 `24g`）；仅当属性原本无值时才传空字符串（前端此时显示「空」） |

**后端实现建议**

1. 按 `filterForm` 查询商品（复用标题预览的查询与分页口径）。
2. 数量上限：筛选结果数超过阈值（建议 200，可按实际接口耗时调整，上限不超过 `singleTaskCap`）时直接返回 `code != 0`，msg 提示缩小筛选范围。预览要**同步逐商品调淘宝 API 取原值**，商品太多会超过前端 60 秒超时（按 20 QPS 全局节流估算）。
3. 只保留与模板商品 `cid` 相同的商品；类目不同的返回 `hasChange=false`、`skipMsg="类目与模板商品不一致"`，不调 schema 接口。
4. **对每个商品调 `alibaba.item.edit.schema.get`（`item_id`，一商品一次调用）**，从返回 XML 的 `<complex-value>` 中解析勾选属性的原值；复用现有 throttle 节流；结果按 `numIid` 缓存（同一商品重复预览不重复调用）。同类目的 schema 定义（`<fields>`/options）可按 `cid` 缓存，但 `<complex-value>` 是商品维度的，不能跨商品复用。
5. 对比规则：`input` 按文本比较（注意统一「值单位」格式，如 `24g`）；`singleCheck` 按 option 的 `value`（vid）；`multiCheck` 按集合比较。勾选的属性全部无变化 → `hasChange=false`、`skipMsg="属性没有变化"`、`changes=[]`；部分变化 → `changes` 只包含有变化的属性。
6. 调用失败兜底：某商品 `schema.get` 失败时返回 `hasChange=false`、`skipMsg="属性原值获取失败，请重试"`。**不要把取不到的原值当空值处理**，否则预览会显示「空 → 新值」误导用户（属性实际有值），也会导致无变化判断失效。

---

### 3. 创建修改任务

```
POST /api/v1/batch-update-cat-prop/create-task
```

#### 3.1 立即修改

请求体与预览一致：

```json
{
  "filterForm": { "...": "同预览" },
  "templateNumIid": "12345678",
  "props": [ "... 同预览" ]
}
```

响应：

```json
{ "code": 0, "data": { "taskId": 456 } }
```

#### 3.2 恢复（修改记录弹窗）

```json
{
  "action": "recover",
  "recordId": 123,
  "detailIds": [1, 2, 3],
  "exceptRecovered": false
}
```

#### 3.3 重试（修改记录弹窗）

```json
{
  "action": "retry",
  "recordId": 123,
  "detailIds": [1, 2, 3]
}
```

- `detailIds` 不传表示“全部恢复/全部重试”。
- 恢复：按明细记录的原值把属性改回去；只处理 `status=1` 且 `recovered=false`（`exceptRecovered=true` 时排除已恢复）的明细。
- 重试：只处理 `status=0`（失败）的明细。
- 恢复/重试不产生新任务记录，直接复用源任务并重新统计状态（与标题功能一致）。
- 恢复/重试执行前把源任务置为 `running`，防止并发重复操作。

**响应**：`data.taskId`（数字或字符串均可，前端只透传给进度接口）。

**创建任务时的后端逻辑**

1. 按 `filterForm` 查询商品，过滤 `cid = 模板商品 cid`。
2. 创建任务表、明细表（商品级一行，明细中保存本次要改的属性 JSON、原值 JSON）。
3. 检查限额：`CheckQuotaByCount(本次可修改商品数)`，超限返回 `4031`；今日用量口径沿用标题功能（任务表 `SUM(changed)`，本功能没有列表保存记录）。
4. 立即返回 `taskId`，后台异步执行，前端 2 秒轮询进度。
5. 执行阶段与预览同口径：每个商品先调 `schema.get` 取原值，原值与新值完全一致的商品跳过（`status=-1`、`msg="属性没有变化"`，不计入 `changed`），只对真有变化的商品提交淘宝（见三、2 节）；创建任务时可以先不取原值（数量大时取原值耗时长），统一放到异步执行阶段做。

---

### 4. 创建定时任务

```
POST /api/v1/batch-update-cat-prop/create-scheduled-task
```

**请求体**

```json
{
  "filterForm": { "...": "同预览" },
  "templateNumIid": "12345678",
  "props": [ "... 同预览" ],
  "taskTime": "2026-10-22 10:00:00",
  "repeat": 0
}
```

- `repeat`：0 不重复、1 每天、2 每周、3 工作日、4 周末。
- `taskTime`：`YYYY-MM-DD HH:mm:ss`。
- 响应只需 `code = 0`，前端弹“定时任务创建成功”。
- 待执行（pending）任务在服务重启后自动重新执行；执行中（running）不自动重跑（与标题功能一致）。

---

### 5. 查询任务进度

```
GET /api/v1/batch-update-cat-prop/task-progress?task_id=456
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

| 字段 | 说明 |
| --- | --- |
| status | `running` / `complete` / `error` |
| progress | 0~100 整数 |
| total/success/fail/skip | **商品级**统计（一个商品算 1，即使修改多个属性） |
| message | 完成后提示文案，如“成功 5 个，失败 1 个，跳过 0 个” |

> 前端在 `complete` / `error` 时停止轮询，刷新修改记录和限额。
> 恢复/重试任务的进度也要按 `action` 选中的明细统计，不能返回源任务创建时的总数（标题功能已有实现，可复用）。

---

### 6. 版本限额状态

```
GET /api/v1/batch-update-cat-prop/quota-status
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
- 今日用量建议按 catProp 自己的任务表统计：`SUM(changed)`（仅成功数）。
- `dailyLimit = 0` 表示今日不限量。

---

### 7. 范围修改记录列表

```
POST /api/v1/batch-update-cat-prop/get-shop-record
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
      "datetime": "2026-10-21 10:00:00",
      "status": "running",
      "updateRangeText": "上架状态：出售中<br>...",
      "updateContentText": "净含量：24g<br>储存条件：冷藏",
      "total": 10,
      "success": 5,
      "fail": 1,
      "skip": 0
    }
  ],
  "total": 1,
  "activeCount": 1
}
```

| 字段 | 说明 |
| --- | --- |
| status | `pending` / `running` / `complete` / `partial` / `failed` / `cancel` |
| updateContentText | 修改内容，允许 HTML，前端用 `v-html` 展示；由后端根据属性名和值生成，如 `净含量：24g` |
| activeCount | 待执行/执行中的任务数；>0 时前端每 30 秒自动刷新列表 |

> `partial` 表示部分成功，前端用橙色“部分成功”标签展示，不要归并为 `complete`。

---

### 8. 修改记录明细

```
POST /api/v1/batch-update-cat-prop/get-shop-record-details
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
      "id": 1001,
      "numIid": "22334455",
      "title": "商品标题",
      "picUrl": "https://img.alicdn.com/...",
      "changes": [
        {
          "propId": "p-147956252",
          "propName": "净含量",
          "oldValue": "20g",
          "newValue": "24g"
        }
      ],
      "changeText": "",
      "msg": "",
      "recoverNum": 0,
      "recovered": false
    }
  ],
  "total": 1
}
```

| 字段 | 说明 |
| --- | --- |
| changes | 推荐返回；前端逐行展示“属性：原值 → 新值” |
| changeText | 可选兜底；`changes` 为空时前端用 `v-html` 展示 |
| msg | 失败原因 / 跳过原因 |
| recoverNum | 已恢复次数 |
| recovered | 是否已恢复（用于“排除之前恢复成功的”与隐藏重复恢复入口） |

### 9. 省份/城市级联（前端静态配置，无需后端接口）

省市级联不依赖后端接口，由前端静态配置实现：

- 城市选项来自前端 `chinaCities.js`（中国行政区划数据，按省份名称映射城市列表）
- 省份选项仍来自模板商品 schema
- 省份切换为**直辖市**（北京/上海/天津/重庆）或**其他**时，前端自动隐藏「城市」属性并清空其勾选与值
- 其余省份切换时，城市下拉选项自动刷新为该省的城市列表
- 城市控件为可搜索下拉，且支持手填（经验证，提交城市中文名淘宝可接受并修改成功）

> 历史方案：曾计划用 `alibaba.item.publish.props.get` / `taobao.itempropvalues.get` 动态拉取城市列表，但前者属于「商品发布高级包」（本应用无权限），后者官方不可用，故改前端静态配置。

---

## 三、后端执行逻辑（淘宝 API）

### 1. 判断是否同类目

- **推荐**：给 `glyx_item` 增加 `cid` 列，增量同步 `fields` 增加 `cid`（`taobao.items.onsale.get` / `inventory.get` 返回的 item 有 `Cid` 字段，改动很小）。预览/执行时直接 `cid = 模板 cid` 过滤，无需额外 API。
- 不新增 `cid` 列时，只能对候选商品逐个调 `taobao.item.get`（`fields=cid`）判断，商品多时性能不可接受。

模板商品 cid：

1. 本地库有 `cid` 直接取；
2. 否则 `taobao.item.get`（`fields=cid,title`）。

### 2. 取属性和原值

- 获取属性定义：`alibaba.item.edit.schema.get`（`item_id`）→ `result` 即 schema XML。
- 执行阶段建议每个商品先调一次 `schema.get`，从 `<complex-value>` 中取本次要改属性的原值：
  - 用于明细的“原值”、记录文案；
  - 用于“恢复”功能；
  - 如果原值与新值完全一致，标记为跳过（`status=-1`，`msg="属性没有变化"`）。
- 同一类目的 schema 定义（`<fields>`）可按 `cid` 缓存；`<complex-value>` 是商品维度的，不能跨商品复用。

### 3. 提交修改

优先使用 `alibaba.item.edit.fastupdate`，schema 结构与改标题/改库存一致，根节点是 `<itemRule>`：

```xml
<?xml version="1.0" encoding="utf-8"?>
<itemRule>
  <field id="catProp" name="类目属性" type="complex">
    <complex-value>
      <field id="p-192256048" name="储存条件" type="singleCheck">
        <value>10252754</value>
      </field>
      <field id="p-147956252" name="净含量" type="input">
        <value>24g</value>
      </field>
      <field id="p-122216499" name="种类" type="singleCheck">
        <value>14863995</value>
      </field>
    </complex-value>
  </field>
</itemRule>
```

- `input` / `multiInput`：文本放 `<value>`，用 `xml.EscapeText` 转义。
- `singleCheck`：`<value>` 放 option 的 `value`。
- `multiCheck`：每个选中值一个 `<value>`。
- **只提交用户勾选的属性字段**，未勾选的不放进 `complex-value`。
- `catProp` 是 complex 类型。如果 `fastupdate` 返回类似导购标题的 `PUB_ADAPTER_PARSEDATA` / `isp.system-service-error`（不支持 complex 字段），降级为：
  1. `alibaba.item.edit.schema.get` 取完整编辑 schema；
  2. 修改其中 `catProp` 的 `complex-value`；
  3. 调 `alibaba.item.edit.submit` 全量提交（与导购标题 `UpsertInterest` 的做法一致）。

### 4. 并发与重试

- 同一商品的修改必须串行（与改价/改标题共享 per-item mutex）。
- 遇到 `IC_OPTIMISTIC_LOCKING_CONFLICT` 等待 200ms 重试一次（可复用现有实现）。
- 单个商品失败不影响其他商品，失败原因写入明细 `msg`。

### 5. 恢复 / 重试

- 恢复：按明细里保存的原值 JSON 重新提交；原值为空（原本没有该属性）时，该属性恢复时跳过。
- 重试：按明细里保存的新值 JSON 重新提交。
- 恢复/重试成功后同步刷新明细状态、任务状态、`changed`、今日用量；源任务状态按明细重新判定（全部成功=complete，部分成功=partial，全部失败=failed）。
- 已恢复的明细 `recovered=true`、`recover_num+1`，防止重复恢复。

### 6. 成功后本地库

类目属性当前没有存本地库，修改成功后不需要更新 `glyx_item` 的属性字段；`cid/title/pic_url` 等基础信息不受影响。

---

## 四、数据库表建议

表结构与 `glyx_title_task` / `glyx_title_task_detail` 对齐，仅字段差异如下：

```sql
CREATE TABLE glyx_cat_prop_task (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  seller_nick VARCHAR(100) NOT NULL DEFAULT '',
  execute_mode VARCHAR(20) NOT NULL DEFAULT 'immediate',
  task_time DATETIME NULL,
  repeat_type TINYINT NOT NULL DEFAULT 0,
  template_num_iid VARCHAR(50) NOT NULL DEFAULT '',
  template_cid BIGINT NOT NULL DEFAULT 0,
  props_json TEXT,                 -- 本次勾选的属性定义+值
  update_content_text TEXT,        -- 记录列表“修改内容”
  update_range_text TEXT,          -- 记录列表“修改范围”
  total INT NOT NULL DEFAULT 0,
  done INT NOT NULL DEFAULT 0,
  changed INT NOT NULL DEFAULT 0,  -- 成功商品数，限额口径
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  msg VARCHAR(500) NOT NULL DEFAULT '',
  dateline INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_dateline (dateline)
);

CREATE TABLE glyx_cat_prop_task_detail (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id BIGINT UNSIGNED NOT NULL,
  seller_nick VARCHAR(100) NOT NULL DEFAULT '',
  num_iid VARCHAR(50) NOT NULL DEFAULT '',
  title VARCHAR(500) NOT NULL DEFAULT '',
  pic_url VARCHAR(500) NOT NULL DEFAULT '',
  cid BIGINT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 0,   -- 0失败 1成功 -1跳过（不要加 default，GORM 零值问题）
  msg VARCHAR(500) NOT NULL DEFAULT '',
  old_props_json TEXT,                 -- 原值（恢复用）
  changes_json TEXT,                   -- 本次修改的属性/新值
  recovered TINYINT NOT NULL DEFAULT 0,
  recover_num INT NOT NULL DEFAULT 0,
  dateline INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_task (task_id),
  KEY idx_num_iid (num_iid)
);
```

本功能只有“范围修改”，没有“列表修改”，因此不需要 `glyx_cat_prop_list_detail` 表。

---

## 五、前端调用汇总（联调用）

| 序号 | 方法 | 路径 | 触发时机 |
| --- | --- | --- | --- |
| 1 | GET | `/api/v1/batch-update-cat-prop/props` | 点击“获取属性” |
| 2 | POST | `/api/v1/batch-update-cat-prop/preview` | 点击“预览修改结果” |
| 3 | POST | `/api/v1/batch-update-cat-prop/create-task` | 立即修改 / 恢复 / 重试 |
| 4 | POST | `/api/v1/batch-update-cat-prop/create-scheduled-task` | 创建定时任务 |
| 5 | GET | `/api/v1/batch-update-cat-prop/task-progress` | 任务创建后每 2 秒轮询 |
| 6 | GET | `/api/v1/batch-update-cat-prop/quota-status` | 进入页面 |
| 7 | POST | `/api/v1/batch-update-cat-prop/get-shop-record` | 进入页面 / 任务完成 / 30 秒自动刷新 |
| 8 | POST | `/api/v1/batch-update-cat-prop/get-shop-record-details` | 点击记录“查看” |
| 9 | — | 省份/城市级联为前端静态配置，无需后端接口 | 省份切换时 |

新增路由后需要重启 Go 服务（或在用 air 热更新）才能生效。

---

## 六、注意事项

1. `props` 接口的 `schemaXml` 必须是**原始 XML 字符串**，前端用 `DOMParser` 解析；不要在 JSON 里做二次转义或把 XML 转成 HTML。
2. 前端只提交勾选的属性；后端组装 schema 时也只拼这些字段，避免误改其他属性。
3. 类目不同的商品必须跳过，不要提交给淘宝（会报属性不匹配）。
4. 属性值要做 XML 转义（`&`、`<`、`>`），尤其是输入型属性（净含量、条形码等）。
5. 任务统计按商品级：一个商品改多个属性仍算 1 个商品。
6. 恢复/重试的进度和统计要基于本次选中的明细，不能沿用源任务 `total`。
7. 前端已支持 `disableRule` + `depend-group` 的依赖禁用；后端不需要重复做前端展示层面的依赖校验，但淘宝侧校验失败时仍要原样返回错误信息。
8. 如果某些类目返回 `multiComplex` 属性，前端当前不展示（不支持多实例复合属性）；这类属性不会提交，不影响其他属性修改。
