# 该文件用于构建前端静态站点镜像，解决 Apple 风格 Web 界面在 Compose 中的发布与 API 反向代理问题。
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts playwright.config.ts ./
COPY src ./src
COPY index.html ./
RUN corepack enable && pnpm install --frozen-lockfile=false && pnpm build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
