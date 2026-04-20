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
- 首页采用顶部操作区 + 双列工作区：顶部是圆形工具按钮和状态信息，下方是共享流与内容画布
- 共享流收敛为单一列表，不再维护卡片 / Finder / 大缩略 / 表格多视图切换
- 管理解锁、主题切换、快捷新建都从顶部右侧工具栏进入，对应弹窗统一由通用弹窗壳承载
- 快捷新建弹窗同时承载便签创建和文件上传，桌面端双列、移动端纵向堆叠
- 文字资产在列表与详情区统一使用复制动作，成功或失败都通过顶部浮层反馈
- 管理态解锁后支持编辑所有共享项标题，并支持编辑便签正文
- 详情区保存采用显式提交，前端测试与端到端测试都需要覆盖保存成功后的列表同步

## 环境变量
- `DATABASE_URL`：PostgreSQL 连接串
- `GO_PROXY_PRIMARY` / `GO_PROXY_SECONDARY`：Docker 构建 Go 依赖时使用的两个模块镜像源
- `GO_SUMDB`：Docker 构建时使用的 Go 校验服务地址
- `NPM_REGISTRY_PRIMARY` / `NPM_REGISTRY_SECONDARY` / `NPM_REGISTRY_TERTIARY`：Docker 构建前端依赖时按顺序尝试的 npm registry
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
- 顶部操作按钮、弹窗壳和快捷新建内容区优先复用，不要把业务动作直接写死在页面容器里
- 功能变更时同步更新 `docs/api/openapi.yaml`、`README.md`、`CHANGELOG.md` 与相关测试
