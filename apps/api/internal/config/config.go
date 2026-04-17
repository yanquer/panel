// Package config 负责读取运行配置，解决本地开发与 Compose 部署之间的参数注入问题。
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	AppEnv          string
	ListenAddr      string
	DatabaseURL     string
	StorageDriver   string
	StorageBucket   string
	LocalStorageDir string
	AdminPassword   string
	AuthSecret      string
	MinioEndpoint   string
	MinioAccessKey  string
	MinioSecretKey  string
	MinioUseSSL     bool
	PublicAPIBase   string
}

// Load 读取环境变量并整理为运行配置。
func Load() (Config, error) {
	cfg := Config{
		AppEnv:          getEnv("APP_ENV", "development"),
		ListenAddr:      getEnv("API_LISTEN_ADDR", ":8080"),
		DatabaseURL:     getEnv("DATABASE_URL", "postgres://lan_share:lan_share@localhost:5432/lan_share?sslmode=disable"),
		StorageDriver:   getEnv("STORAGE_DRIVER", "local"),
		StorageBucket:   getEnv("STORAGE_BUCKET", "lan-share"),
		LocalStorageDir: getEnv("LOCAL_STORAGE_DIR", "../../data/local-storage"),
		AdminPassword:   getEnv("ADMIN_PASSWORD", "lan-share-admin"),
		AuthSecret:      getEnv("AUTH_SECRET", "change-me-secret"),
		MinioEndpoint:   getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccessKey:  getEnv("MINIO_ROOT_USER", "minioadmin"),
		MinioSecretKey:  getEnv("MINIO_ROOT_PASSWORD", "minioadmin"),
		PublicAPIBase:   strings.TrimSuffix(getEnv("PUBLIC_API_BASE", "http://localhost:8080"), "/"),
	}
	useSSL, err := strconv.ParseBool(getEnv("MINIO_USE_SSL", "false"))
	cfg.MinioUseSSL = err == nil && useSSL
	return cfg, validate(cfg)
}

// validate 校验关键配置，避免服务启动后才暴露基础配置错误。
func validate(cfg Config) error {
	if cfg.DatabaseURL == "" || cfg.AdminPassword == "" || cfg.AuthSecret == "" {
		return fmt.Errorf("missing required runtime configuration")
	}
	if cfg.StorageDriver != "local" && cfg.StorageDriver != "minio" {
		return fmt.Errorf("unsupported storage driver: %s", cfg.StorageDriver)
	}
	return nil
}

// getEnv 读取环境变量并在缺失时回落到默认值。
func getEnv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value != "" {
		return value
	}
	return fallback
}
