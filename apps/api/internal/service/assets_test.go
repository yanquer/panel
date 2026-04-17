// Package service 的测试文件用于验证上传、预览与删除业务流程，避免核心共享链路回归。
package service

import (
	"bytes"
	"context"
	"errors"
	"io"
	"sync"
	"testing"

	"lan-share/api/internal/domain"
	"lan-share/api/internal/storage"
)

type memoryRepo struct {
	mu    sync.Mutex
	items map[string]domain.Asset
}

type memoryStore struct {
	mu    sync.Mutex
	items map[string][]byte
}

// TestCreateSnippet 验证文字便签会生成正确的元数据和正文内容。
func TestCreateSnippet(t *testing.T) {
	svc := newTestService()
	asset, err := svc.CreateSnippet(context.Background(), CreateSnippetInput{Title: "便签", Content: "局域网共享", UploaderIP: "127.0.0.1"})
	if err != nil {
		t.Fatal(err)
	}
	if asset.Kind != domain.AssetKindSnippet || asset.TextContent != "局域网共享" {
		t.Fatalf("unexpected snippet asset: %+v", asset)
	}
}

// TestCreateFile 验证图片文件会被识别为图片资产并提取尺寸。
func TestCreateFile(t *testing.T) {
	svc := newTestService()
	asset, err := svc.CreateFile(context.Background(), CreateFileInput{FileName: "shot.png", Content: tinyPNGBytes(), UploaderIP: "127.0.0.1"})
	if err != nil {
		t.Fatal(err)
	}
	if asset.Kind != domain.AssetKindImage || asset.Width == nil || *asset.Width != 1 {
		t.Fatalf("unexpected image asset: %+v", asset)
	}
}

// TestOpenPreviewBlocked 验证不可预览文件在预览接口会被拦截。
func TestOpenPreviewBlocked(t *testing.T) {
	svc := newTestService()
	asset, err := svc.CreateFile(context.Background(), CreateFileInput{FileName: "archive.bin", Content: []byte{0x1, 0x2, 0x3}, UploaderIP: "127.0.0.1"})
	if err != nil {
		t.Fatal(err)
	}
	_, err = svc.OpenContent(context.Background(), asset.ID, true)
	if !errors.Is(err, domain.ErrPreviewBlocked) {
		t.Fatalf("unexpected preview error: %v", err)
	}
}

// TestDelete 验证删除会同步移除仓储记录与对象存储内容。
func TestDelete(t *testing.T) {
	repo := &memoryRepo{items: map[string]domain.Asset{}}
	store := &memoryStore{items: map[string][]byte{}}
	svc := NewAssetService(repo, store, domain.StorageDriverLocal)
	asset, err := svc.CreateSnippet(context.Background(), CreateSnippetInput{Title: "删除", Content: "to-remove", UploaderIP: "127.0.0.1"})
	if err != nil {
		t.Fatal(err)
	}
	if err = svc.Delete(context.Background(), asset.ID); err != nil {
		t.Fatal(err)
	}
	if _, ok := repo.items[asset.ID]; ok {
		t.Fatal("asset still exists in repo")
	}
}

// newTestService 构造测试使用的内存服务实例。
func newTestService() AssetService {
	repo := &memoryRepo{items: map[string]domain.Asset{}}
	store := &memoryStore{items: map[string][]byte{}}
	return NewAssetService(repo, store, domain.StorageDriverLocal)
}

// Create 在内存仓储中保存资产记录。
func (r *memoryRepo) Create(_ context.Context, asset domain.Asset) (domain.Asset, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.items[asset.ID] = asset
	return asset, nil
}

// GetByID 从内存仓储中读取资产记录。
func (r *memoryRepo) GetByID(_ context.Context, id string) (domain.Asset, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	asset, ok := r.items[id]
	if !ok {
		return domain.Asset{}, domain.ErrAssetNotFound
	}
	return asset, nil
}

// List 返回内存仓储中的资产集合。
func (r *memoryRepo) List(_ context.Context, filter domain.ListFilter) ([]domain.Asset, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	items := []domain.Asset{}
	for _, asset := range r.items {
		if filter.Kind == nil || asset.Kind == *filter.Kind {
			items = append(items, asset)
		}
	}
	return items, nil
}

// Delete 从内存仓储中移除资产记录。
func (r *memoryRepo) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.items, id)
	return nil
}

// Put 在内存存储中写入对象内容。
func (s *memoryStore) Put(_ context.Context, input storage.PutInput) (storage.ObjectInfo, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	payload, err := io.ReadAll(input.Reader)
	if err != nil {
		return storage.ObjectInfo{}, err
	}
	s.items[input.Key] = payload
	return storage.ObjectInfo{Key: input.Key, ContentType: input.ContentType, Size: int64(len(payload))}, nil
}

// Get 从内存存储中读取对象内容。
func (s *memoryStore) Get(_ context.Context, key string) (storage.ObjectReader, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	payload, ok := s.items[key]
	if !ok {
		return storage.ObjectReader{}, domain.ErrAssetNotFound
	}
	reader := io.NopCloser(bytes.NewReader(payload))
	return storage.ObjectReader{Body: reader, Info: storage.ObjectInfo{Key: key, Size: int64(len(payload))}}, nil
}

// Delete 从内存存储中移除对象内容。
func (s *memoryStore) Delete(_ context.Context, key string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.items, key)
	return nil
}

// Stat 返回内存存储中的对象大小信息。
func (s *memoryStore) Stat(_ context.Context, key string) (storage.ObjectInfo, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	payload, ok := s.items[key]
	if !ok {
		return storage.ObjectInfo{}, domain.ErrAssetNotFound
	}
	return storage.ObjectInfo{Key: key, Size: int64(len(payload))}, nil
}

// tinyPNGBytes 返回 1x1 PNG 用于图片上传测试。
func tinyPNGBytes() []byte {
	return []byte{137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84, 8, 91, 99, 248, 15, 4, 0, 9, 251, 3, 253, 160, 198, 55, 53, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130}
}
