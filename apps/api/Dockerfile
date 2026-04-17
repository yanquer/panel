# 该文件用于构建 Go 后端服务镜像，解决局域网共享 API 在 Compose 环境中的可部署问题。
FROM golang:1.26 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/lan-share-api ./cmd/server

FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=builder /bin/lan-share-api /app/lan-share-api
EXPOSE 8080
ENTRYPOINT ["/app/lan-share-api"]
