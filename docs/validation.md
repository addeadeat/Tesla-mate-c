# 第 0 期验收记录

日期：2026-09-12。验证环境：Node.js 24.19.0，npm 11.9.0；Next.js 16.3.5。以 package-lock.json 为依赖安装依据。

| 检查 | 实际结果 |
| --- | --- |
| `npm install` | 成功，生成锁文件 |
| ESLint / TypeScript | 通过 |
| `npm test` | 16 项通过：五类响应、单位转换、空/缺失值、时区、只读白名单、取消、错误脱敏、mock、密钥扫描规则 |
| `npm run build` | 成功，生成三页与 manifest；GET 代理为动态路由 |
| 开发服务器 HTTP | `/`、`/drives`、`/charges`、manifest、PNG 图标均 HTTP 200 |
| 手机浏览器检查 | Chromium，390×844；三页无横向溢出，导航可用，无页面 JavaScript 错误 |
| 场景检查 | 行程空、充电空、无车辆、API 失败、持续加载、充电状态、缺失电量，均显示预期 UI |
| 同源代理检查 | 模拟私网上游验证真实模式 GET、服务端 Bearer、历史分页；command/wake_up 被拒绝，POST 为 405，mock 模式不连接上游 |
| Compose | 本地 YAML / 服务依赖 / 镜像 / 环境引用 / 端口约束检查通过；基础、叠加和合并结果额外通过 compose-spec 官方 JSON Schema（2020-12） |
| 三个 Skill | frontmatter、名称与目录校验通过；按仓库级 Skill 保存 |
| 密钥检查 | 无真实凭据；扫描已跟踪与未忽略文件，并审阅初始提交内容 |

## 未完成的运行环境验收

- 本机未安装 Docker，没有运行 `docker compose up`、容器连接或 PostgreSQL 恢复测试。NAS 实测属于第 1 期，不能把 Schema 校验当作启动成功。
- 未连接真实 TeslaMateAPI、真实车辆或 Tesla 账号；“真实模式代理”测试使用本机模拟服务器。MQTT 初始值、过期状态和真实镜像响应仍是第 2 期 TODO。
- 未配置 Tailscale 或手机可信 HTTPS，未在真实手机安装 PWA；本次仅验证 manifest、图标和浏览器页面。
- 仓库已经具备可提交源码，但 GitHub 远端创建/上传必须另行核实，不能从本记录推定已推送。

页面级验证使用本地临时 Playwright/Chromium 工具，不给业务项目增加浏览器依赖。后续修改代理或轮询时，可以把对应测试纳入维护中的 E2E 测试套件。
