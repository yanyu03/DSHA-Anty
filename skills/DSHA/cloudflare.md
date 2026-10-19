# DSHA Cloudflare 工具直通引擎 (Cloudflare Conduit)

> **分支特性 (DHSA-TestWeb)**：为 DSHA 体系接入 Cloudflare 现代边缘与 Web 开发生态（Workers、Pages、Tunnels、KV、D1、R2），建立直通 Cloudflare 的安全执行管道。

---

## 1. 核心能力与直通指令 (Conduit Operations)

通过纯 ASCII 启动器 `bin\cf.cmd`（或全局 PATH 中的 `cf`）直接调用：

| 指令 | 说明 | 对应底层操作 |
|---|---|---|
| `cf status` | 检查 Node.js、Wrangler、Tunnel 状态及鉴权网络情况 | 全环境自适应体检 |
| `cf whoami` | 显示当前登录的 Cloudflare 账户信息 | `wrangler whoami` |
| `cf dev [args]` | 启动本地边缘函数或 Web 开发服务器 | `wrangler dev [args]` |
| `cf deploy [args]` | 部署 Worker 或静态站点至 Cloudflare 边缘节点 | `wrangler deploy [args]` |
| `cf pages [args]` | 管理 Cloudflare Pages 静态与全栈站点 | `wrangler pages [args]` |
| `cf tunnel [args]` | 启动 Cloudflare Tunnel 内网穿透隧道 | `cloudflared [args]` |
| `cf selftest` | 运行内置 5 项环境与指令映射自检 | 自动化单元检验 |

---

## 2. 网络与代理自适应 (Proxy Awareness)

由于部分境内网络环境下访问 Cloudflare API 端点（`api.cloudflare.com`）可能存在握手延迟，DSHA Cloudflare 直通引擎内置了智能网络探测机制：
1. **自动继承本地代理**：若系统未显式声明代理，引擎会自动探测并借道本地 `127.0.0.1:10808` (Socks5) 或 `127.0.0.1:10809` (HTTP) 建立稳定 TLS 会话；
2. **UTF-8 字符流隔离**：彻底解决 Windows 控制台在输出 Cloudflare 专有 Emoji（如 ⛅️）时触发的 GBK `UnicodeDecodeError` 编码崩溃；
3. **免登录预览友好**：在未登录凭据时，支持通过 `cf deploy --temporary` 创建临时预览 Worker 进行技术论证。
