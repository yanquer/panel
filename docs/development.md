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

## 当前工作区形态
- 首页采用备忘录式三栏布局：左侧轻操作区，中间共享流，右侧内容画布
- 共享流收敛为单一列表，不再维护卡片 / Finder / 大缩略 / 表格多视图切换
- 管理态解锁后支持编辑所有共享项标题，并支持编辑便签正文
- 详情区保存采用显式提交，前端测试与端到端测试都需要覆盖保存成功后的列表同步

## 环境变量
- `DATABASE_URL`：PostgreSQL 连接串
- `GO_PROXY_PRIMARY` / `GO_PROXY_SECONDARY`：Docker 构建 Go 依赖时使用的两个模块镜像源
- `GO_SUMDB`：Docker 构建时使用的 Go 校验服务地址
- `STORAGE_DRIVER`：`minio` 或 `local`
- `STORAGE_BUCKET`：对象存储桶名
- `LOCAL_STORAGE_DIR`：本地磁盘模式目录
- `ADMIN_PASSWORD`：管理态口令
- `AUTH_SECRET`：Cookie 签名密钥
- `MINIO_ENDPOINT` / `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`：MinIO 参数
- `WEB_HOST_PORT`：Compose 对外暴露的前端宿主机端口

## 开发约束
- 新增函数尽量控制在 30 行内
- 新增函数和方法加中文注释
- 前端颜色、圆角、间距、动效统一走 `src/theme/tokens.css`
- 文字、图片、文件共用统一资产模型，不再拆分三套接口
- 功能变更时同步更新 `docs/api/openapi.yaml`、`README.md`、`CHANGELOG.md` 与相关测试
