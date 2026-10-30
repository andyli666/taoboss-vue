# 页面访问统计接口文档（前端埋点 + 后端聚合）

> 前端：Vue3 + vue-router（负责上报页面路径）
> 后端：Go / Gin，异步批量写入 MySQL 日聚合表，单接口返回全部图表数据

## 1. 概述

统计「每天有哪些用户访问了哪些页面」。

- 基础路径：`/api/v1`
- 时区：`Asia/Shanghai`，按自然日统计（`stat_date` 由后端计算，前端不传日期）
- 表：`glyx_page_view_daily`，唯一键 `(stat_date, user_id, seller_nick, page_path)`，同一天同一用户同一页面只占一行，`pv` 累加
- 上报接口：需要登录态（`Authorization: Bearer <accessToken>`）
- 查询接口：仅管理员（JWT `role=admin`），沿用现有 `usage-stats` 看板鉴权
- 数据保留：90 天，服务每日自动清理

数据链路：

```
Vue 路由钩子 → POST /api/v1/track/pageview → 内存队列（1s / 50 条批量 upsert）
→ glyx_page_view_daily → GET /api/v1/usage-stats/page-views（仅管理员）
```

## 2. 前端上报（需要前端配合的唯一改动）

### 2.1 上报方式

`navigator.sendBeacon` **不能携带 `Authorization` 请求头**，因此统一使用 `fetch` + `keepalive: true`（页面切走/关闭时仍能发出，且支持自定义头）。

### 2.2 参考实现

```ts
import { useRouter } from 'vue-router'
import { getToken } from '@/utils/auth' // 复用现有取 token 方法

const router = useRouter()

let lastPath = ''
let lastAt = 0
const THROTTLE_MS = 30_000

router.afterEach((to) => {
  if (!to.matched.length) return // 404 不上报

  const path = to.path // 必须用 path，不能用 fullPath（会带 query）
  const now = Date.now()
  if (path === lastPath && now - lastAt < THROTTLE_MS) return // 同一页面 30 秒内不重复上报
  lastPath = path
  lastAt = now

  const token = getToken()
  if (!token) return // 未登录不上报

  void fetch('/api/v1/track/pageview', {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      path,
      title: (to.meta?.title as string) || document.title,
    }),
  }).catch(() => {
    // 上报失败静默忽略，不影响业务
  })
})
```

### 2.3 前端注意事项

| 项 | 要求 |
|---|---|
| 路径 | 只传 `path`（如 `/batch-price`），**不要传 query/hash**；后端也会自动截掉 `?`、`#` 之后的部分 |
| 长度 | `path` ≤ 191 字符、`title` ≤ 100 字符，超出后端按字符截断 |
| 节流 | 同一 `path` 30 秒内最多上报 1 次（刷新会重新计时） |
| 首次进入 | 登录后的首个页面也要上报（`afterEach` 天然覆盖初始导航） |
| 401 | 静默忽略，不要重试、不要弹窗 |
| 登录页 | 建议不上报 `/login`，避免游客路径污染数据 |

## 3. 采集接口

### POST `/api/v1/track/pageview`

请求头：

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

请求体：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| path | string | 是 | 页面路径，必须 `/` 开头 |
| title | string | 否 | 页面标题 |

用户身份**只从 JWT 解析**，请求体不接受用户 ID：

- 后端自签 token：取 `user_id`；
- 前端/SaaS 签发 token：无 `user_id` 时用 `seller_nick` 作为用户标识。

响应：

```json
{ "code": 0, "msg": "success" }
```

说明：

- 写入是异步的（内存队列，每 1 秒或满 50 条批量入库），接口立即返回，不阻塞页面；
- 队列满（2048 条）时丢弃当次上报并记日志，不会报错给前端；
- 同一用户同一天同一页面 `pv + 1`，`first_visit_at` 保持首次值，`last_visit_at` 取最新值。

## 4. 统计接口

### GET `/api/v1/usage-stats/page-views`

鉴权：`Authorization: Bearer <accessToken>`，且 JWT 中 `role` 必须为 `admin`。

#### Query 参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| startDate | string | 否 | 开始日期（含），`YYYY-MM-DD`；默认 `endDate` 往前 29 天 |
| endDate | string | 否 | 结束日期（含），`YYYY-MM-DD`；默认今天 |
| userId | int | 否 | 用户 ID，精确匹配 |
| sellerNick | string | 否 | 卖家昵称，精确匹配 |
| pagePath | string | 否 | 页面路径，精确匹配（如 `/batch-price`） |

单次查询区间上限 366 天；`startDate` 晚于 `endDate` 返回 400。

#### 响应结构

统一响应包裹：

```json
{ "code": 0, "msg": "success", "data": { ... } }
```

`data` 字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| summary | object | 汇总 |
| summary.userCount | number | 访问用户数（去重） |
| summary.pageCount | number | 被访问页面数（去重） |
| summary.pv | number | 访问次数合计 |
| summary.uv | number | 用户×页面 去重数（= rows 行数） |
| dates | string[] | 日期轴，已按自然日补零，升序 |
| daily | object[] | 每日趋势，与 dates 一一对应 |
| daily[].date | string | 日期 |
| daily[].pv | number | 当日访问次数 |
| daily[].uv | number | 当日的用户×页面访问数 |
| daily[].userCount | number | 当日访问用户数（去重） |
| daily[].pageCount | number | 当日被访问页面数（去重） |
| pages | object[] | 页面维度汇总，按 PV 降序 |
| pages[].pagePath / pageTitle | string | 页面路径 / 标题 |
| pages[].pv / uv | number | 访问次数 / 访问用户数（去重） |
| users | object[] | 用户维度汇总，按 PV 降序 |
| users[].userId | number | 用户 ID（SaaS token 可能为 0） |
| users[].sellerNick | string | 卖家昵称 |
| users[].pv | number | 访问次数 |
| users[].pageCount | number | 访问过的页面数（去重） |
| users[].lastVisitDate | string | 区间内最后一次访问日期 |
| rows | object[] | 明细：日期×用户×页面，按日期升序 |
| rows[].date | string | 日期 |
| rows[].userId / sellerNick | number / string | 用户身份 |
| rows[].pagePath / pageTitle | string | 页面路径 / 标题 |
| rows[].pv | number | 该用户当天对该页面的访问次数 |
| rows[].firstVisitAt / lastVisitAt | string | 首次/末次访问时间 `YYYY-MM-DD HH:mm:ss` |

#### 响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "summary": { "userCount": 2, "pageCount": 3, "pv": 7, "uv": 5 },
    "dates": ["2026-10-28", "2026-10-29", "2026-10-30"],
    "daily": [
      { "date": "2026-10-28", "pv": 2, "uv": 2, "userCount": 1, "pageCount": 2 },
      { "date": "2026-10-29", "pv": 0, "uv": 0, "userCount": 0, "pageCount": 0 },
      { "date": "2026-10-30", "pv": 5, "uv": 3, "userCount": 2, "pageCount": 2 }
    ],
    "pages": [
      { "pagePath": "/batch-price", "pageTitle": "批量改价", "pv": 3, "uv": 2 },
      { "pagePath": "/batch-stock", "pageTitle": "批量改库存", "pv": 3, "uv": 2 },
      { "pagePath": "/home", "pageTitle": "首页", "pv": 1, "uv": 1 }
    ],
    "users": [
      { "userId": 3, "sellerNick": "shopA", "pv": 5, "pageCount": 3, "lastVisitDate": "2026-10-30" },
      { "userId": 0, "sellerNick": "小顽熊168", "pv": 2, "pageCount": 2, "lastVisitDate": "2026-10-30" }
    ],
    "rows": [
      { "date": "2026-10-28", "userId": 3, "sellerNick": "shopA", "pagePath": "/home", "pageTitle": "首页", "pv": 1, "firstVisitAt": "2026-10-28 09:12:03", "lastVisitAt": "2026-10-28 09:12:03" },
      { "date": "2026-10-28", "userId": 0, "sellerNick": "小顽熊168", "pagePath": "/batch-price", "pageTitle": "批量改价", "pv": 1, "firstVisitAt": "2026-10-28 15:02:44", "lastVisitAt": "2026-10-28 15:02:44" },
      { "date": "2026-10-30", "userId": 3, "sellerNick": "shopA", "pagePath": "/batch-price", "pageTitle": "批量改价", "pv": 2, "firstVisitAt": "2026-10-30 10:01:20", "lastVisitAt": "2026-10-30 18:22:05" },
      { "date": "2026-10-30", "userId": 3, "sellerNick": "shopA", "pagePath": "/batch-stock", "pageTitle": "批量改库存", "pv": 2, "firstVisitAt": "2026-10-30 11:30:12", "lastVisitAt": "2026-10-30 16:40:09" },
      { "date": "2026-10-30", "userId": 0, "sellerNick": "小顽熊168", "pagePath": "/batch-stock", "pageTitle": "批量改库存", "pv": 1, "firstVisitAt": "2026-10-30 14:05:51", "lastVisitAt": "2026-10-30 14:05:51" }
    ]
  }
}
```

## 5. 统计口径

| 指标 | 口径 |
|---|---|
| PV | 每上报 1 次 +1；页面刷新、来回切换都会增加（前端 30 秒同路径节流） |
| UV | 同一天、同一用户、同一页面去重 = 1；区间 `uv` 为「用户×页面」去重数 |
| userCount | 区间内出现过的用户去重数 |
| pageCount | 区间内出现过的页面去重数 |
| 日期归属 | 按后端收到上报的时间计算自然日，不采用前端时间 |
| 轮询接口 | 不涉及（本方案只统计页面路由，不统计接口调用） |

## 6. 运维

首次部署需要建表：

```bash
go run ./cmd/migrate
```

脚本会创建 `glyx_page_view_daily` 及索引（已存在则跳过）。表结构要点：

- 唯一键 `uk_day_user_page (stat_date, user_id, seller_nick, page_path)`；
- 索引 `idx_stat_date`、`idx_user_id`、`idx_seller_nick`、`idx_page_path`。

清理：服务启动 1 分钟后执行一次，之后每 24 小时删除 `stat_date < 今天 - 90 天` 的数据（无需额外配置）。

时区：服务按 `time.Local` 计算自然日，生产机时区需为 `Asia/Shanghai`。

## 7. 错误响应

| HTTP | code | 场景 |
|---|---|---|
| 400 | 1 | 请求体缺少 `path`、日期格式错误、区间超 366 天、统计查询失败 |
| 401 | 401 | 未携带 token / token 无效或过期 / 无法识别用户身份 |
| 403 | 403 | 统计接口 JWT 中 `role` 不是 `admin` |

## 8. 前端验收清单

- [ ] 首次进入、路由切换都会上报，`path` 不含 `?` 和 `#`
- [ ] 同一页面 30 秒内连续切换只产生 1 条上报
- [ ] 刷新页面会再次上报（PV 增加、UV 不变）
- [ ] 未登录、token 过期时静默跳过，不弹错误
- [ ] 管理员查询 `/api/v1/usage-stats/page-views` 能看到当天的 `rows` 明细
- [ ] `rows[].pv` 与 `daily[].pv`、`pages[].pv` 汇总一致
