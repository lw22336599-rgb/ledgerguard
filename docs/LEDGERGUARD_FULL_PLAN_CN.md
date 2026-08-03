# LedgerGuard 完整方案文档（供评估与审查）

> 版本：v1.0（2026-08-01）
> 状态：工程完成，P0+P1已交付，整改已推送，待市场验证

---

## 一、项目定位（一句话）

**x402生态的稳定币支付意图安全API（preflight oracle）——签名前核对意图（ALLOW/REVIEW/BLOCK），签名后链上对账（VERIFIED/MISMATCH）。非托管，一行接入，Arc原生，Base保底。**

**对外叙事：** Non-custodial stablecoin payment intent safety — preflight before sign, evidence after settlement. Arc-first, one-line SDK.

**不是：** 支付链接工具（Conduit地盘）、通用检测器（GoPlus/Blockaid地盘）、agent仲裁（Internet Court联盟地盘）。

---

## 二、市场分析（2026-07实测）

### 2.1 市场数据

| 指标 | 数据 | 来源 |
|:----|:-----|:-----|
| x402生态30天交易 | $24.24M / 94,060买家 / 22,000卖家 | x402.org官方 |
| Arc官方叙事关键词 | AI×132、stablecoin×29、USDC×16、payment×13 | arc.io官网 |
| x402基金会 | 6424⭐，Linux Foundation背书 | GitHub |
| Internet Court联盟 | 28家巨头（MetaMask/OKX/x402/NEAR/BNB Chain），1416⭐ | GitHub |

### 2.2 竞争格局

| 层级 | 玩家 | 我们 vs 他们 |
|:----|:-----|:------------|
| 支付铁路 | x402基金会、Circle、Solana基金会 | 跑在标准上，不竞争 |
| 支付链接 | Conduit、ArcPay、OneLink、ArcLinkPay | 被嵌入，不竞争 |
| 通用安全 | GoPlus（全链+免费恶意地址API）、Blockaid（59亿笔，Sequoia） | 借数据，互补 |
| agent信任/仲裁 | Internet Court（28家联盟） | 不碰仲裁，只做签名前 |
| **签名前支付安全** | **只有我们（完整引擎）** | **唯一占位** |

### 2.3 关键机会

1. **x402 PR #2792（Payment Preflight Record标准，draft v0.1）**——标准里有"risk oracle"角色（提供GO/HOLD/STOP verdict），**这正是我们的位置**：我们是该角色的实现方，不是标准作者，不overclaim。
2. **Arc主网未开**——GoPlus/Blockaid还没进Arc，我们有窗口期。
3. **巨头在教育市场**——它们花几亿教育"agent支付需要安全"，我们占收获位。

---

## 三、功能模块清单（全部已实现+已测试）

### 3.1 核心引擎（src/services/）

| 模块 | 文件 | 功能 | 测试 |
|:----|:-----|:-----|:----:|
| **Preflight（签名前检查）** | preflight.ts | 解析未签名交易（ERC20 transfer/approve/transferFrom），与声明的intent（收款方/金额/资产/用途）比对，返回ALLOW/REVIEW/BLOCK | ✅ preflight.test.ts |
| **Evidence（签名后对账）** | evidence.ts | 链上事件解码，验证实际转账与intent一致，返回VERIFIED/MISMATCH | ✅ evidence.test.ts |
| **交易模拟** | preflight.ts内 | viem只读RPC模拟，验证交易会成功而非失败 | ✅ 集成在preflight |
| **can-sign薄API** | can-sign.ts | 只收to/data/value/intent，降低集成成本 | ✅ can-sign.test.ts |
| **开发者Webhook** | developer-webhook.ts | preflight/evidence结果推送，B2B粘性 | ✅ developer-webhook.test.ts |

### 3.2 网络适配层（src/adapters/ + src/config/）

| 模块 | 功能 |
|:----|:-----|
| NetworkAdapter接口 | 网络可插拔架构，未支持链fail-closed |
| arcTestnet adapter | 当前唯一enabled（chainId 5042002，原生USDC Gas） |
| baseMainnet adapter | 第二条adapter（Plan B，x402 canary证明） |
| NetworkDisabledError | 未启用网络返回明确错误 |

### 3.3 SDK（packages/sdk/）

| 模块 | 功能 |
|:----|:-----|
| @ledgerguard1/sdk | npm包（0.1.0已发布，0.1.1待发布） |
| LedgerGuardClient | 统一客户端（preflight/evidence/can-sign） |
| withPreflight中间件 | Node/Hono一行接入 |
| 3个examples | minimal-preflight / before-wallet-sign / x402-seller-hook |

### 3.4 HTTP API（src/app.ts，全部路由）

| 端点 | 功能 |
|:----|:-----|
| POST /v1/guard-links | 创建Guard Link |
| GET /guard | 付款页（含安全状态条） |
| POST /v1/preflight | 签名前安全检查 |
| POST /v1/can-sign | 薄版预检 |
| POST /v1/evidence | 签名后对账 |
| POST /v1/cctp/evidence | CCTP跨链对账 |
| POST /v1/paid/evidence | 付费版对账 |
| GET /v1/networks | 网络列表 |
| GET /v1/network-adapters | 适配器列表 |
| POST /v1/developer/register | 开发者注册 |
| PUT /v1/developer/webhook | Webhook配置 |
| POST /v1/developer/keys/rotate | 密钥轮换 |
| POST /v1/developer/preflight | 计量版Preflight |
| GET /v1/paid/network-risk | 网络风险评估 |
| GET /health, /ready | 健康检查 |
| GET /openapi.json | OpenAPI文档 |
| MCP | /mcp |

### 3.5 前端页面（全部200）

| 页面 | 功能 |
|:----|:-----|
| /（首页） | 双入口（Get paid/Pay a link），三步引导，FAQ，无钱包引导 |
| /guard/create | Guard Builder（连接钱包→填金额→生成链接） |
| /pay | 付款入口 |
| /payments | 收款历史 |
| /developer | 开发者控制台 |
| /docs + /docs/integration-stack | 开发者文档（含spec链接） |
| /integrations | 集成署名页 |
| /canary | Base x402能力证明 |
| /privacy /terms /about | 法律页+诚实声明 |
| /test | 测试页 |

### 3.6 规范文档（docs/，5份新增）

| 文档 | 内容 |
|:----|:-----|
| PREFLIGHT_RECORD_MAPPING.md | 对齐x402 PR #2792，ALLOW→GO/REVIEW→HOLD/BLOCK→STOP映射，oracle角色声明 |
| NETWORK_ADAPTER_SPEC.md | 第三方写链适配器的规范 |
| GUARD_LINK_FORMAT.md | Guard Link URL/字段规范 |
| OPEN_SOURCE_POLICY.md | 开/锁边界声明 |
| WALLET_EXCHANGE_INTEGRATION.md | 机构留席，5分钟接入路径 |

---

## 四、开源/闭源策略

| 层 | 内容 | 开/锁 |
|:--|:----|:-----:|
| 接口层 | OpenAPI、SDK、API规范 | ✅ 开源 |
| 格式层 | Guard Link格式、插槽规范 | ✅ 开源 |
| 示例层 | examples、文档 | ✅ 开源 |
| 测试层 | 不暴露规则逻辑的测试 | ⚠️ 选择性 |
| 引擎层 | Preflight规则、评分算法、判断逻辑 | 🔒 锁死（hosted-only） |
| 数据层 | 恶意地址库、积累安全数据 | 🔒 锁死 |

**原则：开源"怎么用"，锁住"怎么判"。** 生产必须用公开API，不鼓励fork自部署引擎（已在代码注释+README声明）。

---

## 五、商业模式

### 5.1 收费路径（触发式）

```
免费层：1000次/月（引流）
触发条件：≥3个公开集成 + 主网或真实USDC流
按次：$0.001-0.005/次（x402自动扣微支付）
套餐：$9-49/月（开发者稳定用量）
企业：定制（机构/平台）
```

### 5.2 收入预期（诚实版）

| 阶段 | 月收入 |
|:----|:------:|
| 测试网阶段 | $0（正常） |
| Arc主网开+100商户 | $300-1500 |
| 生态起来+1000商户 | $3000-15000 |
| agent爆发 | $3万-15万 |

### 5.3 远期选项（底牌，对外不提）

- 被巨头收购（成为Arc/x402生态标准后）
- 发币（万级用户+团队+合规后才考虑，现在保密）

---

## 六、路线图

```
阶段1（已完成）：引擎+SDK+文档+整改（150测试全绿，已推送）
阶段2（现在）：Grant提交（材料已备好）+ 找1个外部集成 + SDK 0.1.1发布
阶段3（触发：1集成）：恶意地址+防钓鱼补全，署名页填充
阶段4（触发：Arc主网开 or Base真钱流）：免费转收费
阶段5（触发：≥3集成）：套餐+企业定制
阶段6（远期）：标准地位→收购/发币（结果不强求）
```

---

## 七、风险与应对

| 风险 | 概率 | 应对 |
|:----|:----:|:-----|
| Arc生态不起 | 60% | Base保底，SDK通用，引擎跨行业 |
| 巨头抄/补preflight | 40% | 抢定义（mapping文档已发），数据飞轮 |
| 数据断供 | 30% | 自积累，开源列表兜底 |
| 个人精力不够 | 50% | AI工具链，只做窄P0 |
| overclaim毁信任 | — | 诚实声明（no claim of paying customers） |

---

## 八、当前待办（未完成项）

| # | 事项 | 状态 |
|:-:|:----|:----:|
| 1 | SDK 0.1.1 npm publish | ❌ 未执行（推送≠发布） |
| 2 | Grant提交（Questbook） | ❌ 材料齐，未提交 |
| 3 | 第1个外部集成 | ❌ 未找到 |
| 4 | spec文档线上可达性确认 | ⚠️ 待确认（可能指向GitHub） |

---

*本方案基于2026-07-31实际代码核查（150测试/28文件/18页面/全部API路由）编写，所有功能模块均真实存在。*
