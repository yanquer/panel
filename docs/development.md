# 开发文档

## 目录结构
- `apps/api`：Go 后端，按 `app / auth / config / domain / metadata / preview / repository / service / storage / transport` 分层
- `apps/web`：React 前端，按 `app-shell / api / features / shared / theme / tests` 分层
- `docs`：接口、部署、设计文档
- `compose.yaml`：局域网部署入口

## 本地运行
### 后端
```bash
cd apps/api
go run ./cmd/server
```

### 前端
```bash
pnpm install
pnpm --dir apps/web dev
```

## 测试
```bash
cd apps/api && go test ./...
pnpm --dir apps/web test
pnpm --dir apps/web test:e2e
```

## 环境变量
- `DATABASE_URL`：PostgreSQL 连接串
- `STORAGE_DRIVER`：`minio` 或 `local`
- `STORAGE_BUCKET`：对象存储桶名
- `LOCAL_STORAGE_DIR`：本地磁盘模式目录
- `ADMIN_PASSWORD`：管理态口令
- `AUTH_SECRET`：Cookie 签名密钥
- `MINIO_ENDPOINT` / `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`：MinIO 参数
- `WEB_HOST_PORT` / `API_HOST_PORT` / `MINIO_API_PORT` / `MINIO_CONSOLE_PORT`：Compose 宿主机端口映射

## 开发约束
- 新增函数尽量控制在 30 行内
- 新增函数和方法加中文注释
- 前端颜色、圆角、间距、动效统一走 `src/theme/tokens.css`
- 文字、图片、文件共用统一资产模型，不再拆分三套接口
