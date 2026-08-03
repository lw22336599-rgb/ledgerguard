# LedgerGuard Outreach List — x402 Ecosystem (20 targets)

> 用途：第 1 个外部集成的精准触达清单。网络恢复后逐个：看代码 → 找集成点 → 发邀请。
> 状态：⬜ 待触达 ｜🔄 已联系 ｜✅ 已集成

## Tier 1 — Agent payment infra (highest fit)

| # | 项目 | 为什么找它 | 集成点 | 状态 |
|:-:|:-----|:---------|:------|:----:|
| 1 | ClawRouter (⭐6.6k) | Agent 路由，最可能做 Agent 支付 | 付费前校验 hook | ⬜ |
| 2 | AgentOS | Agent 操作系统 | 支付安全工具 | ⬜ |
| 3 | x402 基金会 | 标准制定者 | risk oracle 实现方位置 | ⬜ |
| 4 | Conduit | 支付链接 | 链接附带安全校验 | ⬜ |

## Tier 2 — x402 ecosystem builders

| # | 项目 | 集成点 | 状态 |
|:-:|:-----|:------|:----:|
| 5 | x402 examples 贡献者 | SDK 加 preflight 示例 | ⬜ |
| 6 | Arc 生态小项目（社区 showcase） | Guard Link 接入 | ⬜ |
| 7 | Base 生态 USDC dApp | baseMainnet adapter | ⬜ |
| 8 | 稳定币钱包（测试网阶段） | 签名前提示 | ⬜ |

## Tier 3 — Developer tools / infra

| # | 项目 | 集成点 | 状态 |
|:-:|:-----|:------|:----:|
| 9 | 开源支付 SDK（viem 生态） | 中间件示例 | ⬜ |
| 10 | Agent 框架（LangChain/Claude Code 工具） | MCP 工具注册 | ⬜ |
| 11 | 电商插件（Shopify 类加密支付） | 结账 preflight | ⬜ |
| 12 | 订阅计费服务 | 循环扣费对账 | ⬜ |

## Tier 4 — Safety / data partners (complementary, not competitive)

| # | 项目 | 关系 | 状态 |
|:-:|:-----|:-----|:----:|
| 13 | GoPlus | 借恶意地址免费层 | ⬜ |
| 14 | Blockaid | 互补定位，学叙事 | ⬜ |
| 15 | Internet Court 联盟 | 加入/被收录 | ⬜ |

## Tier 5 — Ecosystem / grants

| # | 项目 | 关系 | 状态 |
|:-:|:-----|:-----|:----:|
| 16 | Questbook (Circle Grant) | ✅ 已提交，跟进评审 | 🔄 |
| 17 | Arc 官方 | 生态收录 | ⬜ |
| 18 | Base 生态基金 | 备用 Grant | ⬜ |
| 19 | x402 Discord 社区 | 发集成示例 | ⬜ |
| 20 | Arc Discord #developers | 发集成示例 | ⬜ |

---

## 触达话术模板（英文，简短）

```
Hi [name],

We built LedgerGuard — a non-custodial payment-intent safety layer for USDC.
Before a wallet signs, it verifies the transfer matches the declared intent
(recipient/amount/asset); after settlement it reconciles on-chain evidence.

We have 3 open reference integrations (agent-mcp, ecommerce-checkout,
subscription-billing) and a one-line SDK. Would you be open to trying it
in [project]? Happy to walk through integration — it's ~1 hour.

Demo: https://ledgerguard-gules.vercel.app
Docs: /docs
```

## 纪律

- 只发真实可验证的（参考集成、测试网证据）
- 不伪造"第 X 个项目已集成"——未集成前如实说"0 外部集成，3 参考实现"
- 每个联系记录状态，不重复骚扰
