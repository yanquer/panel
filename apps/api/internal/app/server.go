// Package app 负责组装应用依赖，解决配置、数据库、存储与 HTTP 服务的启动衔接问题。
package app

import (
	"context"
	"fmt"
	"log"
	stdhttp "net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"lan-share/api/internal/auth"
	"lan-share/api/internal/config"
	"lan-share/api/internal/domain"
	"lan-share/api/internal/repository/postgres"
	"lan-share/api/internal/service"
	"lan-share/api/internal/storage"
	httptransport "lan-share/api/internal/transport/http"
)

type Server struct {
	httpServer *stdhttp.Server
	pool       *pgxpool.Pool
}

// NewServer 按运行配置组装可启动的 HTTP 服务。
func NewServer(ctx context.Context, cfg config.Config) (*Server, error) {
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}
	repo := postgres.NewAssetRepository(pool)
	if err = repo.EnsureSchema(ctx); err != nil {
		return nil, err
	}
	store, err := newStore(ctx, cfg)
	if err != nil {
		return nil, err
	}
	assets := service.NewAssetService(repo, store, domain.StorageDriver(cfg.StorageDriver))
	handler := httptransport.NewHandler(assets, auth.NewSessionManager(cfg.AdminPassword, cfg.AuthSecret))
	router := httptransport.NewRouter(handler)
	return &Server{httpServer: &stdhttp.Server{Addr: cfg.ListenAddr, Handler: router, ReadHeaderTimeout: 5 * time.Second}, pool: pool}, nil
}

// Start 启动 HTTP 服务监听。
func (s *Server) Start() error {
	log.Printf("api listening on %s", s.httpServer.Addr)
	return s.httpServer.ListenAndServe()
}

// Shutdown 优雅关闭 HTTP 服务与数据库连接。
func (s *Server) Shutdown(ctx context.Context) error {
	if err := s.httpServer.Shutdown(ctx); err != nil {
		return err
	}
	s.pool.Close()
	return nil
}

// newStore 根据配置选择对象存储实现。
func newStore(ctx context.Context, cfg config.Config) (storage.Store, error) {
	if cfg.StorageDriver == string(domain.StorageDriverMinio) {
		return storage.NewMinioStore(ctx, storage.MinioConfig{Endpoint: cfg.MinioEndpoint, AccessKey: cfg.MinioAccessKey, SecretKey: cfg.MinioSecretKey, Bucket: cfg.StorageBucket, UseSSL: cfg.MinioUseSSL})
	}
	store, err := storage.NewLocalStore(cfg.LocalStorageDir)
	if err != nil {
		return nil, fmt.Errorf("init local store: %w", err)
	}
	return store, nil
}
