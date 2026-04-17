// 主程序文件用于启动局域网共享服务后端，解决配置加载、依赖装配与服务生命周期管理。
package main

import (
	"context"
	"errors"
	"log"
	stdhttp "net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"lan-share/api/internal/app"
	"lan-share/api/internal/config"
)

// main 启动 API 服务并在收到退出信号时优雅关闭。
func main() {
	ctx := context.Background()
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}
	server, err := app.NewServer(ctx, cfg)
	if err != nil {
		log.Fatal(err)
	}
	go shutdownOnSignal(server)
	if err = server.Start(); err != nil && !errors.Is(err, stdhttp.ErrServerClosed) {
		log.Fatal(err)
	}
}

// shutdownOnSignal 监听系统信号并触发优雅关闭。
func shutdownOnSignal(server *app.Server) {
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGINT, syscall.SIGTERM)
	<-signals
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = server.Shutdown(ctx)
}
