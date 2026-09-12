# 安全约定

## 三类凭据

1. Tesla token：仅交给自行部署的官方 TeslaMate 管理，本仓库不读取、刷新、展示或提交。
2. `ENCRYPTION_KEY`：加密 TeslaMate 数据库内 token 的本地密钥，不是 Tesla token；备份它但不提交 Git。丢失会影响已有加密数据。
3. `DATABASE_PASS` / 可选 `API_TOKEN`：数据库或 TeslaMateAPI 的本地凭据；只放未跟踪的 `.env`。

前端任何 `NEXT_PUBLIC_*` 都不能保存秘密。`NEXT_PUBLIC_API_TOKEN` 保留空占位且代码不读取；如需 API token，用 Next 服务端 `TESLAMATE_API_TOKEN`，通过 `Authorization: Bearer …` 发给上游，不放 URL、不回传浏览器。

## 网络与只读边界

- 默认只绑定 127.0.0.1；NAS 部署改为明确局域网 IP。禁止 0.0.0.0、::、公网端口转发、极空间远程访问。
- PostgreSQL、MQTT 不发布宿主机端口；Mosquitto 允许匿名仅因它局限于该 Compose 私有网络，不能扩大共享网络或暴露 1883。
- API 中显式禁用 commands/wake；Next 代理仅有固定 GET 白名单，不能访问 command、logging 或 wake_up。
- 上游 TeslaMateAPI 的 API_TOKEN 不能当作全部只读数据的通用鉴权保证；本期用局域网/Tailscale 作为信任边界。能进入可信网络的人可能读取行程，API 不是互联网服务。
- API 使用同一数据库账号是本期编排要求，因此不声称数据库权限是强制只读。第 2 期可验证最小权限账号，前端始终不持有数据库凭据。
- 不缓存真实 API 响应，不使用 service worker 保存行程，无分析埋点、第三方字体、外链图片或 Grafana iframe。

## 提交与备份

提交前用 `$safe-commit`，运行 `npm run check:secrets` 并人工看 diff。忽略 `.env`、PEM、tokens.json、数据库 dump、日志；只有 `.env.example` 可作为环境模板提交。扫描是辅助，不能证明不存在所有形式的秘密。

备份包含行程、位置及加密 token；离线加密保存、限制访问，按 `deploy/NAS.md` 验证恢复。不要把备份、真实截图、原始 API 响应放进 issue 或仓库。

`latest` 镜像遵循本次要求，但不会自动拉取更新。正式运行记录已验证镜像 digest；更新先读官方说明、备份，再手动升级。PostgreSQL 固定 17，不直接跨大版本复用数据目录。
