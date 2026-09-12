---
name: safe-commit
description: 为 Z 提交、推送、准备 PR 或检查暂存区时使用；触发词包括“提交”“commit”“push”“检查密钥”。不用于无提交意图的一般问答，也不负责 Tesla 登录或轮换真实凭据。
---

# Safe commit

先读 `AGENTS.md`，运行 `git status --short`、`git diff --stat`，审阅工作区与 `git diff --cached`；初次提交也检查新文件内容。

运行 `npm run check:secrets`。确认没有 `.env`/`.env.local`、PEM、tokens.json、SQL dump、备份或真实位置数据被跟踪。检查 token、密码、ENCRYPTION_KEY、Authorization、私钥、带凭据 URL、日志和截图；代码里的变量引用与空模板允许，真实赋值不允许。只允许提交 `.env.example` 环境模板；`NEXT_PUBLIC_*` 不是秘密存储。

发现疑似秘密时停止提交，移出暂存区；不把原值复制到报告。若已泄漏，告知需要用户轮换，不擅自改写远端历史。扫描通过不等于没有秘密，仍需人工审阅 diff。

运行 `npm run lint && npm run typecheck && npm test`，涉及前端再 `npm run build`，涉及部署再 `npm run check:compose`。明确报告跳过或失败的检查，不用禁用规则来通过检查。

按明确路径暂存本任务文件，再审阅暂存 diff、检查秘密并提交。不得用 `git add -f`，不得 force-push。推送前确认远端账号和目标仓库；连接不可用时保留本地提交，不宣称已上传。
