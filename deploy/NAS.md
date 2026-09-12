# 极空间部署（局域网）

本次准备部署文件，不代填密钥、不启动真实采集。极空间系统版本不同，Compose 入口名称可能是“Docker → 项目/Compose → 新建项目”；如果没有该入口，先确认系统的 Docker Compose 支持情况，不改用来源不明的采集镜像。

## 用户在极空间的五步

1. **准备目录和 Compose 项目。** 在自己的存储池下建 `docker/Z/deploy`，把本仓库 `deploy/` 内容复制进去。另把根 `.env.example` 复制为该目录的 `.env`，新建项目名 `z-teslamate`，基础文件选 `docker-compose.yml`。命令行操作也从这个 `deploy` 目录运行；固定项目名防止误建另一组 volumes。
2. **私下配置环境。** 给 NAS 设固定局域网地址/路由器 DHCP 保留地址。在 `.env` 中把 `BIND_ADDRESS` 改为 NAS 的真实局域网 IP（不能填 0.0.0.0、::）。本机用密码管理器分别生成至少 32 字符的 `ENCRYPTION_KEY` 和强数据库密码，写入 `.env`；不要发到聊天或提交 Git。两个值不同，ENCRYPTION_KEY 不是 Tesla token。保存密钥备份。界面必须加载这个 `.env`；若界面不支持，使用它提供的环境变量输入并避免截图泄漏。
3. **校验并启动四件套。** 先做下方 `config --quiet`，再启动。不要启动 API 叠加文件。确认 database 健康，TeslaMate / Grafana / Mosquitto 正常运行；只在同一局域网打开 `http://NAS局域网IP:4000` 与 `http://NAS局域网IP:3000`。遵循 [TeslaMate 官方 token 说明](https://docs.teslamate.org/docs/installation/tokens/) 完成官方 TeslaMate 的配置；本仓库不提供登录代码。Grafana 首次登录立刻修改默认管理员密码。
4. **验收记录与休眠。** 确认 TeslaMate 单位设为 km、温度按需，时区 Asia/Hong_Kong。正常出行/充电后核对 Grafana 记录；正常停车后观察车辆可进入 asleep。不要为了验证不断刷新 Tesla App 或发唤醒请求，先排查哨兵/第三方轮询等已知唤醒来源。前端本阶段仍在笔记本跑 mock。
5. **备份，再安排私网接入。** 按下文执行逻辑备份并做一次隔离恢复检查，保留 `.env` 密钥和 Grafana 数据的独立备份。出门只用 Tailscale；配置到 NAS 的私有访问，禁止公网映射。第 2 期才叠加 TeslaMateAPI 并连接前端真数据。

## 命令与端口

以下在 NAS 的 `deploy` 目录运行（没有终端时在 Compose 界面执行等价的配置检查与启动）：

```sh
docker compose --env-file .env config --quiet
docker compose --env-file .env up -d
docker compose --env-file .env ps
```

| 服务 | 内部地址 | 默认主机端口 | 冲突时 |
| --- | --- | --- | --- |
| TeslaMate | teslamate:4000 | 4000 | 改 `.env` 的 TESLAMATE_PORT |
| Grafana | grafana:3000 | 3000 | 改 GRAFANA_PORT=3001，容器内仍 3000 |
| TeslaMateAPI（第 2 期） | teslamateapi:8080 | 8080 | 改 API_PORT |
| PostgreSQL | database:5432 | 不发布 | 不填 NAS IP |
| MQTT | mosquitto:1883 | 不发布 | 不填 NAS IP |

`BIND_ADDRESS=127.0.0.1` 是安全初始值：其他局域网设备此时连不上，这是预期。部署到 NAS 后必须指定 NAS 已配置的 LAN IP。不要仅写 `4000:4000` 这种省略 host IP 的映射。容器内部 `DATABASE_HOST=database`、`MQTT_HOST=mosquitto` 不随 NAS IP/外部端口改变。

## 第 2 期的 API 与手机 PWA

```sh
docker compose --env-file .env -f docker-compose.yml -f docker-compose.api.yml config --quiet
docker compose --env-file .env -f docker-compose.yml -f docker-compose.api.yml up -d
```

叠加文件不能单独运行；与基础服务共用网络、数据库、MQTT 和 ENCRYPTION_KEY。`API_TOKEN` 可选，它不保证给所有 GET 数据接口提供统一鉴权；保护靠可信局域网/Tailscale。所有车控禁用，车控接口“二期再开”只是后续需单独确认的占位。

在笔记本的 `apps/web/.env.local` 配 `NEXT_PUBLIC_USE_MOCK=false`、`NEXT_PUBLIC_API_BASE=http://NAS局域网IP:8080`，如设置了 API_TOKEN，则同值填入服务端 `TESLAMATE_API_TOKEN`。不要填 NEXT_PUBLIC_API_TOKEN。重启开发服务器后前端请求同源 Next 代理，没有浏览器跨域问题；浏览器页面不直接访问 NAS API。

前端默认端口 3100，避免和 Grafana 冲突。若要手机在开发期查看，用笔记本明确 LAN IP 启动：`npm run dev --workspace @z/web -- --hostname 笔记本局域网IP`；不监听全部网卡。生产 PWA 安装应使用可信 HTTPS（localhost 仅供电脑开发），裸局域网 HTTP 不保证可安装。

外出连接 Tailscale 后，使用 NAS LAN 地址需要已配置且获批准的子网路由；不要假设绑定 LAN IP 的端口会自动出现在 Tailscale IP 上。第 2 期也可选 Tailscale Serve 的 tailnet 私有 HTTPS，将前端与后端放在合适的私网可达位置；不启用 Funnel。需在该阶段根据极空间可用能力实测，不在本次伪造安装步骤。NAS 只跑容器，正式前端 Dockerfile/Compose 留第 2 期任务，不要求在 NAS 安装 Node。

## 数据库备份与恢复演练

命名卷 `teslamate-db` 在固定项目下通常显示为 `z-teslamate_teslamate-db`。确认项目名后识别，不要误备份空卷。优先用 PostgreSQL 17 自带的逻辑备份，允许数据库运行：

```sh
mkdir -p backups
chmod 700 backups
backup_path="backups/teslamate-$(date +%Y%m%d-%H%M%S).dump"
umask 077
docker compose --env-file .env exec -T database sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup_path"
test -s "$backup_path"
docker compose --env-file .env exec -T database pg_restore --list < "$backup_path" > /dev/null
```

检查退出码，失败时不要把不完整文件当备份。`.dump` 不能提交，复制到独立设备/加密存储，密钥独立保存。列出归档只能验证格式；还需在**新建的隔离 PostgreSQL 17 数据库/卷**中恢复，检查表与记录，不能直接恢复覆盖生产库。这里 `-Fc` 生成自定义归档，恢复使用 `pg_restore`，不能用 `psql < dump`。参考 [官方备份](https://docs.teslamate.org/docs/maintenance/backup/) 与 [恢复](https://docs.teslamate.org/docs/maintenance/restore/) 页面；官方纯 SQL 示例与这里归档格式不同。

若使用极空间的 volume 物理备份功能：先停止 TeslaMate、Grafana、TeslaMateAPI 的写入/访问，然后停止 database，再复制整个 PostgreSQL volume。Grafana 配置卷、Mosquitto 配置/数据卷同样在停止相应服务后备份。记录镜像版本，恢复到匹配的大版本。**不能在线直接拷贝 PGDATA；不能执行 `docker compose down -v`。**

PostgreSQL 17 数据挂载点是 `/var/lib/postgresql/data`。官方示例可能已升级其他大版本，本仓库明确保留 17；不可仅改镜像到 18 就复用同一卷。升级前查看官方迁移说明、做备份和隔离演练。
