# Tesla-mate-c · Z

GitHub 仓库名为 `Tesla-mate-c`，项目内部名称为 **Z**；包名和 NAS Compose 项目名沿用 Z。

自用 Tesla 数据查看系统的第 0 期骨架。**本仓库不是 TeslaMate 本体**，不会登录 Tesla、刷新 token 或控制车辆。TeslaMate 官方 Docker 采集，PostgreSQL 存数据，MQTT 提供缓存状态；手机界面由这里逐步开发。

本次交付可在笔记本运行的 mock 三页、只读 API 客户端、NAS 部署文件和 Codex 任务约定。**尚未连接你的车辆，也未在你的极空间启动服务。** 前端生产容器、Tailscale 私有 HTTPS 和真实数据联调属于第 2 期。

| 部分 | 负责什么 | 运行位置 |
| --- | --- | --- |
| 本仓库 Next.js 前端 | 当前状态、行程、充电；默认演示数据 | 现在在笔记本开发 |
| 官方 TeslaMate | 采集并写入数据库、发布 MQTT 状态 | 极空间 Docker |
| PostgreSQL / Mosquitto | 历史数据 / 实时状态消息 | 极空间 Docker 内部网络 |
| 官方 TeslaMate Grafana | 查看历史报表 | 极空间 Docker |
| 可选 TeslaMateAPI | 读取已采集数据，供前端只读代理使用 | 第 2 期叠加部署 |

## 本地启动 mock

安装 Node.js 22.13+ 或 24 LTS、npm 10+，在笔记本终端执行：

```sh
git clone https://github.com/addeadeat/Tesla-mate-c.git
cd Tesla-mate-c
npm install
npm run dev
```

已有仓库时，直接在仓库根目录执行最后两条命令。若使用此前交付的 `Z.bundle`，用 `git clone Z.bundle Z`、`cd Z` 代替上面的克隆和进入目录命令；bundle 是当时的源码快照，后续更新以 GitHub 仓库为准。

打开 **http://127.0.0.1:3100**。无需 `.env`、Docker、Tesla 账号或真实 API。三页：当前状态 `/`，行程 `/drives`，充电 `/charges`；默认明确显示“演示数据”。3100 避免占用 Grafana 的 3000。

```sh
npm run check
npm run build
npm start
```

`check` 包含 ESLint、TypeScript、客户端测试、Compose 静态检查、密钥扫描。`build` 是 Next 生产构建。提交了 package-lock.json，稳定复现时用 `npm ci`。不要以为前端测试通过就已经完成真实 NAS 联调。

## 环境与测试场景

只有根 `.env.example` 是可提交模板。部署时复制到 `deploy/.env`；前端需要改配置时复制到 `apps/web/.env.local`，只填写前端段，其余敏感字段保持空。Next 从 `apps/web` 读环境，根 `.env` 不自动当作前端配置。

默认 `NEXT_PUBLIC_USE_MOCK=true`。例如在 `apps/web/.env.local` 写以下两行，再重启开发服务器，就能检查 API 失败态：

```dotenv
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_MOCK_SCENARIO=error
```

场景每次只选一个：`normal`、`loading`、`empty`、`error`、`no-cars`、`online`、`asleep`、`charging`、`driving`、`missing`。默认 normal 是正常静态演示；loading 故意持续等待；empty 是有车无记录；no-cars 是尚无车辆；missing 是部分字段缺失。恢复正常演示时改回 `normal`。

第 2 期连接真实数据：

```dotenv
# 写到被忽略的 apps/web/.env.local；不是 Tesla 登录配置
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8080
TESLAMATE_API_TOKEN=
```

笔记本连 NAS 时把 base 的 127.0.0.1 换为 NAS 局域网 IP。只填 origin，不加 `/api/v1`；Next 的 GET 白名单代理补齐路径。真实模式连接失败会显示错误，不回落到 mock。`TESLAMATE_API_TOKEN` 是可选的 TeslaMateAPI 访问凭据，只在服务端使用；**NEXT_PUBLIC_API_TOKEN 保留空白，不使用**。API_TOKEN 并不等于 Tesla token，也不保证上游 GET 接口受保护。参阅 [接口约定](docs/teslamate-api.md)、[安全约定](docs/security.md)。

开发模式改环境后重启；生产模式更改 `NEXT_PUBLIC_*` 后须重新 `npm run build` 再启动（它们在构建时内联）。不要仅重启旧构建，否则界面的数据模式可能与服务端不一致。

PWA 包含 manifest、192/512 PNG 和 Apple 图标；使用浏览器的“添加到主屏幕”。电脑 localhost 可开发，手机安装需要私有可信 HTTPS，例如第 2 期配置的 Tailscale Serve。没有 service worker 离线缓存、推送或登录系统。

## 极空间部署

把 `deploy/` 放到极空间自己的 `docker/Z/deploy`，将根 `.env.example` 复制为里面的 `.env`，按 [NAS 中文说明](deploy/NAS.md) 的五步执行。初始只运行四件套，API 第 2 期再叠加。容器内数据库地址固定 `database`、MQTT 固定 `mosquitto`。

你接下来在极空间的五步：

1. **复制文件并新建 Compose 项目。** 准备上述目录，基础文件选 `docker-compose.yml`；确保同目录的 `.env` 被项目加载。
2. **私下填写配置。** 设置固定 NAS 局域网 IP，将 `.env` 的 `BIND_ADDRESS` 改为该 IP；分别生成并填写 `ENCRYPTION_KEY`、`DATABASE_PASS`。加密密钥不是 Tesla token，不把任何真实凭据提交到仓库。
3. **检查配置、启动四件套。** 使用下方命令或 Compose 界面的等价操作；局域网打开 `http://NAS局域网IP:4000` 和 `http://NAS局域网IP:3000`，立即修改 Grafana 默认管理员密码。
4. **验收实际数据和休眠。** 按官方说明配置 TeslaMate，核对时区与 km 单位；正常出行、充电后检查 Grafana 记录，停车后观察 asleep。笔记本前端此时仍显示 mock。
5. **备份并准备私网访问。** 按 [备份与恢复演练](deploy/NAS.md#数据库备份与恢复演练) 备份数据库并验证隔离恢复，另存加密密钥。出门用 Tailscale，API 与前端真数据接入留第 2 期。

以下命令在 NAS 的 `deploy` 目录运行，先填写 `.env` 再执行：

```sh
docker compose --env-file .env config --quiet
docker compose --env-file .env up -d
docker compose --env-file .env ps
```

| 访问目标 | 默认地址 / 端口 | 配置要点 |
| --- | --- | --- |
| 笔记本 mock 前端 | `http://127.0.0.1:3100` | 127.0.0.1 指当前设备，手机不能用它访问笔记本 |
| NAS TeslaMate | NAS 局域网 IP 的 4000 | `TESLAMATE_PORT` 改主机端口 |
| NAS Grafana | NAS 局域网 IP 的 3000 | 占用时设 `GRAFANA_PORT=3001` |
| 可选 NAS API | NAS 局域网 IP 的 8080 | 仅叠加 API 文件后存在 |
| 数据库 / MQTT | 不发布主机端口 | 容器间用 `database` / `mosquitto` |

端口默认绑定回环。局域网访问需明确配置 NAS IP，不开放公网。Grafana 首次使用改默认密码，出门用 Tailscale，先备份再升级。NAS 不装开发工具，只跑容器；生产前端容器化列入第 2 期。

Tesla token 的取得只参阅 [TeslaMate 官方 Generating Tokens](https://docs.teslamate.org/docs/installation/tokens/) 和 [tesla_auth 项目](https://github.com/adriankumpf/tesla_auth)。不在本仓库输入 Tesla 密码，不把密码交给第三方网页。

## 常见问题

| 现象 | 检查方法 |
| --- | --- |
| 修改环境变量后没有生效 | 前端文件放 `apps/web/.env.local`；开发重启，生产重新构建。Compose 用 `deploy/.env`，两者独立。 |
| 手机 / 笔记本连不上 NAS | 确认 `BIND_ADDRESS` 是 NAS 已配置的局域网 IP，设备在同一可信网络，端口未占用。默认回环绑定不接受其他设备访问。 |
| Compose 提示密钥或密码未设置 | 确认 `.env` 被加载且必填值非空；不要把配置输出或凭据贴到公开问题中。 |
| 已启动四件套但前端仍是演示 | 这是默认行为。第 2 期启动 API 后，显式关闭 mock，并将 API base 指向 NAS；只填 origin，不带 `/api/v1`。 |
| 真数据页面报错 | 检查 API 容器、地址和响应是否符合 [接口约定](docs/teslamate-api.md)。仅提供脱敏样本；失败不会伪装成演示成功。 |
| 手机没有安装 PWA 的选项 | manifest 和图标已提供；局域网 HTTP 不保证安装，正式使用需配置可信私有 HTTPS，详见 NAS 文档。 |

当前检查记录见 [验证说明](docs/validation.md)。本地构建通过不代表已经验证 NAS 容器运行、Tesla 授权或真实车辆数据。

## 仓库约定与任务

`AGENTS.md` 是每次任务的规则。`.agents/skills/` 内三个仓库级 Skill 可在以本仓库为工作目录的 Codex 中使用：`$teslamate-ui`、`$nas-compose`、`$safe-commit`。它们随仓库分发，不等于已安装到所有对话的全局 Skill 列表。

- `apps/web`：Next.js App Router + TypeScript + 移动优先 CSS。
- `packages/api-client`：上游字段的最小类型、校验转换、GET client 和 mock。
- `deploy`：官方 TeslaMate 四件套、API 叠加文件、极空间说明。
- `docs/product.md`：分期与非目标；`docs/tasks.md`：可执行任务与验收。

时区 `Asia/Hong_Kong`；距离 km；能量 kWh；电耗 Wh/km。最近记录按开始时间倒序；缺失值不伪装为 0。不嵌入 Grafana iframe。

下次可以直接说：

> `$nas-compose` 帮我逐项验收极空间四件套、局域网绑定和备份恢复，不启动任何车控。

> `$teslamate-ui` 根据我的 TeslaMateAPI 脱敏响应核对五类类型，接通真数据，保持休眠轮询策略。

> `$nas-compose` 给前端增加 NAS 运行容器和 Tailscale 私有 HTTPS 部署，禁止公网，保留 mock 开关。

> `$teslamate-ui` 只调整这三个页面的手机样式，保持接口、单位和空/加载/失败态。

## 上游依据

[TeslaMate Docker](https://docs.teslamate.org/docs/installation/docker/)、[TeslaMateAPI README / src](https://github.com/tobiasehlert/teslamateapi)、[Next.js PWA](https://nextjs.org/docs/app/guides/progressive-web-apps)。API 字段采用上游源码 JSON 名称；本次不复制或修改采集项目源码。最新镜像与实际部署版本仍需第 2 期用脱敏样本核对。
