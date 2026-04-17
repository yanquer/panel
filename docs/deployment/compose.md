# Compose 部署说明

## 默认模式
默认部署包含 4 个服务：
- `postgres`：保存资产元数据
- `minio`：保存文字、图片和文件内容
- `api`：提供 `REST API`
- `web`：提供 Apple 风格 Web 界面，并同源反向代理 `/api`

默认只暴露 `web` 容器的宿主机端口，`postgres`、`minio`、`api` 仅在 Compose 内部网络访问。

启动命令：
```bash
docker compose up --build
```

## Go 依赖下载镜像
- `api` 镜像构建默认使用两个 Go 模块镜像，并按优先顺序回退：
  - `GO_PROXY_PRIMARY=https://goproxy.cn`
  - `GO_PROXY_SECONDARY=https://proxy.golang.com.cn`
  - 最后回退到 `direct`
- 代理链使用 `|` 连接，遇到 `502`、超时等错误时也会继续尝试下一个镜像
- 校验服务默认使用 `GO_SUMDB=sum.golang.google.cn`
- 如果当前网络环境更适合其他镜像，可在 `.env` 中覆盖这些值后重新执行 `docker compose build api`

## 切换到本地磁盘存储
1. 在 `.env` 中把 `STORAGE_DRIVER` 改为 `local`
2. 保留 `api` 服务上的 `./data/local-storage:/data/local-storage` 挂载
3. 可继续保留 MinIO 服务，也可以按需要手动停掉

## 局域网访问
- Web：`http://<你的机器局域网IP>:4173`
- API：默认不映射宿主机端口，由 `web` 同源代理 `/api`
- MinIO：默认不映射宿主机端口，仅供内部服务使用

## 端口冲突处理
- 如果宿主机 `4173` 已被占用，可在 `.env` 中覆盖：
  - `WEB_HOST_PORT`
- 例如改成 `8081`：
```bash
WEB_HOST_PORT=8081
```

## 持久化目录
- `data/postgres`
- `data/minio`
- `data/local-storage`
