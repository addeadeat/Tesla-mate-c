---
name: teslamate-ui
description: 修改 Z 的前端、移动端三页、PWA、mock 或接入 TeslaMateAPI 时使用；触发词包括“改前端”“接真数据”“行程页”“充电页”。不用于 Tesla 登录、车控、纯 NAS 部署或其他项目。
---

# TeslaMate UI

先读根 `AGENTS.md`、`docs/teslamate-api.md`，保留默认 mock。优先维护 `/`、`/drives`、`/charges`；不扩成完整产品。

只允许以下 GET：
- `/api/v1/cars`
- `/api/v1/cars/:id/status`
- `/api/v1/cars/:id/drives`
- `/api/v1/cars/:id/charges`
- `/api/v1/cars/:id/battery-health`（类型与 mock 预留，本期不加页面）

通过 `packages/api-client` 读取数据；前端真实模式走 Next 的固定 GET 代理，服务端读取 `NEXT_PUBLIC_API_BASE`。保持正整数车 ID 和 endpoint 白名单，不增加通配转发。不接 Owner/Fleet API，不增加 command、logging、wake_up，也不实现登录或 token 刷新。

先核对上游 Go JSON tags 或文档，再改 wire 类型；响应外层、单位和空值必须验证。UI 模型的自有字段须明确是转换结果；缺失字段显示“暂无数据”。`estimated range` 缺失时不可用 ideal/rated 冒充。

状态轮询间隔：online/driving/charging 60 秒；asleep 15 分钟；未知状态 5 分钟。后台暂停、离开取消、避免重叠、失败退避。drives/charges 不持续轮询。缓存数据不代表车辆最新实时数据，不发唤醒请求。

覆盖加载、空列表、无车辆、失败重试与缺失值；mock 测试场景见 README。按 375px 宽度验证无横向溢出、底部导航和 44px 点击区域。时区 `Asia/Hong_Kong`，km、kWh、Wh/km。PWA 仅最小 manifest 和图标；不缓存真实行程，不做推送、Grafana iframe 或登录系统。

运行 `npm run lint && npm run typecheck && npm test && npm run build`；交付时区分 mock 验证与真实 NAS 联调。
