# LedgerGuard 90 天路线图

**适用对象：** 项目决策者（非技术负责人也可跟）  
**战略前提：** Arc 主战场 · Base 仅 x402 demo · 不做 Base Guard Link · 不做法币  
**起始日期：** 2026-07-31（可按实际启动日整体顺延）

---

## 总目标（90 天后应达到什么）

| 指标 | 今天 | 90 天目标 |
|------|------|-----------|
| 外部项目集成 | 0 | **≥1 个公开可复现** |
| 陌生人测试 Guard Link | 0 | **≥3 人** |
| 英文公开推广 | 少量 | **≥1 条推文 + 1 次社区露出** |
| Grant 申请 | 草稿 | **提交 1 份（Circle/Arc）** |
| 产品收入 | $0 | **仍可为 $0**（正常） |
| 网站大改 | — | **不再大改结构** |

**90 天成功的定义：** 不是赚钱，而是 **「有人以外部身份用过并留下证据」**。

---

## 三个阶段

```
第 1–4 周   让人知道 + 材料齐全
第 5–8 周   让人用起来（集成 / 试用）
第 9–12 周  沉淀证据 + Grant + 下一季规划
```

---

## 第 1–4 周：曝光与信任

### 第 1 周（已完成 / 巩固）

| 谁做 | 任务 | 状态 |
|------|------|------|
| 技术 | Arc-first 文案、About/Privacy/Terms 上线 | ✅ 已完成 |
| 你 | 打开 https://ledgerguard-gules.vercel.app/about 看一遍，确认联系方式正确 | 待做 |
| 你 | 把 Pitch 英文版存一份（`docs/PITCH_ONE_PAGER.md`） | ✅ 已有 |

### 第 2 周：第一次公开推广

| 谁做 | 任务 |
|------|------|
| 你 | 发 **1 条英文推文**（见 `artifacts/r1-promo/tweet-draft.txt` 或 Pitch 底部 hooks） |
| 你 | 推文必带：`/guard/create` + 截图 1 张 + #ArcTestnet #USDC |
| 技术 | 如需，更新截图与 Pitch 日期 |
| 你 | X 简介加一行英文：*Non-custodial USDC Guard Links on Arc Testnet* + 链接 |

**验收：** 推文已发，链接可点开。

### 第 3 周：社区露面（选 1–2 个）

| 渠道 | 动作 |
|------|------|
| Circle / Arc Discord | 在开发者频道介绍 Guard Link demo（英文，附 Pitch） |
| x402 / agent 相关群 | 发集成指南链接，问谁愿意测试网对接 |
| GitHub | README 顶部确保 demo 链接清晰 |

**验收：** 至少 **1 个渠道** 发过，有人回复或点击即可（不要求成交）。

### 第 4 周：Grant 材料

| 谁做 | 任务 |
|------|------|
| 你 | 打开 https://circle.questbook.app/ 提交（项目页 https://www.circle.com/grant） |
| 你 | 用 `docs/CIRCLE_DEVELOPER_GRANT.md` + `PITCH_ONE_PAGER.md` 填表 |
| 你 | 附上：demo 链接、GitHub、Arc 测试网 tx 示例（可问技术要） |
| 技术 | 更新 Grant 草稿里的测试数量、日期 |

**验收：** 申请表 **提交** 或 **明确记录「本季未开放」**。

---

## 第 5–8 周：让人用起来

### 第 5 周：找第一个集成方

| 谁做 | 任务 |
|------|------|
| 你 | 列出 5 个可能对象：agent 框架、bot 工具、Arc 生态小项目 |
| 你 | 用 Pitch 发 **5 封短邮件/DM**（英文，每人 5 句以内） |
| 技术 | 对方有意时，发 `PARTNER_INTEGRATION_GUIDE.md` |

**Pitch DM 模板：**

> Hi — we built LedgerGuard: non-custodial Guard Links + preflight/evidence on Arc Testnet.  
> Looking for 1 design partner to integrate on testnet (30 min HTTP path).  
> Demo: https://ledgerguard-gules.vercel.app/guard/create  
> Interested in a quick call or async test?

### 第 6 周：熟人试用

| 谁做 | 任务 |
|------|------|
| 你 | 找 **2–3 个朋友/网友** 用 Arc 测试网走一遍：创建链接 → 付款 → Verify |
| 你 | 请对方截图或给 tx hash |
| 技术 | 帮对方解决钱包/测试币问题（`/testnet-help`） |

**验收：** ≥2 人完成全流程（不要求陌生人）。

### 第 7 周：集成跟进

| 谁做 | 任务 |
|------|------|
| 你 | 跟进第 5 周联系的 5 人，问是否需要帮助 |
| 技术 | 若有人集成：帮跑 `examples/quickstart.mjs`，收 `X-LedgerGuard-Request-Id` |
| 你 | 在 GitHub 开 **Independent integration evidence** issue（见 `EXTERNAL_VALIDATION.md`） |

**验收：** 1 个项目愿意公开 integration id 或 tx hash。

### 第 8 周：案例沉淀

| 谁做 | 任务 |
|------|------|
| 技术 | 写 **1 页英文 case study**（谁、做了什么、tx/request id） |
| 你 | 发第二条推文：*First external testnet integration*（若有） |
| 你 | 更新 X 置顶或 GitHub README 一句 traction |

**验收：** 对外可展示的 **1 个案例**（哪怕很小）。

---

## 第 9–12 周：证据与下一季

### 第 9 周：重复验证

| 任务 |
|------|
| 同一集成方或第二个用户在 **不同日期** 再跑一次 |
| 满足 `EXTERNAL_VALIDATION.md` 的 repeat-use 门槛 |

### 第 10 周：Arc 主网情报

| 任务 |
|------|
| 关注 Circle/Arc 主网公告 |
| 技术评估：主网参数公布后切换 Guard Link 的工作量 |
| **仍不做 Base Guard Link** |

### 第 11 周：安全与信任（轻量）

| 任务 |
|------|
| 自检：Privacy/Terms 是否与现网行为一致 |
| 可选：申请轻量安全审查或社区 code review |
| 不做法币、不出代币 |

### 第 12 周：复盘与 Q2 规划

| 你回答 4 个问题 |
|----------------|
| 1. 有几个外部集成？ |
| 2. Grant 结果或下一步？ |
| 3. 是否有人主动问「主网什么时候」？ |
| 4. 下一季继续 Arc 还是需 pivot？ |

**输出：** 一页「下一季 90 天」决策（可再让技术协助写）。

---

## 每周你只需记的三件事

1. **发/回一条英文消息**（推文、DM、Discord 任选）  
2. **推进一步试用**（找人点链接或集成）  
3. **不扩大范围**（不加 Base Guard Link、不做法币、不大改网站）

---

## 明确不做清单（90 天内）

- ❌ Base 主网 Guard Link 开发  
- ❌ 自己做法币支付 / 申请支付牌照  
- ❌ 出代币、写假用户/假收入  
- ❌ 首页第四次大改版  
- ❌ 对外写 0.5% 平台费（代码未实现）

---

## 与技术分工（你不懂技术也没关系）

| 你负责 | 技术/Agent 负责 |
|--------|----------------|
| 推文、DM、Grant 填表 | 代码、部署、集成调试 |
| 找人试用、收截图 | E2E、tx hash、API 示例 |
| 读 Pitch/About 确认事实 | 文档、测试、smoke |
| 决定「做 or 不做」 | 评估工作量与风险 |

---

## 相关文档

- 英文 Pitch：`docs/PITCH_ONE_PAGER.md`  
- 集成指南：`docs/PARTNER_INTEGRATION_GUIDE.md`  
- 对外话术边界：`docs/MESSAGING_AND_CLAIMS.md`  
- 集成证据门槛：`docs/EXTERNAL_VALIDATION.md`  
- Grant 草稿：`docs/CIRCLE_DEVELOPER_GRANT.md`
