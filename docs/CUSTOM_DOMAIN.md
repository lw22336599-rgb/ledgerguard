# 自定义域名指南（让官网更专业）

**现状：** 生产地址是 `https://ledgerguard-gules.vercel.app`  
**问题：** 太长、带随机词 `gules`，不像正式产品  
**目标：** 对外统一用 **`https://ledgerguard.app`**

---

## 域名怎么选？（结论）

| 选项 | 示例 | 专业度 | 费用 | 建议 |
|------|------|--------|------|------|
| **`.app`** | `ledgerguard.app` | ⭐⭐⭐⭐⭐ | 约 $14–20/年 | **首选** — 短、像正式 App |
| **`.com`** | `ledgerguard.com` | ⭐⭐⭐⭐⭐ | 可能更贵/已被注册 | 若可买也很好 |
| **`.io`** | `ledgerguard.io` | ⭐⭐⭐⭐ | 常见 crypto 风格 | 备选 |
| **`.vercel.app`** | `ledgerguard-gules…` | ⭐⭐ | 免费 | 仅开发/过渡，不宜写进 X Bio |

**不推荐：** `ledgerguard.help` 等变体 — 网上有钓鱼站撞名，易误导。

**我们推荐你买：`ledgerguard.app`**

---

## 为什么 `ledgerguard.vercel.app` 不能用？

该地址已被 **别的 Vercel 项目** 占用（不是我们这个 Guard Link 站点）。  
所以 Vercel 自动给我们的项目加了 `-gules` 后缀。

---

## 操作步骤（你只需做 3 步，约 20 分钟）

### 第 1 步：购买域名

推荐 **Cloudflare Registrar**（平价、DNS 简单）：

1. 注册 / 登录 https://dash.cloudflare.com  
2. 左侧 **Domain Registration** → **Register Domains**  
3. 搜索 **`ledgerguard.app`**  
4. 若可买 → 付款完成（通常 $14–20/年）

也可用 Namecheap、Google Domains 等，步骤类似。

### 第 2 步：在 Vercel 绑定域名

1. 打开 https://vercel.com → 项目 **`ledgerguard`**  
2. **Settings** → **Domains**  
3. 输入 **`ledgerguard.app`** → Add  
4. 再添加 **`www.ledgerguard.app`**（可选，Vercel 会提示重定向）  
5. 按 Vercel 提示，到 Cloudflare DNS 添加 **A / CNAME** 记录（Vercel 页面会显示具体值）  
6. 等待 5–30 分钟，状态变为 **Valid**

### 第 3 步：设置生产环境变量

在 Vercel → **Settings** → **Environment Variables**：

| Name | Value | Environment |
|------|-------|-------------|
| `PUBLIC_BASE_URL` | `https://ledgerguard.app` | Production |

保存后 → **Deployments** → 最新部署 → **Redeploy**。

之后 Guard Link、OpenAPI、x402 回调等会自动用新域名（代码已支持 `PUBLIC_BASE_URL`）。

---

## 旧链接还会能用吗？

**会。** `ledgerguard-gules.vercel.app` 仍是 Vercel 别名，不会立刻失效。  
建议在 X Bio、推文、Pitch 里 **只写新域名**。

---

## X / 推文 / Pitch 应改成

| 字段 | 新值 |
|------|------|
| 网站 | `https://ledgerguard.app/guard/create` |
| Bio 链接 | 同上（直达创建页） |

Bio 文案（方案 A，已缩短）：

```
Send a USDC payment link on Arc Testnet.
Review amount, recipient & purpose before signing.

Non-custodial · Guard Links for humans & agents

Create a link ↓
```

---

## 代码里域名在哪里改？

**唯一关键配置：**

- Vercel 环境变量 **`PUBLIC_BASE_URL`**（生产必设）
- 本地默认：`src/config/public.ts` 中的 `DEFAULT_PUBLIC_BASE_URL`

域名生效后，我们会把仓库默认值同步为 `https://ledgerguard.app` 并更新文档链接。

---

## 临时免费方案（不如 `.app` 专业）

若暂时不买域名，可尝试更短的 Vercel 别名（如 `ledgerguard-usdc.vercel.app`），但：

- 仍带 `vercel.app`，不够正式  
- 可能触发 Vercel 团队 SSO 保护，需到 **Deployment Protection** 里把该域名设为公开  

**长期仍建议买 `ledgerguard.app`。**

---

## 常见问题

**Q：买了域名就能赚钱吗？**  
A：不能。域名只让链接更专业；产品和用户仍靠 Guard Link + 集成。

**Q：`.app` 和 `.com` 差很多吗？**  
A：对 Web3 小产品，`.app` 足够专业；Grant 和 X 上都很常见。

**Q：我不会 DNS 怎么办？**  
A：买完域名后把 Vercel Domains 页面截图发给我们，可逐步指导填 DNS。

---

## 完成后 checklist

- [ ] `https://ledgerguard.app` 打开是 LedgerGuard 首页  
- [ ] `https://ledgerguard.app/guard/create` 能创建链接  
- [ ] Vercel `PUBLIC_BASE_URL` 已设  
- [ ] X Bio 链接已更新  
- [ ] 新 Guard Link 的 URL 以 `ledgerguard.app` 开头
