# HUMAN.md - Guide for human developers, code agent can ignore this

## 环境
- 项目依赖 NodeJS 20
- 执行 `npm install -g pnpm` 安装 `pnpm`
- 在 `.env` 中配置一下 openrouter key，参考 `env.example`
- 目前代码中所有 agent 都写死使用 `x-ai/grok-4-fast`
- packages 中代码更新后，需要执行一下 `pnpm build`
- 执行 `pnpm sb` 在 story book 中验证 UI 效果
- 执行 `pnpm dev` 本地可验证端到端效果
- 执行 `pnpm e2e:random` 可以本地起一个端到端随机汤

## 开发
- 在 `packages/llm-client/src` 中有 agent 相关实现可以参考
- 在 `packages/agent-lb` 中有一些验证 agent 效果的代码