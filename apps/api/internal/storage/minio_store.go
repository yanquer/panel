// Package storage 提供 MinIO 对象存储实现，解决 Compose 默认部署下的统一文件持久化需求。
package storage

import (
	"context"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinioConfig struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Bucket    string
	UseSSL    bool
}

type MinioStore struct {
	bucket string
	client *minio.Client
}

// NewMinioStore 创建 MinIO 客户端并确保目标桶存在。
func NewMinioStore(ctx context.Context, cfg MinioConfig) (MinioStore, error) {
	client, err := minio.New(cfg.Endpoint, &minio.Options{Creds: credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""), Secure: cfg.UseSSL})
	if err != nil {
		return MinioStore{}, err
	}
	store := MinioStore{bucket: cfg.Bucket, client: client}
	return store, store.ensureBucket(ctx)
}

// Put 将对象上传到 MinIO 桶中。
func (s MinioStore) Put(ctx context.Context, input PutInput) (ObjectInfo, error) {
	result, err := s.client.PutObject(ctx, s.bucket, input.Key, input.Reader, input.Size, minio.PutObjectOptions{ContentType: input.ContentType})
	if err != nil {
		return ObjectInfo{}, err
	}
	return ObjectInfo{Key: input.Key, ContentType: input.ContentType, Size: result.Size}, nil
}

// Get 打开 MinIO 中的对象读取流。
func (s MinioStore) Get(ctx context.Context, key string) (ObjectReader, error) {
	body, err := s.client.GetObject(ctx, s.bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return ObjectReader{}, err
	}
	stat, err := body.Stat()
	if err != nil {
		body.Close()
		return ObjectReader{}, err
	}
	return ObjectReader{Body: body, Info: ObjectInfo{Key: key, ContentType: stat.ContentType, Size: stat.Size}}, nil
}

// Delete 删除 MinIO 桶中的对象。
func (s MinioStore) Delete(ctx context.Context, key string) error {
	return s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
}

// Stat 读取 MinIO 对象的基本属性。
func (s MinioStore) Stat(ctx context.Context, key string) (ObjectInfo, error) {
	stat, err := s.client.StatObject(ctx, s.bucket, key, minio.StatObjectOptions{})
	if err != nil {
		return ObjectInfo{}, err
	}
	return ObjectInfo{Key: key, ContentType: stat.ContentType, Size: stat.Size}, nil
}

// ensureBucket 确保服务启动时目标桶已存在。
func (s MinioStore) ensureBucket(ctx context.Context) error {
	exists, err := s.client.BucketExists(ctx, s.bucket)
	if err != nil || exists {
		return err
	}
	return s.client.MakeBucket(ctx, s.bucket, minio.MakeBucketOptions{})
}
