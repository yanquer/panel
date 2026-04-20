# 该文件用于构建前端静态站点镜像，解决 Apple 风格 Web 界面在 Compose 中的发布与 API 反向代理问题。
FROM node:22-alpine AS builder
ARG NPM_REGISTRY_PRIMARY=https://registry.npmmirror.com
ARG NPM_REGISTRY_SECONDARY=https://mirrors.cloud.tencent.com/npm/
ARG NPM_REGISTRY_TERTIARY=https://registry.npmjs.org
WORKDIR /app
COPY package.json ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts playwright.config.ts ./
COPY src ./src
COPY index.html ./
RUN set -eu; \
    corepack enable; \
    installed=false; \
    for registry in "$NPM_REGISTRY_PRIMARY" "$NPM_REGISTRY_SECONDARY" "$NPM_REGISTRY_TERTIARY"; do \
      echo "尝试使用 npm registry: ${registry}"; \
      rm -rf node_modules /root/.local/share/pnpm/store /root/.pnpm-store; \
      pnpm config set registry "$registry"; \
      if pnpm install --frozen-lockfile=false; then \
        installed=true; \
        break; \
      fi; \
    done; \
    if [ "$installed" != "true" ]; then \
      echo "所有 npm registry 都不可用，构建失败"; \
      exit 1; \
    fi; \
    pnpm build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
