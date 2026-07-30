# LedgerGuard 综合审计报告 · 整改方案 · 整改计划书

**文档版本：** 2026-07-31  
**生产环境：** https://ledgerguard-gules.vercel.app  
**代码仓库：** https://github.com/lw22336599-rgb/ledgerguard  
**适用范围：** 产品、对外文案、品牌信任、双链策略、推广节奏  

---

## 一、执行摘要（给决策者 3 分钟版）

| 维度 | 结论 |
|------|------|
| **技术** | Arc Testnet 主链路已跑通（132 测试、Smoke PASS、Guard Link + x402 有链上证据）。Base Mainnet x402 六门已开，首笔 0.001 USDC canary **未结算**，不阻塞 Arc 使用。 |
| **产品** | 首页 Phase A 改版 **已基本上线**（单 CTA、三步图、截图）。**最大 UX 问题：** 首页写「BASE + ARC」，Guard Builder 只交付 Arc，用户会感到被骗。 |
| **商业** | 0 外部验证用户、0 收入；**不宜**写 0.5% 定价、不宜出代币、不宜吹月收入区间。 |
| **整改优先级** | **P0 文案三处对齐** → **P1 推广（推文+截图）** → **P2 品牌与合规（Logo、Privacy/Terms）** → **P3 真 Base Guard Link（大工程，有人用再做）** |
| **Canaries** | 主网 canary 签名 **可省略** 作为 blocking；用户可自行访问 `/canary`；团队不必代签。 |
| **双链策略** | 品牌层：**BASE + ARC**；产品层：**Arc = Guard Link 主路径，Base = 有界 x402 canary**；诚实分层，而非假装「双 Guard Link 已全通」。 |

---

## 二、审计来源与方法

本报告综合以下来源，交叉核对代码、生产站点与既有文档：

| 来源 | 内容 |
|------|------|
| **审计报告 A** | 首页简化方案：单卖点、单 CTA、去 Protect/Meter 主叙事、截图优先、分 Phase A/B/C、不造假数据。（ClawBot / 改版顾问输出） |
| **审计报告 B** | 线上复核：首页约 80% 改对；首页 vs Guard Builder 矛盾；不像公司；代币时机；双链收益假设；优先「真双链」。（用户侧二次审计） |
| **我方方案与决策** | Phase A/B 验收、canary 非托管限制、省略 canary blocking、X 链接下沉 footer、Guard 链选择器改诚实静态文案等。 |
| **仓库事实源** | `docs/MESSAGING_AND_CLAIMS.md`、`docs/X402_E2E_EVIDENCE.md`、`docs/EXTERNAL_VALIDATION.md`、生产 Smoke、`/v1/commercial-candidate`。 |
| **线上抽查** | 2026-07-31 对 `/`、`/guard/create`、`/canary`、`/status` 及 commercial-candidate API。 |

**方法原则：** 对外说法不得超过代码与链上证据；两份审计中相互冲突处，以 **仓库事实 + 非托管安全边界** 为准。

---

## 三、当前状态快照

### 3.1 技术能力矩阵（真实）

| 能力 | 网络 | 状态 | 证据 |
|------|------|------|------|
| Guard Link 创建/分享/QR | Arc Testnet | ✅ 可用 | E2E、Guard Link 链上 tx |
| 钱包 Connect + Arc 网络 | Arc Testnet | ✅ 可用 | 统一 wallet 模块 |
| x402 付费资源 | Arc Testnet | ✅ 已结算 | `docs/X402_E2E_EVIDENCE.md` |
| x402 付费资源 | Base Mainnet | ⚠️ 接口就绪，首笔真钱未验收 | 6/6 gates，`realFundsEnabled: true`，余额未变 |
| Guard Link | Base Mainnet | ❌ 未实现 | API/支付页仅 Arc |
| 跨链 `/routes` | Base Sepolia → Arc Testnet | ⚠️ 演示存在，需测试币 | 非主推广路径 |
| Protect / Meter / API | 多网络 | ✅ 开发者向 | 非 C 端主路径 |

### 3.2 线上 UI 状态（2026-07-31）

| 页面 | 现状 |
|------|------|
| **首页 `/`** | 单 CTA「Create a Guard Link」；HOW IT WORKS 三步+截图； eyebrow「BASE + ARC」；正文说明 Arc demo + Base canary |
| **Guard Builder `/guard/create`** | eyebrow「ARC TESTNET」；固定显示 Arc Testnet（无假下拉）；footer 含 X |
| **导航** | Get paid / Developers / Status；Connect Wallet；badge「BASE + ARC」 |
| **Footer** | 链接 + 「Follow on X @HuiLibaa」 |

### 3.3 商业与信任数据（诚实）

| 指标 | 数值 | 能否对外写 |
|------|------|------------|
| 外部验证集成 | 0 | ❌ |
| 付费试点 | 0 | ❌ |
| 真实收入 | USD 0 | ❌ |
| Guard Link 平台费 0.5% | **代码中不存在** | ❌ 禁止写 |
| Arc 测试网 E2E | 有 | ✅ 技术演示 |
| Base 主网首笔 canary | 无 | ❌ 不能写「主网已验证结算」 |

---

## 四、两份审计报告对照 · 综合裁定

### 4.1 审计报告 A（改版方案）— 采纳与驳回

| 建议 | 裁定 | 理由 |
|------|------|------|
| 首页只卖「发 USDC 链接收钱」 | ✅ **已采纳 / 已上线** | 与 C 端目标一致 |
| 去掉 Protect/Meter 当主叙事 | ✅ **已采纳** | 首页已改为 HOW IT WORKS |
| 单一 CTA | ✅ **已采纳** | 已去掉「Move USDC into Arc」主按钮 |
| 不造假数据 | ✅ **必须遵守** | 与 `EXTERNAL_VALIDATION.md` 一致 |
| 截图 > 千字 | ✅ **已部分采纳** | `/marketing/*.png` 已引用 |
| 先结构后配色 | ✅ **采纳** | Phase C 亮色延后 |
| 改版当天发推 | ✅ **待执行** | P1 |
| 首页去掉 Base | ❌ **驳回** | 与用户修正及已投入 Base x402 环境矛盾 |
| 删除 /routes 价值 | ⚠️ **部分采纳** | 保留在 footer「Crosschain demo」 |

### 4.2 审计报告 B（二次审计）— 采纳与驳回

| 建议 | 裁定 | 理由 |
|------|------|------|
| 首页 vs Guard Builder 文案矛盾 | ✅ **成立，P0** | 必须三处统一叙事 |
| 不像企业（缺 Terms/Privacy/About） | ✅ **成立，P2** | 影响信任，非阻塞 Arc 使用 |
| 现在不出代币 | ✅ **采纳** | 无用户基础 |
| 「公开 0.5% 定价」 | ❌ **驳回** | **代码无此费率，写了即虚假广告** |
| 「把 Base 从 canary 改成真双链」排第一 | ⚠️ **拆成两级** | **文案对齐 = P0**；**Base Guard Link 产品开发 = P3 大工程** |
| 月收入 $700–9,500 等预测 | ❌ **不作决策依据** | 无验证数据 |
| 恢复 Base 下拉菜单 | ❌ **不恢复 disabled 假选项** | 曾导致「点不动」；用静态标签+链接更清晰 |
| 双链长期方向 | ✅ **方向对** | Arc 差异化 + Base 真钱能力，分阶段落地 |

### 4.3 三方一致结论

1. **不要再大改首页结构** — Phase A 已完成，反复改会浪费。  
2. **必须解决「说双链、只见 Arc」的文案矛盾** — 用分层诚实叙事，不是假装产品已双链。  
3. **Canaries 不 blocking** — 用户可自测 `/canary`；团队不必代签。  
4. **推广优先于亮色 redesign** — 先让人知道，再迭代视觉。  
5. **代币、公开平台费、假用户数据 — 全部禁止**，直到产品与市场证明。

---

## 五、问题清单（分级）

### P0 — 致命（影响理解与信任，1–2 天内应完成）

| ID | 问题 | 现状 | 目标 |
|----|------|------|------|
| P0-1 | **双链叙事不一致** | 首页 BASE+ARC，Builder 仅 ARC TESTNET | 三处统一「分层叙事」（见 6.1） |
| P0-2 | **过度承诺风险** | 历史文案曾出现「Now live on Base Mainnet」类表述 | 全站检索，仅保留 canary/有界实验表述 |
| P0-3 | **0.5% 费率误传** | 外部审计建议写定价页 | **禁止**写至页面，除非先实现并审计代码 |

### P1 — 重要（影响增长，1 周内）

| ID | 问题 | 现状 | 目标 |
|----|------|------|------|
| P1-1 | **无推广动作** | 产品在线但曝光不足 | 推文 + 3 张截图 + 固定链接 |
| P1-2 | **次要页面风格旧** | /protect、/docs 等仍偏开发者风 | 统一 nav/footer（不必全页重写） |
| P1-3 | **Canaries 未验收** | Base 首笔真钱未签 | **记录为「可选」**，不阻塞发布 |

### P2 — 改进（信任与品牌，2–4 周内）

| ID | 问题 | 现状 | 目标 |
|----|------|------|------|
| P2-1 | 企业感不足 | 无 About、Privacy、Terms | 极简合规页 |
| P2-2 | Logo 弱 | 有 favicon，导航品牌弱 | favicon + 导航统一图标 |
| P2-3 | 无社会证明 | 0 用户 | **留空或写「Public testnet demo」**，不编造 |

### P3 — 战略（有人用再做）

| ID | 问题 | 说明 |
|----|------|------|
| P3-1 | Base Guard Link 全链路 | 需 network 参数、Base 支付页、x402/transfer、测试与 runbook |
| P3-2 | 平台费 monetization | 需产品设计 + 链上/链下结算 + 对外公示 |
| P3-3 | 代币与治理 | 需 ≥100 真实 recurring 用户后再评估 |
| P3-4 | 全站亮色主题 | CSS 变量级改造，约 1–2h，非 5h full redesign |

---

## 六、整改方案

### 6.1 P0：统一「双链分层叙事」（文案对齐，非产品开发）

**标准话术（英文 UI，三处一致）：**

| 元素 | 文案要点 |
|------|----------|
| Badge / Eyebrow | `USDC PAYMENT LINKS · BASE + ARC` |
| 主说明 | Guard Links run on **Arc Testnet** (demo, no real money). |
| Base 说明 | Base Mainnet: bounded **0.001 USDC x402 canary** at [/canary](/canary). |
| Guard Builder 标题区 | 与首页同套话，**不要**只写 ARC TESTNET 而无 Base 解释 |
| Footer | 保持 canary 链接 + X 在底部 |

**修改文件（预估）：**

- `src/ui.ts` — `portalHtml`、`guardBuilderHtml`、`footer`
- `tests/ui.test.ts` — 断言同步
- `docs/MESSAGING_AND_CLAIMS.md` — Mainnet 行更新为与线上一致

**验收标准：**

- [ ] 首页、Guard Builder、footer 含相同 Base/Arc 分层句意  
- [ ] 无任何「Guard Link on Base Mainnet today」类表述  
- [ ] 132 测试 + Smoke PASS  
- [ ] 部署 production  

**明确不做：**

- 不恢复 disabled Base 下拉  
- 不在此阶段实现 Base Guard Link API  

---

### 6.2 P1：推广包（不改代码也可先做）

| 步骤 | 内容 |
|------|------|
| 截图 1 | 首页 hero + CTA |
| 截图 2 | `/guard/create` 填表 + QR |
| 截图 3 | 付款请求页 / 验证页 |
| 推文（英） | Send a USDC payment link · review before sign · Arc Testnet demo · Base canary at /canary · 链接 |
| 禁止用语 | paying customers、0.5% fee、mainnet fully live、thousands of users |

参考：`docs/MESSAGING_AND_CLAIMS.md` X 模板。

---

### 6.3 P2：企业信任最小集

| 页面 | 内容 | 时间 |
|------|------|------|
| `/privacy` | 不收集私钥、不售数据、Vercel/Upstash 简述 | ~30min |
| `/terms` | 非托管、无理财承诺、testnet 免责 | ~30min |
| `/about` 或 footer 扩写 | 一人项目 / 联系方式 / GitHub | ~30min |
| Logo | 导航使用 `/favicon.svg` + 品牌字 | ~1h |

---

### 6.4 P3：真「双链 Guard Link」（产品方案，非本次必做）

**若未来要做 Base Guard Link，最小里程碑：**

1. `POST /v1/guard-links` 增加 `network: base | arc-testnet`  
2. Guard 支付页按 network 切换 USDC 合约与 chainId  
3. Base 路径：x402 exact 或 direct transfer + evidence  
4. 测试 + `docs/MAINNET_RUNBOOK.md` 更新  
5. **首笔真钱验收**（可 CLI 或用户签一次）  

**预估：** 3–10 人日，视 x402 与 UI 复用程度而定。  
**触发条件：** ≥10 外部用户主动问「Base 上怎么收链接款」或 paid pilot 书面意向。

---

### 6.5 明确「不做」清单（整改边界）

| 不做 | 原因 |
|------|------|
| 主网 canary 代签 / 要用户私钥 | 非托管；自动化在 CDP 下无法注入钱包 |
| 公开 0.5% 定价页 | 代码无实现 |
| 代币发行 | 无用户与收入 |
| 假用户 / 假交易量 | 违反项目 golden rules |
| 首页第三次大改版 | Phase A 已完成 |
| Arc 主网 Guard Link | Arc 公共主网未开放 |

---

## 七、整改计划书（时间表 · 责任 · 验收）

### Phase R0 — 文案对齐（Day 1，约 2h）

| 序号 | 任务 | 产出 | 验收 |
|:--:|------|------|------|
| R0-1 | 统一 `portalHtml` / `guardBuilderHtml` / footer 双链话术 | PR + 部署 | 人工读三页无矛盾 |
| R0-2 | 更新 `MESSAGING_AND_CLAIMS.md` | 文档 commit | 与线上一致 |
| R0-3 | 跑 `npm test` + `smoke.mjs` | CI 绿 | 132 pass |

**负责人：** 开发（Agent/维护者）  
**用户参与：** 无（不需签钱包）

---

### Phase R1 — 推广（Day 1–3，约 1h）

| 序号 | 任务 | 产出 | 验收 |
|:--:|------|------|------|
| R1-1 | 截 3 张图 | `artifacts/` 或推文附件 | 与真实 UI 一致 |
| R1-2 | 发 X 帖 | 链接点击可进 `/guard/create` | 无过度承诺 |
| R1-3 | 可选：Arc Testnet 自走一遍 Guard Link | 链上 tx 或截图 | 对外可复述流程 |

**负责人：** 产品/运营（用户或 Agent 代发）  
**用户参与：** 可选（仅 Arc 测试网）

---

### Phase R2 — 信任与品牌（Week 2，约 3h）

| 序号 | 任务 | 产出 | 验收 |
|:--:|------|------|------|
| R2-1 | Privacy + Terms 页 | `/privacy` `/terms` | footer 可点 |
| R2-2 | 导航 Logo 强化 | ui.ts + CSS | 全站一致 |
| R2-3 | 次要页 nav/footer 统一 | protect/docs/meter | 同 portalNav |

---

### Phase R3 — 真双链产品（按需，Week 4+）

| 序号 | 任务 | 触发条件 |
|:--:|------|----------|
| R3-1 | Base Guard Link 技术设计 | 外部需求 ≥10 或 pilot 意向 |
| R3-2 | 实现 + 测试 + runbook | 设计评审通过 |
| R3-3 | Base 首笔真钱 Guard Link（非 canary） | 实现完成 |

---

## 八、风险登记

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 用户因「双链」误解期望 Base Guard Link 已通 | 高 | 流失、差评 | P0 文案分层 |
| 写 0.5% 或假数据被质疑 | 中 | 信誉崩溃 | 审计报告明确禁止 |
| Arc 测试网水龙头难领 | 中 | 新用户卡住 | `/testnet-help` + 文档 |
| Base canary 长期未验收被问「主网假开」 | 中 | 信任 | 诚实写 canary experimental |
| 过早出代币 | 低 | 法律与声誉 | 100 用户门槛 |

---

## 九、决策记录（已锁定，后续不反复）

| 决策 | 日期 | 内容 |
|------|------|------|
| D-1 | 2026-07-30 | 主网 canary **不**作为团队 blocking；可省略 |
| D-2 | 2026-07-31 | 首页 **保留 BASE + ARC 品牌**，产品诚实分层 |
| D-3 | 2026-07-31 | **不**公开 0.5% 直至代码实现 |
| D-4 | 2026-07-31 | Phase A 结构 **冻结**，优先推广 |
| D-5 | 2026-07-31 | 代币 **暂缓** |
| D-6 | 2026-07-31 | Vercel `SELLER_ADDRESS=0xA0Fe…` **勿改回**用户钱包（防自付） |

---

## 十、附录

### A. 推荐对外一句话（英）

> **Send a USDC payment link. They review before they sign.**  
> Guard Links on Arc Testnet (demo). Base Mainnet bounded canary at `/canary`.

### B. 关键 URL

| URL | 用途 |
|-----|------|
| https://ledgerguard-gules.vercel.app/ | 首页 |
| https://ledgerguard-gules.vercel.app/guard/create | 创建链接 |
| https://ledgerguard-gules.vercel.app/canary | Base x402 canary |
| https://ledgerguard-gules.vercel.app/testnet-help | 测试币帮助 |
| https://ledgerguard-gules.vercel.app/v1/commercial-candidate | 主网门状态 JSON |

### C. 相关文档索引

- `docs/MESSAGING_AND_CLAIMS.md` — 对外话术边界  
- `docs/X402_E2E_EVIDENCE.md` — Arc 测试网 x402 证据  
- `docs/EXTERNAL_VALIDATION.md` — 用户/收入计数规则  
- `docs/MAINNET_RUNBOOK.md` — Base 主网操作  

### D. 报告批准与下一步

| 动作 | 建议 |
|------|------|
| **立即执行** | Phase R0 文案对齐 |
| **本周执行** | Phase R1 推广 |
| **回来时说** | 「执行 R0」或 「执行 R0+R1」 |

---

*本报告由综合审计报告 A（首页改版方案）、审计报告 B（线上二次审计）、项目 Phase A/B 验收记录及仓库事实交叉编制。对外发布前请对照 `MESSAGING_AND_CLAIMS.md` 做最终话术检查。*
