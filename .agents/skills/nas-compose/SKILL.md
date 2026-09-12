---
name: nas-compose
description: 修改 Z 的极空间 NAS、Docker Compose、容器端口、数据库备份或 Tailscale 部署说明时使用；触发词包括“极空间部署”“compose”“端口冲突”“备份 volume”。不用于前端样式、Tesla 登录或公网部署。
---

# NAS Compose

读 `AGENTS.md` 和 `deploy/NAS.md`。基础四件套保持官方 TeslaMate 镜像、PostgreSQL 17、Mosquitto 2；TeslaMateAPI 只是可选读取层，不能替换采集层。不改 TeslaMate 源码。

容器之间使用 Compose DNS：`DATABASE_HOST=database`、`MQTT_HOST=mosquitto`，不是 NAS IP、localhost 或宿主机映射端口。`ENCRYPTION_KEY` 是加密数据库内 Tesla token 的本地密钥，不是 Tesla token；与数据库备份一起妥善保存，不能随便重生成。

默认 host IP 是回环。NAS 局域网使用 `.env` 中明确的 `BIND_ADDRESS`，禁止 `0.0.0.0` / `::`、路由器公网映射、极空间远程访问。端口冲突只改 `.env` 的主机端口，如 `GRAFANA_PORT=3001`，不改容器内 3000。数据库 5432、MQTT 1883 不映射宿主机。外出只用 Tailscale，私有 HTTPS 方案见 NAS 文档。

始终从 `deploy` 目录用 `--env-file .env` 和固定项目名 `z-teslamate`；API 必须叠加基础文件，环境引用同一份 DB/MQTT/密钥。保持 `cap_drop: [all]`、`ENABLE_COMMANDS=false`、`COMMANDS_WAKE=false`。车控接口“二期再开”仅为待重新确认的占位，当前不得启用。

优先 `pg_dump -Fc` 做一致性逻辑备份；Grafana volume 用停止写入后的备份。物理复制 PostgreSQL volume 必须先停止全部写入及数据库。不要复制正在运行的 PGDATA，不要 `docker compose down -v`。升级先备份并检查官方迁移说明，禁止 PG17 volume 直接挂 PG18。

跑 `npm run check:compose`；有 Docker 再用 `docker compose --env-file .env ... config --quiet` 验证合并配置，避免输出展开的密钥。未提供真实密钥时不要代填或启动。说明哪些验证实际执行、哪些留待 NAS。
