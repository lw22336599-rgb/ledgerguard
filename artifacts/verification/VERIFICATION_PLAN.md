# LedgerGuard 验证档案（Verification Archive）

> 维护：执行CEO 自动归档
> 更新：2026-08-03（含真实执行记录）

本目录存放 LedgerGuard 产品验证的**真实执行证据**。原则：只记录真实运行的结果，不伪造任何测试结果或链上记录。

## ✅ 真实执行记录（2026-08-03，本地实例 127.0.0.1:3097）

### 1. 服务启动 + 页面检查（真实 HTTP 请求）
| 检查项 | 方法 | 结果 |
|:------|:-----|:-----|
| /health | curl GET | ✅ 200 `{"ok":true,"service":"ledgerguard"}` |
| / 首页 | curl GET | ✅ 200，含 `html lang="en"` + `href="/pay"` |
| /docs | curl GET | ✅ 200，含 "API documentation" |
| /v1/meta | curl GET | ✅ 200，服务元数据完整 |
| /v1/networks | curl GET | ✅ 200，arcTestnet enabled + arcMainnet 信息 |

### 2. Preflight 引擎真实调用（POST /v1/preflight）
| 场景 | 结果 | 说明 |
|:-----|:-----|:-----|
| 正常 USDC transfer | BLOCK + `SIMULATION_FAILED` | RPC 断网时 fail-closed，符合设计（不静默放行） |
| **零地址收款（第7环）** | **BLOCK + `ZERO_ADDRESS_RECIPIENT`** | ✅ **第7环威胁检测真实生效** |

### 3. SDK 参考集成真实调用（@ledgerguard1/sdk → 本地 API）
| 集成 | 方法 | 结果 |
|:-----|:-----|:-----|
| agent-mcp 模式 | SDK preflight | ✅ 链路通（BLOCK + SIMULATION_FAILED，fail-closed 正确） |
| 零地址场景（SDK） | SDK preflight | ✅ BLOCK + `ZERO_ADDRESS_RECIPIENT` |

### 4. 自动化测试 + 类型检查
| 检查项 | 结果 |
|:------|:-----|
| vitest 全量 | ✅ **29 文件 / 160 测试全绿** |
| tsc typecheck | ✅ 无错误 |

### 5. 已知缺口（如实记录，不假装完成）
| 缺口 | 原因 | 依赖 |
|:-----|:-----|:-----|
| 测试网批量真实交易 | Arc RPC 当前不可达（网络断） | 境外网络/梯子 |
| 主网真钱自测 | 需网络 + 出资人批准 | 网络 + 批准 |
| SDK 0.1.1 npm 发布 | npm registry 不可达 | 网络 |
| /ready 端点 | Arc Testnet RPC 不可达 → 503 | 网络 |

## 历史证据（2026-07-30，网络正常时产生）

### guard-link-evidence.json
- 真实 txHash：`0x2b536c8c0c6789482c0792290c1f310cb5a75532247ac394270707015c02098b`
- Arc 测试网 block 54434949，arcscan 可核实
- Guard 判定 ALLOW（签名前校验通过）；Evidence 对账 MISMATCH（引擎正确识别不一致）

### x402-payment-evidence.json
- x402 测试网付费证据接口，HTTP 200

## 验证计划（网络恢复后执行）

- [ ] 测试网批量：10-20 钱包 × 100+ 笔真实交易
- [ ] 主网真钱：Base 主网 5-10 笔（需批准）
- [ ] SDK 0.1.1 发布
- [ ] 3 个参考集成在官网环境跑通

## 不可伪造红线

- 本目录只记录真实执行结果（txHash 可链上核实、HTTP 响应可复现）
- 网络不通时写"缺口/依赖"，不写"已通过"
- 任何对外展示的数据必须能核实
