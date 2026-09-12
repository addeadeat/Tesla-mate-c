# TeslaMateAPI 最小接口约定

这是独立项目 `tobiasehlert/teslamateapi` 提供的读取 API，不是 Tesla Owner/Fleet API，也不是采集器。
依据 [上游 README](https://github.com/tobiasehlert/teslamateapi) 及 [src 下的 v1_TeslaMateAPI*.go](https://github.com/tobiasehlert/teslamateapi/tree/main/src) 的 JSON 字段，核对日期 2026-09-12。部署镜像为 latest，真实联调须记录 digest 并复核样本。

| 方法 / 路径 | 返回中使用的字段 | 用途 |
| --- | --- | --- |
| GET `/api/v1/cars` | `data.cars[].car_id`、`name`、`car_details.model` | 取第一辆车（本期单车；不硬编码真实 ID） |
| GET `/api/v1/cars/:id/status` | `data.status.state`、`state_since`、`battery_details.battery_level`、`battery_details.est_battery_range`、`charging_details.plugged_in`、`data.units.unit_of_length` | 状态页 |
| GET `/api/v1/cars/:id/drives` | `data.drives[].drive_id`、`start_date`、`end_date`、`start_address`、`end_address`、`odometer_details.odometer_distance`、`duration_min`、`energy_consumed_net` | 最近行程 |
| GET `/api/v1/cars/:id/charges` | `data.charges[].charge_id`、`start_date`、`end_date`、`address`、`charge_energy_added`、`duration_min`、`battery_details.start_battery_level/end_battery_level` | 最近充电 |
| GET `/api/v1/cars/:id/battery-health` | `data.battery_health.battery_health_percentage` | 预留类型/client/mock，第 3 期再展示 |

所有响应有 `data` 外层。drives/charges/status/health 还有 `data.car` 和 `data.units`。只声明这里使用的字段；上游额外字段不进入 UI。空集合上游可能序列化成 null，转换为 `[]`；历史列表为空时允许 `unit_of_length` 为空字符串（上游变量未被查询行赋值），非空列表必须明确单位。结构损坏报契约错误，不能当空列表。

历史接口源码支持 `page`、`show`，本期固定 `page=1&show=20`，UI 明示最多 20 条，不假装已经加载全部；上游按最近时间返回，前端再按 start_date 倒序。未来分页需另加任务。日期过滤暂不实现。

## 类型与单位转换

`types.ts` 是最小 wire 类型；`normalize.ts` 校验 unknown JSON 并产生页面模型。日期为 RFC3339（带 Z/时区偏移）；显示由 `Intl.DateTimeFormat` 固定 Asia/Hong_Kong，不用浏览器本地时区猜测。

`data.units.unit_of_length` 必须是 km 或 mi；mi × 1.609344 后显示 km。status 的 `est_battery_range` 是 estimated range，不拿 rated/ideal 替换。行程电耗由 `energy_consumed_net`（kWh）÷ km × 1000 得到 Wh/km；缺失能量/距离或距离为 0 时显示“暂无数据”，不直接假设 `consumption_net` 的口径。

status 的 `state_since` 是**状态开始时间**，不是车辆最后遥测时间。页面的“读取于”只是本客户端成功读取缓存的时间。上游 MQTT 字段缺少逐项更新时间和有效标记；TODO：第 2 期验证 MQTT 初始默认零值、重连和过期判断，不能声称刚读取就代表实时。未知状态保留原值、采用慢轮询。

所有可缺失显示字段采用 null；非法数值/结构会报错，0 和 false 保留意义。电池健康百分比是上游估算，TODO：实际样本不足/无历史时的响应与有效性，当前不展示为车辆诊断。

## 请求与凭据

默认 mock，无网络调用。真实模式浏览器调用同源 `/api/teslamate/...`，Next 服务端从 `NEXT_PUBLIC_API_BASE` 读取 API origin，只允许局域网、回环、Tailscale 地址/主机；不能传任意 URL。Next 补 `/api/v1/`，限制 GET、车 ID、endpoint、分页参数，禁止重定向，10 秒超时、不缓存，不透传上游错误正文。

可选 `TESLAMATE_API_TOKEN` 仅在服务器添加 Bearer header，不读 `NEXT_PUBLIC_API_TOKEN`。上游 API_TOKEN 对 command/logging 的认证不能推广为“所有只读数据均受保护”；本期信任局域网/Tailscale，保持车控禁用。

## 轮询及禁止的接口

在线/充电/行驶 60 秒；休眠 15 分钟；未知 5 分钟。后台标签不发请求，单请求在途、退出取消、失败指数退避上限 15 分钟。行程/充电只首次加载或手动刷新。手动刷新禁用频繁点击，读取缓存不唤醒车辆。

不允许 `/command`、`/wake_up`、`/logging` 或任意 POST/PUT/DELETE。车控接口：**二期再开**（仅需求占位，须另行确认；当前产品路线仍不做）。本仓库不实现、注册或转发这些路由。
