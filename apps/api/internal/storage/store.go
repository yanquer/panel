// Package storage 定义对象存储抽象，解决 MinIO 与本地磁盘在服务层的统一接入问题。
package storage

import (
	"context"
	"io"
)

type PutInput struct {
	Key         string
	ContentType string
	Reader      io.Reader
	Size        int64
}

type ObjectInfo struct {
	Key         string
	ContentType string
	Size        int64
}

type ObjectReader struct {
	Body io.ReadCloser
	Info ObjectInfo
}

type Store interface {
	Put(ctx context.Context, input PutInput) (ObjectInfo, error)
	Get(ctx context.Context, key string) (ObjectReader, error)
	Delete(ctx context.Context, key string) error
	Stat(ctx context.Context, key string) (ObjectInfo, error)
}
