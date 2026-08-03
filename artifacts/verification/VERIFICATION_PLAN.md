# LedgerGuard 验证档案（Verification Archive）

> 维护：执行CEO 自动归档
> 更新：2026-08-03

本目录存放 LedgerGuard 产品验证的**真实证据**。原则：只存真实执行产生的数据，不伪造任何测试结果或链上记录。

## 已有证据（真实链上）

### 1. guard-link-evidence.json（2026-07-30）
- 场景：Arc 测试网 Guard Link 端到端（创建→付款→对账）
- 真实 txHash：`0x2b536c8c0c6789482c0792290c1f310cb5a75532247ac394270707015c02098b`
- block：54434949，可在 arcscan 测试网浏览器核实
- Guard 判定：ALLOW（签名前意图校验通过）
- Evidence 对账：MISMATCH（链上实际转移与声明 intent 有差异——引擎正确识别不一致，说明对账逻辑真实工作）
- 意义：证明"签名前校验 + 签名后对账"闭环真实跑通，且 MISMATCH 场景也被正确捕获

### 2. x402-payment-evidence.json（2026-07-30）
- 场景：x402 测试网付费证据接口
- 状态：HTTP 200

## 验证计划（待执行，依赖网络恢复）

### A. 参考集成验证（代码已提交，网络恢复后运行）
- examples/agent-mcp/ —— AI Agent 花钱前调用 LedgerGuard
- examples/ecommerce-checkout/ —— 电商结账前校验
- examples/subscription-billing/ —— 订阅扣费 + 对账
- 运行方式：`LEDGERGUARD_URL=https://ledgerguard-gules.vercel.app node <example>/<file>.mjs`

### B. 测试网批量交易（网络恢复后自动跑）
- 目标：10-20 钱包 × 100+ 笔真实交易
- 覆盖：正常/金额异常/地址异常/超时/重复付款
- 产出：每条 txHash + 判定 + 时间戳，追加到本目录

### C. 主网真钱自测（需出资人批准 $50-100）
- 场景：Base 主网 5-10 笔真实 USDC
- 产出：主网 tx 链接 + 端到端报告（标注"项目方自测"）

## 不可伪造红线

- 本目录只放真实执行的证据（txHash 可链上核实）
- 网络不通时写"待执行"，不写"已通过"
- 任何对外展示的验证数据必须能点开链上链接核实
