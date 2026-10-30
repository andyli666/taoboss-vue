# 批量修改功能使用统计接口文档

> 面向前端：Vue3 + Element Plus + ECharts
> 后端：Go / Gin，单接口返回全部图表数据

## 1. 概述

统计每天有哪些用户使用了哪些批量修改功能，以及使用的是「范围修改」还是「列表修改」。

数据来源为现有 12 张业务表（只读聚合，不新增表、不改业务逻辑），支持查询历史数据。

- 基础路径：`/api/v1`
- 时区：`Asia/Shanghai`，按自然日统计
- 鉴权：`Authorization: Bearer <accessToken>`，且 JWT 中 `role` 必须为 `admin`（内部看板专用）

## 2. 接口

### GET `/api/v1/usage-stats/daily`

查询指定日期区间内的使用统计。

#### Query 参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| startDate | string | 否 | 开始日期（含），格式 `YYYY-MM-DD`；默认 `endDate` 往前推 29 天 |
| endDate | string | 否 | 结束日期（含），格式 `YYYY-MM-DD`；默认今天 |
| sellerNick | string | 否 | 卖家昵称，精确匹配 |
| feature | string | 否 | 功能编码，见下表；不传=全部功能 |
| mode | string | 否 | `range` 范围修改 / `list` 列表修改；不传=全部模式 |

> 单次查询区间上限 366 天；`startDate` 晚于 `endDate` 返回 400。

#### 功能编码对照

| feature | featureName | 支持的模式 |
|---|---|---|
| price | 批量改价 | range / list |
| stock | 批量改库存 | range / list |
| title | 批量改标题 | range / list |
| shop_title | 批量改导购标题 | range / list |
| sku_prop_name | 批量修改SKU名称 | range / list |
| cat_prop | 批量修改类目属性 | 仅 range |
| food_prop | 批量修改食品属性 | 仅 range |

#### 响应结构

统一响应包裹：

```json
{ "code": 0, "msg": "success", "data": { ... } }
```

`data` 字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| summary | object | 汇总指标 |
| summary.userCount | number | 使用过的用户数（去重） |
| summary.usageCount | number | 使用次数 |
| summary.itemCount | number | 涉及修改对象数 |
| summary.successCount | number | 成功数 |
| summary.failCount | number | 失败数（范围任务恒为 0，见统计口径） |
| dates | string[] | 日期轴，已按自然日补零，升序 |
| daily | object[] | 每日趋势，与 dates 一一对应 |
| daily[].date | string | 日期 |
| daily[].usageCount | number | 当日使用次数 |
| daily[].itemCount | number | 当日涉及修改对象数 |
| daily[].userCount | number | 当日使用用户数（去重） |
| features | object[] | 功能维度汇总，仅返回有数据的功能，按固定顺序 |
| features[].feature / featureName | string | 功能编码 / 名称 |
| features[].usageCount / itemCount | number | 使用次数 / 涉及修改对象数 |
| users | object[] | 用户维度汇总，按 usageCount 降序 |
| users[].sellerNick | string | 卖家昵称 |
| users[].usageCount / itemCount | number | 使用次数 / 涉及修改对象数 |
| users[].lastUsedDate | string | 区间内最后一次使用日期 `YYYY-MM-DD` |
| users[].features | object[] | 该用户按功能+模式拆分的明细汇总 |
| users[].features[].feature / featureName | string | 功能编码 / 名称 |
| users[].features[].mode / modeName | string | `range`/`list`；范围修改/列表修改 |
| users[].features[].usageCount / itemCount | number | 使用次数 / 涉及修改对象数 |
| rows | object[] | 明细行：日期 × 用户 × 功能 × 模式，按日期升序 |
| rows[].date / sellerNick | string | 日期 / 卖家昵称 |
| rows[].feature / featureName | string | 功能编码 / 名称 |
| rows[].mode / modeName | string | 模式编码 / 名称 |
| rows[].usageCount / itemCount | number | 使用次数 / 涉及修改对象数 |
| rows[].successCount / failCount | number | 成功数 / 失败数 |

#### 响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "summary": {
      "userCount": 2,
      "usageCount": 13,
      "itemCount": 180,
      "successCount": 169,
      "failCount": 2
    },
    "dates": ["2026-10-28", "2026-10-29", "2026-10-30"],
    "daily": [
      { "date": "2026-10-28", "usageCount": 5, "itemCount": 5, "userCount": 1 },
      { "date": "2026-10-29", "usageCount": 3, "itemCount": 102, "userCount": 1 },
      { "date": "2026-10-30", "usageCount": 5, "itemCount": 73, "userCount": 2 }
    ],
    "features": [
      { "feature": "price", "featureName": "批量改价", "usageCount": 3, "itemCount": 102 },
      { "feature": "stock", "featureName": "批量改库存", "usageCount": 5, "itemCount": 5 },
      { "feature": "title", "featureName": "批量改标题", "usageCount": 1, "itemCount": 50 },
      { "feature": "sku_prop_name", "featureName": "批量修改SKU名称", "usageCount": 3, "itemCount": 3 },
      { "feature": "food_prop", "featureName": "批量修改食品属性", "usageCount": 1, "itemCount": 20 }
    ],
    "users": [
      {
        "sellerNick": "shopA",
        "usageCount": 9,
        "itemCount": 28,
        "lastUsedDate": "2026-10-30",
        "features": [
          { "feature": "stock", "featureName": "批量改库存", "mode": "list", "modeName": "列表修改", "usageCount": 5, "itemCount": 5 },
          { "feature": "sku_prop_name", "featureName": "批量修改SKU名称", "mode": "list", "modeName": "列表修改", "usageCount": 3, "itemCount": 3 },
          { "feature": "food_prop", "featureName": "批量修改食品属性", "mode": "range", "modeName": "范围修改", "usageCount": 1, "itemCount": 20 }
        ]
      },
      {
        "sellerNick": "小顽熊168",
        "usageCount": 4,
        "itemCount": 152,
        "lastUsedDate": "2026-10-30",
        "features": [
          { "feature": "price", "featureName": "批量改价", "mode": "range", "modeName": "范围修改", "usageCount": 1, "itemCount": 100 },
          { "feature": "price", "featureName": "批量改价", "mode": "list", "modeName": "列表修改", "usageCount": 2, "itemCount": 2 },
          { "feature": "title", "featureName": "批量改标题", "mode": "range", "modeName": "范围修改", "usageCount": 1, "itemCount": 50 }
        ]
      }
    ],
    "rows": [
      { "date": "2026-10-28", "sellerNick": "shopA", "feature": "stock", "featureName": "批量改库存", "mode": "list", "modeName": "列表修改", "usageCount": 5, "itemCount": 5, "successCount": 4, "failCount": 1 },
      { "date": "2026-10-29", "sellerNick": "小顽熊168", "feature": "price", "featureName": "批量改价", "mode": "range", "modeName": "范围修改", "usageCount": 1, "itemCount": 100, "successCount": 95, "failCount": 0 },
      { "date": "2026-10-29", "sellerNick": "小顽熊168", "feature": "price", "featureName": "批量改价", "mode": "list", "modeName": "列表修改", "usageCount": 2, "itemCount": 2, "successCount": 2, "failCount": 0 },
      { "date": "2026-10-30", "sellerNick": "小顽熊168", "feature": "title", "featureName": "批量改标题", "mode": "range", "modeName": "范围修改", "usageCount": 1, "itemCount": 50, "successCount": 48, "failCount": 0 },
      { "date": "2026-10-30", "sellerNick": "shopA", "feature": "sku_prop_name", "featureName": "批量修改SKU名称", "mode": "list", "modeName": "列表修改", "usageCount": 3, "itemCount": 3, "successCount": 2, "failCount": 1 },
      { "date": "2026-10-30", "sellerNick": "shopA", "feature": "food_prop", "featureName": "批量修改食品属性", "mode": "range", "modeName": "范围修改", "usageCount": 1, "itemCount": 20, "successCount": 18, "failCount": 0 }
    ]
  }
}
```

## 3. 统计口径（务必与前端对齐）

| 指标 | 范围修改（range） | 列表修改（list） |
|---|---|---|
| usageCount 使用次数 | 创建的**任务数**（一条任务计 1 次） | 列表保存的**记录条数**（单行保存 1 条；批量保存按行数计） |
| itemCount 涉及修改对象数 | 任务 `total` 之和（筛选商品数） | 记录条数（每个商品/SKU 一条） |
| successCount 成功数 | 任务 `changed` 之和（实际修改商品数） | `status=1` 的记录数 |
| failCount 失败数 | **恒为 0**（任务表不区分失败/跳过） | `status=0` 的记录数 |

补充说明：

- **恢复 / 重试不计入使用量**：范围修改的恢复/重试挂靠在源任务上执行，不新建任务；列表修改的恢复/重试只更新原记录，不新增记录。
- **定时/重复任务只计 1 次创建**：同一条任务重复执行多次不会增加 `usageCount`，只有 `itemCount/successCount` 反映当次执行结果（以任务记录的 `total/changed` 为准）。
- 统计按 `created_at`（任务/记录的创建时间）落在哪个自然日归属，而不是执行完成时间。
- 列表修改的「一次批量保存」无法还原成一次点击，因此 `usageCount` 按明细行数计，这是当前唯一准确的可得口径；如需精确操作次数需改为埋点日志方案。

## 4. 前端 ECharts 使用建议

| 图表 | 数据来源 | 说明 |
|---|---|---|
| 每日趋势折线图 | `dates` + `daily` | x 轴用 `dates`，series 可用 `usageCount`、`itemCount`、`userCount` |
| 功能分布饼图 | `features` | `name=featureName`，`value=usageCount` 或 `itemCount` |
| 功能×模式堆叠柱状图 | `rows` 或 `users[].features` | 按 `featureName` 分组、`modeName` 堆叠 |
| 用户排行柱状图 | `users` | `sellerNick` + `usageCount`，按后端已排序直接渲染 |
| 明细表格 | `rows` | Element Plus `el-table` 直接绑定，`mode` 可用 `modeName` 展示 |

日期区间选择器建议默认最近 7 天 / 30 天，最长不超过 366 天。

## 5. 错误响应

| HTTP | code | 场景 |
|---|---|---|
| 400 | 1 | 日期格式错误、开始日期晚于结束日期、区间超过 366 天、feature/mode 取值非法、统计查询失败 |
| 401 | 401 | 未携带 token / token 无效或过期 |
| 403 | 403 | JWT 中 `role` 不是 `admin` |

示例：

```json
{ "code": 1, "msg": "startDate 格式错误，应为 YYYY-MM-DD" }
```