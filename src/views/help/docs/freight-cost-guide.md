# 📦 运费成本说明

运费成本支持三种获取方式，系统按以下优先级自动取值：


## 方式一：菜鸟云仓自动导入

如果您使用的是**菜鸟云仓**发货，导入支付宝流水时系统会自动识别并提取每笔订单的运费，无需手动操作。

- ✅ 适用场景：菜鸟云仓用户
- ✅ 优点：导入支付宝流水时全自动识别并提取，无需额外配置


## 方式二：快递对账单导入

如果您使用的是非菜鸟云仓的快递公司，可以获取快递公司的对账单，导入系统后自动匹配订单运费。

- 📌 适用场景：非菜鸟云仓，有快递对账单
- 📌 操作路径：成本 → 运费成本配置 → 导入快递对账单


## 方式三：按单计费规则（系统自动计算）

如果您没有快递对账单，也可以提前在系统中设置「按单计费规则」（按快递公司 + 收货省份设置运费价格），订单发货时系统自动计算运费。

- 📌 适用场景：非菜鸟云仓，无快递对账单
- 📌 操作路径：成本 → 运费成本配置 → 按单计费规则


## 📊 优先级说明

当多种方式同时存在时，系统按以下优先级取值：

1️⃣ 支付宝流水中的运费（菜鸟云仓）← 实际扣款，最准确<br>
&nbsp;&nbsp;&nbsp;&nbsp;↓ 没有则取<br>
2️⃣ 快递对账单导入<br>
&nbsp;&nbsp;&nbsp;&nbsp;↓ 没有则取<br>
3️⃣ 按单计费规则（系统自动计算）<br>
&nbsp;&nbsp;&nbsp;&nbsp;↓ 没有则<br>
4️⃣ 运费为 0（需手动补充）


💡 **提示**：菜鸟云仓商家建议优先使用支付宝流水导入，非菜鸟云仓商家用快递对账单导入。按单计费规则适合非菜鸟云仓商家且没有对账单的作为兜底方案。


## 快速选择指南

<table style="width: 750px; border-collapse: collapse;">
  <thead>
    <tr style="border-bottom: 1px solid #e5e6e8;">
      <th style="padding: 10px 16px; text-align: left; width: 50%;">您的发货方式</th>
      <th style="padding: 10px 16px; text-align: left; width: 50%;">推荐使用方式</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #e5e6e8;">
      <td style="padding: 10px 16px;">菜鸟云仓</td>
      <td style="padding: 10px 16px;">方式一（支付宝流水自动获取）</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e6e8;">
      <td style="padding: 10px 16px;">非菜鸟云仓 + 有对账单</td>
      <td style="padding: 10px 16px;">方式二（快递对账单导入）</td>
    </tr>
    <tr>
      <td style="padding: 10px 16px;">非菜鸟云仓 + 无对账单</td>
      <td style="padding: 10px 16px;">方式三（按单计费规则）</td>
    </tr>
  </tbody>
</table>