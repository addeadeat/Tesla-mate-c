# Z — Tesla 自用数据看板

本仓库是 TeslaMate 周边的只读界面、部署文件和任务框架，不是 TeslaMate 本体。
笔记本开发；极空间 NAS 24 小时运行 Docker 容器。第 0 期只交付 mock 三页及可运行骨架。

## 每次任务的边界

- 采集层只用 `teslamate/teslamate`、`teslamate/grafana` 官方镜像；不 fork、不修改 TeslaMate 源码。
- 禁止实现 Tesla Owner API / Fleet API 登录、token 刷新、命令签名、唤醒、解锁、空调等车控。
- 不接 Tesla 官方登录，不做登录系统、小程序、App Store、Home Assistant、社交、多用户。
- 仅允许 `docs/teslamate-api.md` 列出的 GET 数据接口；不代理任意 URL、command、logging 或 wake_up。
- 不开放公网，不使用极空间远程访问，不绑定 `0.0.0.0` / `::`。局域网绑定必须是明确的 NAS IP；出门用 Tailscale。
- 不提交真实 token、ENCRYPTION_KEY、数据库密码、数据库备份、真实行程。环境模板仅 `.env.example`，秘密只放被忽略的本地 `.env`。
- `NEXT_PUBLIC_*` 对浏览器可见；`NEXT_PUBLIC_API_TOKEN` 只保留空的兼容占位，不读取。真实 API 凭据仅用服务端 `TESLAMATE_API_TOKEN`。

## 启动与检查（仓库根目录）

- Node.js 22.13+ 或 24 LTS，npm 10+；`npm install && npm run dev`；打开 `http://127.0.0.1:3100`。
- 默认 mock 无需 `.env`，无需 Docker。`npm run build && npm start` 验证生产构建。
- `npm run lint`、`npm run typecheck`、`npm test`；`npm run check` 一次运行以上检查及静态部署校验。
- `npm run check:secrets` 扫描已跟踪和未忽略文件；`npm run check:compose` 校验结构与部署约束。
- 后端第 1 期：复制根 `.env.example` 为 `deploy/.env`，私下填密钥，`cd deploy && docker compose --env-file .env config --quiet && docker compose --env-file .env up -d`。
- 后端第 2 期：在上条命令中加入 `-f docker-compose.yml -f docker-compose.api.yml`；详见 `deploy/NAS.md`。没有 Docker 时不强行启动，不声称完成容器验收。

## 目录与数据约定

- `apps/web`：Next.js App Router，`/` 状态、`/drives` 行程、`/charges` 充电；移动优先 CSS；不嵌入 Grafana iframe。
- `packages/api-client`：上游 wire 类型、校验/转换、mock、只读 client；页面不得自造 Tesla API 请求。
- `deploy`：NAS Compose 与操作说明；`docs`：范围、接口、安全、任务清单；`.agents/skills`：仓库级 Skill。
- API 时间保存为 RFC3339；展示时区固定 `Asia/Hong_Kong`；距离 km，能量 kWh，电耗 Wh/km 或 kWh/100km。
- 单位按 API 的 `units` 校验，未知单位报错；缺失值显示“暂无数据”，不得伪造为 0 或把 rated/ideal range 冒充 estimated range。
- 状态在线最多每 60 秒读一次缓存，asleep 至少 15 分钟，未知/离线至少 5 分钟；后台标签停止，单请求在途，失败退避。历史列表首次进入和手动刷新即可。
- 接入真实版本前核对上游文档与样本；不确定字段写 TODO，不扩大字段集。

## Skill 与提交

改前端或接 API 用 `$teslamate-ui`；改极空间部署用 `$nas-compose`；提交前用 `$safe-commit`。
这些是当前仓库的 Skill，目录名与 frontmatter `name` 一致；在以本仓库为工作目录的 Codex 中发现。
提交前必须检查 `git status --short`、`git diff`、`git diff --cached`，跑 lint/test 与密钥检查。不要用 `git add -f` 绕过忽略规则。只提交本任务文件，不打印秘密或上游原始错误响应。
