# Compose 部署说明

## 默认模式
默认部署包含 4 个服务：
- `postgres`：保存资产元数据
- `minio`：保存文字、图片和文件内容
- `api`：提供 `REST API`
- `web`：提供 Apple 风格 Web 界面，并同源反向代理 `/api`

启动命令：
```bash
docker compose up --build
```

## 切换到本地磁盘存储
1. 在 `.env` 中把 `STORAGE_DRIVER` 改为 `local`
2. 保留 `api` 服务上的 `./data/local-storage:/data/local-storage` 挂载
3. 可继续保留 MinIO 服务，也可以按需要手动停掉

## 局域网访问
- Web：`http://<你的机器局域网IP>:4173`
- API：`http://<你的机器局域网IP>:8080/api/v1`
- MinIO 控制台：`http://<你的机器局域网IP>:9001`

## 端口冲突处理
- 如果宿主机 `4173`、`8080`、`9000` 或 `9001` 已被占用，可在 `.env` 中覆盖：
  - `WEB_HOST_PORT`
  - `API_HOST_PORT`
  - `MINIO_API_PORT`
  - `MINIO_CONSOLE_PORT`
- 例如把 MinIO 改到 `9100/9101`：
```bash
MINIO_API_PORT=9100
MINIO_CONSOLE_PORT=9101
```

## 持久化目录
- `data/postgres`
- `data/minio`
- `data/local-storage`
