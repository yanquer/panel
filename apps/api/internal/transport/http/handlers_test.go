// Package http 的测试文件用于验证鉴权和主要 API 交互，避免管理态删除与上传入口回归。
package http

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"mime/multipart"
	stdhttp "net/http"
	"net/http/httptest"
	"testing"

	"lan-share/api/internal/auth"
	"lan-share/api/internal/domain"
	"lan-share/api/internal/service"
	"lan-share/api/internal/storage"
)

type testRepo struct {
	items map[string]domain.Asset
}

type testStore struct {
	items map[string][]byte
}

// TestUnlockAndDelete 验证解锁前后删除接口的权限差异。
func TestUnlockAndDelete(t *testing.T) {
	router := newTestRouter(t)
	assetID := createSnippetThroughAPI(t, router)
	deleteRequest := httptest.NewRequest(stdhttp.MethodDelete, "/api/v1/assets/"+assetID, nil)
	deleteResponse := httptest.NewRecorder()
	router.ServeHTTP(deleteResponse, deleteRequest)
	if deleteResponse.Code != stdhttp.StatusUnauthorized {
		t.Fatalf("expected unauthorized, got %d", deleteResponse.Code)
	}
	cookie := unlockCookie(t, router)
	deleteRequest = httptest.NewRequest(stdhttp.MethodDelete, "/api/v1/assets/"+assetID, nil)
	deleteRequest.AddCookie(cookie)
	deleteResponse = httptest.NewRecorder()
	router.ServeHTTP(deleteResponse, deleteRequest)
	if deleteResponse.Code != stdhttp.StatusOK {
		t.Fatalf("expected ok, got %d", deleteResponse.Code)
	}
}

// TestUploadAndList 验证文件上传后能在列表接口中查询到。
func TestUploadAndList(t *testing.T) {
	router := newTestRouter(t)
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "shot.png")
	_, _ = part.Write([]byte{137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84, 8, 91, 99, 248, 15, 4, 0, 9, 251, 3, 253, 160, 198, 55, 53, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130})
	writer.Close()
	request := httptest.NewRequest(stdhttp.MethodPost, "/api/v1/assets/files", body)
	request.Header.Set("Content-Type", writer.FormDataContentType())
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	if response.Code != stdhttp.StatusCreated {
		t.Fatalf("expected created, got %d", response.Code)
	}
	listResponse := httptest.NewRecorder()
	router.ServeHTTP(listResponse, httptest.NewRequest(stdhttp.MethodGet, "/api/v1/assets?kind=image", nil))
	if listResponse.Code != stdhttp.StatusOK {
		t.Fatalf("expected list ok, got %d", listResponse.Code)
	}
}

// newTestRouter 构造可直接用于接口测试的路由实例。
func newTestRouter(t *testing.T) stdhttp.Handler {
	t.Helper()
	repo := &testRepo{items: map[string]domain.Asset{}}
	store := &testStore{items: map[string][]byte{}}
	handler := NewHandler(service.NewAssetService(repo, store, domain.StorageDriverLocal), auth.NewSessionManager("secret", "token-secret"))
	return NewRouter(handler)
}

// createSnippetThroughAPI 通过接口创建便签并返回新资产主键。
func createSnippetThroughAPI(t *testing.T, router stdhttp.Handler) string {
	t.Helper()
	body, _ := json.Marshal(map[string]string{"title": "便签", "content": "hello"})
	request := httptest.NewRequest(stdhttp.MethodPost, "/api/v1/assets/snippets", bytes.NewReader(body))
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	if response.Code != stdhttp.StatusCreated {
		t.Fatalf("expected created, got %d", response.Code)
	}
	payload := domain.Asset{}
	_ = json.Unmarshal(response.Body.Bytes(), &payload)
	return payload.ID
}

// unlockCookie 通过解锁接口获取管理态 Cookie。
func unlockCookie(t *testing.T, router stdhttp.Handler) *stdhttp.Cookie {
	t.Helper()
	body, _ := json.Marshal(map[string]string{"password": "secret"})
	request := httptest.NewRequest(stdhttp.MethodPost, "/api/v1/admin/unlock", bytes.NewReader(body))
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	if response.Code != stdhttp.StatusOK {
		t.Fatalf("expected unlock ok, got %d", response.Code)
	}
	return response.Result().Cookies()[0]
}

// Create 在内存仓储中保存资产记录。
func (r *testRepo) Create(_ context.Context, asset domain.Asset) (domain.Asset, error) {
	r.items[asset.ID] = asset
	return asset, nil
}

// GetByID 从内存仓储中读取资产记录。
func (r *testRepo) GetByID(_ context.Context, id string) (domain.Asset, error) {
	asset, ok := r.items[id]
	if !ok {
		return domain.Asset{}, domain.ErrAssetNotFound
	}
	return asset, nil
}

// List 返回按条件筛选后的资产集合。
func (r *testRepo) List(_ context.Context, filter domain.ListFilter) ([]domain.Asset, error) {
	items := []domain.Asset{}
	for _, asset := range r.items {
		if filter.Kind == nil || asset.Kind == *filter.Kind {
			items = append(items, asset)
		}
	}
	return items, nil
}

// Delete 从内存仓储中移除资产记录。
func (r *testRepo) Delete(_ context.Context, id string) error {
	delete(r.items, id)
	return nil
}

// Put 在内存存储中写入对象内容。
func (s *testStore) Put(_ context.Context, input storage.PutInput) (storage.ObjectInfo, error) {
	payload, err := io.ReadAll(input.Reader)
	if err != nil {
		return storage.ObjectInfo{}, err
	}
	s.items[input.Key] = payload
	return storage.ObjectInfo{Key: input.Key, ContentType: input.ContentType, Size: int64(len(payload))}, nil
}

// Get 从内存存储中读取对象内容。
func (s *testStore) Get(_ context.Context, key string) (storage.ObjectReader, error) {
	payload, ok := s.items[key]
	if !ok {
		return storage.ObjectReader{}, domain.ErrAssetNotFound
	}
	return storage.ObjectReader{Body: io.NopCloser(bytes.NewReader(payload)), Info: storage.ObjectInfo{Key: key, Size: int64(len(payload))}}, nil
}

// Delete 从内存存储中移除对象内容。
func (s *testStore) Delete(_ context.Context, key string) error {
	delete(s.items, key)
	return nil
}

// Stat 返回内存存储中的对象信息。
func (s *testStore) Stat(_ context.Context, key string) (storage.ObjectInfo, error) {
	payload, ok := s.items[key]
	if !ok {
		return storage.ObjectInfo{}, domain.ErrAssetNotFound
	}
	return storage.ObjectInfo{Key: key, Size: int64(len(payload))}, nil
}
