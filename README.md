# LAN Share Panel

一个适合局域网内快速共享文字、图片和文件的轻量服务，提供 Apple 气质启发的双主题 Web 界面，支持图片预览、属性查看、匿名读写和管理口令删除。

## 功能概览
- 文字便签、图片、通用文件统一资产模型
- 共享流支持卡片视图与列表视图切换，列表内支持 Finder / 大缩略 / 表格三种风格
- 图片 / 文本 / PDF 预览与属性面板
- 匿名上传、查看、下载
- 管理口令解锁删除能力
- `MinIO` 与本地磁盘双存储驱动
- `Docker Compose` 一键部署

## 快速开始
1. 复制配置：`cp .env.example .env`
2. 启动服务：`docker compose up --build`
3. 打开前端：`http://localhost:4173`
4. 后端接口：`http://localhost:8080/api/v1`
5. MinIO 控制台：`http://localhost:9001`
6. 如果本机端口冲突，可在 `.env` 中覆盖 `WEB_HOST_PORT`、`API_HOST_PORT`、`MINIO_API_PORT`、`MINIO_CONSOLE_PORT`

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
