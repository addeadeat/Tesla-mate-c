# 产品范围与分期

Z 是一套单人自用的 Tesla 数据查看界面。TeslaMate 负责采集并写 PostgreSQL、发布 MQTT；本仓库负责容器编排、只读适配和手机界面。开发在笔记本，极空间 NAS 只跑容器。

| 阶段 | 交付 | 完成条件 |
| --- | --- | --- |
| 第 0 期（本次） | 仓库约定、三个 Skill、Compose、API 类型/mock、PWA 三页 | 无密钥可启动 mock；lint/test/build 通过；部署结构合法 |
| 第 1 期 | 极空间运行官方 TeslaMate + Grafana | 真实行程/充电能记录；Grafana 可查看；停放后车辆能 asleep；备份可恢复 |
| 第 2 期 | TeslaMateAPI + 前端真数据 + Tailscale | 比对真实响应、单位和时区；三页无须车辆唤醒；私有 HTTPS 可添加主屏幕 |
| 第 3 期 | 费用、停车掉电、电池曲线 | 先定义计算口径、数据缺失与误差，再做展示；健康数据不等于官方诊断 |

本次优先 `/` 当前状态、`/drives` 最近行程、`/charges` 最近充电。状态显示电量、estimated range、状态、是否插枪。`battery-health` 仅预留类型、mock 和客户端方法，停车掉电仅列后续任务，不捏造指标或增加第四页。

不做：微信小程序、上架 App Store、公网访问、车控、社交、多用户、Tesla 登录与 token 刷新、Home Assistant。车控接口注释中的“二期再开”仅记录原始待讨论事项；本路线默认仍不做，不能据此启用。

约定：Asia/Hong_Kong；km；kWh；Wh/km 或 kWh/100km；未知值不当成 0。没有数据与请求失败分开表达。真实 API 失败不静默退回 mock，mock 在界面明确标示。
