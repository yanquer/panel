// Package storage 提供本地磁盘实现，解决无需对象存储时的宿主机挂载持久化需求。
package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type LocalStore struct {
	root string
}

// NewLocalStore 创建基于宿主机目录的本地对象存储实现。
func NewLocalStore(root string) (LocalStore, error) {
	if err := os.MkdirAll(root, 0o755); err != nil {
		return LocalStore{}, err
	}
	return LocalStore{root: root}, nil
}

// Put 将对象流写入本地磁盘目录。
func (s LocalStore) Put(_ context.Context, input PutInput) (ObjectInfo, error) {
	path := s.objectPath(input.Key)
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return ObjectInfo{}, err
	}
	file, err := os.Create(path)
	if err != nil {
		return ObjectInfo{}, err
	}
	defer file.Close()
	written, err := io.Copy(file, input.Reader)
	return ObjectInfo{Key: input.Key, ContentType: input.ContentType, Size: written}, err
}

// Get 打开本地对象并返回可读取流。
func (s LocalStore) Get(_ context.Context, key string) (ObjectReader, error) {
	path := s.objectPath(key)
	file, err := os.Open(path)
	if err != nil {
		return ObjectReader{}, err
	}
	info, err := file.Stat()
	if err != nil {
		file.Close()
		return ObjectReader{}, err
	}
	return ObjectReader{Body: file, Info: ObjectInfo{Key: key, Size: info.Size()}}, nil
}

// Delete 删除本地目录中的对象文件。
func (s LocalStore) Delete(_ context.Context, key string) error {
	return os.Remove(s.objectPath(key))
}

// Stat 读取本地对象的基本属性。
func (s LocalStore) Stat(_ context.Context, key string) (ObjectInfo, error) {
	info, err := os.Stat(s.objectPath(key))
	if err != nil {
		return ObjectInfo{}, err
	}
	return ObjectInfo{Key: key, Size: info.Size()}, nil
}

// objectPath 生成对象键在本地目录中的绝对路径。
func (s LocalStore) objectPath(key string) string {
	return filepath.Join(s.root, filepath.FromSlash(key))
}

// String 返回存储实现的简要描述，便于调试输出。
func (s LocalStore) String() string {
	return fmt.Sprintf("local:%s", s.root)
}
