# LAN Share Panel

一个适合局域网内快速共享文字、图片和文件的轻量服务，提供 Apple 气质启发的双主题 Web 界面，支持顶部快捷操作、图片预览、属性查看、匿名读写和管理口令编辑/删除。

## 功能概览
- 文字便签、图片、通用文件统一资产模型
- 首页采用顶部操作区 + 共享流 + 内容画布工作区
- 顶部提供管理头像、深浅主题切换和快捷新建三个圆形入口
- 快捷新建弹窗支持写便签与拖入图片或文件
- 图片 / 文本 / PDF 预览与轻量属性面板
- 匿名上传、查看、下载
- 管理口令解锁编辑与删除能力
- `MinIO` 与本地磁盘双存储驱动
- Docker 构建内置 Go 模块与 npm registry 多镜像回退链，降低依赖下载失败概率
- `Docker Compose` 一键部署

## 快速开始
1. 复制配置：`cp .env.example .env`
2. 启动服务：`docker compose up --build`
3. 打开前端：`http://localhost:4173`
4. API 和 MinIO 默认仅在 Compose 内部网络访问，由 `web` 同源代理 `/api`
5. 如果本机端口冲突，可在 `.env` 中覆盖 `WEB_HOST_PORT`
6. 如果你所在网络对 Go 官方源不稳定，可在 `.env` 中覆盖 `GO_PROXY_PRIMARY`、`GO_PROXY_SECONDARY`、`GO_SUMDB`
7. 如果你所在网络对 `registry.npmjs.org` 不稳定，可在 `.env` 中调整 `NPM_REGISTRY_PRIMARY`、`NPM_REGISTRY_SECONDARY`、`NPM_REGISTRY_TERTIARY`，把当前网络最好的镜像排在前面

## 本地开发
- 后端：`cd apps/api && go run ./cmd/server`
- 前端：`pnpm install && pnpm --dir apps/web dev`
- 后端测试：`cd apps/api && go test ./...`
- 前端测试：`pnpm --dir apps/web test`

## 文档索引
- API 文档：[`docs/api/openapi.yaml`](docs/api/openapi.yaml)
- 开发文档：[`docs/development.md`](docs/development.md)
- Compose 部署：[`docs/deployment/compose.md`](docs/deployment/compose.md)
- 设计规范：[`docs/design.md`](docs/design.md)
