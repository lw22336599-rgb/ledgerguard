# LedgerGuard 整改优化议程（持续讨论用）

> 版本：v0.1（2026-08-03）
> 用途：这是讨论工作区——所有待整改/待优化/待决策的事项都记在这里。打开这份文件 = 知道接下来要讨论什么。
> 状态标记：⬜ 待讨论｜🔄 讨论中｜✅ 已确认｜🔴 已执行

---

## 0. 现状快照（2026-08-03 已核实）

| 项目 | 状态 |
|:----|:-----|
| 官网 | https://ledgerguard-gules.vercel.app（Vercel 部署，GitHub Actions 每小时自动 smoke 监控） |
| 代码 | 160 测试全绿 / 28 文件 / 18 页面 / 30+ API 路由，部署完整 |
| 引擎 | Preflight（签名前）+ Evidence（签名后）+ 交易模拟 + MCP 服务器 + 第7环威胁检测 |
| SDK | @ledgerguard1/sdk 0.1.1 待发布（卡网络+2FA） |
| Grant | **已提交成功**（Questbook submitted: true） |
| 闭环 | 7 环完成 7 环（第7环恶意地址+防钓鱼已补上） |
| 参考集成 | **3 个已提交**：agent-mcp / ecommerce-checkout / subscription-billing |
| 外部集成 | **0 个（最大问题，参考集成是自建示例，非第三方采用）** |
| 网络 | 国内访问 Vercel 被墙（海外用户正常），自查需梯子 |
| 竞品 | intentfence(1⭐)/preflight402(0⭐)/FurlPay(0⭐) 浅竞品；GoPlus/ClawRouter 巨头可能下场 |
| 市场 | x402 生态 30 天 $24.24M / 94,060 买家 / 22,000 卖家（官方） |

---

## 1. 待整改清单（立即层，不讨论直接做）

- ✅ 补第 7 环：恶意地址 + 防钓鱼检测（已实现并提交 a7e9a12，160 测试全绿：零地址/burn地址/EIP-55校验/种子黑名单/自转检测，GoPlus 数据源可插拔）
- ⏸ SDK 0.1.1 npm publish（等网络恢复 + 浏览器 2FA 验证后执行）
- ✅ 把 MCP 服务器当主打卖点宣传（参考集成 examples/agent-mcp/ 已写好，待网络宣传）
- ✅ 补 Agent 集成示例（agent-mcp + ecommerce-checkout + subscription-billing 3 个参考集成已提交 9d25dd3）

## 2. 待优化清单（本周层）

- ⬜ 定价重估：$0.002/次是否定低？安检门有不可替代性，按次可更高；企业定制才是大头
- ⬜ 多链全放开：Agent 生态不在 Arc 上，ETH/Base/Arb/BSC 全接（配置活非开发活）
- ⬜ Base Mainnet 主动跑通真钱流（adapter 已 fail-closed 部署，别等 Arc 主网）
- ⬜ 第 1 个外部集成：目标清单 + 触达话术 + 免费试用钩子
- ⬜ spec 文档线上可达性确认（可能指向 GitHub，需确认海外可访问）

## 3. 战略讨论区（本轮重点，⬜ 待讨论）

### 3.1 站在巨人肩膀上的路径
- ⬜ x402 基金会（6424⭐，Linux Foundation 背书）→ 抢 risk oracle 标准实现方位置
- ⬜ Internet Court 联盟（28 家巨头：MetaMask/OKX/NEAR/BNB Chain）→ 加入/被收录
- ⬜ GoPlus/Blockaid 数据 → 免费层起步，逐步自有（借力不树敌）
- ⬜ Circle 生态 → Questbook Grant 已提交，继续铺 Circle 的渠道
- ⬜ 巨头教育市场 → 我们占收获位（agent 支付安全叙事）

### 3.2 未来几年（不只 Arc）
- ⬜ 多链统一支付安全层（Arc 原生 + Base 保底 + ETH/Arb/BSC/Solana 覆盖）
- ⬜ Agent 支付标准位置（x402 PR #2792 risk oracle）
- ⬜ CCTP 跨链对账（已有 /v1/cctp/evidence）→ 跨链支付安全
- ⬜ 数据飞轮：每次校验积累 → 规则越准 → 越离不开
- ⬜ 远期：标准地位 → 收购/发币（底牌，对外不提）

### 3.3 收入模型
- ⬜ 免费 1000 次/月引流 → 按次 → 套餐 → 企业定制 → Agent 订阅
- ⬜ 企业/机构白标（PARTNER_INTEGRATION_GUIDE 已有）

## 4. 待决策问题（讨论产出后填）

- [ ] 定价最终方案
- [ ] 第 1 个集成目标选谁
- [ ] 多链优先级排序
- [ ] MCP 卖点页/文档排期

---

## 5. 下一轮讨论议题（2026-08-03 之后）

1. 站在巨人肩膀：具体抱哪条大腿、怎么抱（x402/Internet Court/Circle/GoPlus）
2. 未来几年产品形态：从"Arc 安全 API"到"多链 Agent 支付安全层"
3. 优化点扫盲：还有哪些没想到的（合规/结算/用户体验/生态激励）
4. 更猛更赚钱：收入模型、市场位置、护城河强化

*本文件会随讨论持续更新，最终形成完整整改方案文档。*
