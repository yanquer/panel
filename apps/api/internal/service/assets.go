// Package service 实现资产共享的核心业务流程，解决上传、查询、预览与删除的统一编排问题。
package service

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"mime"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"lan-share/api/internal/domain"
	"lan-share/api/internal/metadata"
	"lan-share/api/internal/preview"
	"lan-share/api/internal/storage"
)

type AssetRepository interface {
	Create(ctx context.Context, asset domain.Asset) (domain.Asset, error)
	GetByID(ctx context.Context, id string) (domain.Asset, error)
	List(ctx context.Context, filter domain.ListFilter) ([]domain.Asset, error)
	Delete(ctx context.Context, id string) error
}

type AssetService struct {
	repo   AssetRepository
	store  storage.Store
	driver domain.StorageDriver
}

type CreateSnippetInput struct {
	Title      string
	Content    string
	UploaderIP string
}

type CreateFileInput struct {
	FileName   string
	Content    []byte
	UploaderIP string
}

type ContentResult struct {
	Asset   domain.Asset
	Object  storage.ObjectReader
	Inline  bool
	Preview bool
}

// NewAssetService 创建资产服务并注入仓储与存储实现。
func NewAssetService(repo AssetRepository, store storage.Store, driver domain.StorageDriver) AssetService {
	return AssetService{repo: repo, store: store, driver: driver}
}

// CreateSnippet 创建文字便签并把内容存入统一对象存储。
func (s AssetService) CreateSnippet(ctx context.Context, input CreateSnippetInput) (domain.Asset, error) {
	content := strings.TrimSpace(input.Content)
	if content == "" {
		return domain.Asset{}, domain.ErrInvalidInput
	}
	payload := []byte(content)
	meta := metadata.FromBytes("text/plain; charset=utf-8", payload)
	asset := buildAsset(domain.AssetKindSnippet, cleanTitle(input.Title, "新便签"), "snippet.txt", "text/plain; charset=utf-8", payload, meta, s.driver, input.UploaderIP)
	asset.TextContent = content
	return s.persist(ctx, asset, payload)
}

// CreateFile 创建图片或通用文件资产并提取必要属性。
func (s AssetService) CreateFile(ctx context.Context, input CreateFileInput) (domain.Asset, error) {
	if len(input.Content) == 0 || strings.TrimSpace(input.FileName) == "" {
		return domain.Asset{}, domain.ErrInvalidInput
	}
	mimeType := http.DetectContentType(input.Content)
	meta := metadata.FromBytes(mimeType, input.Content)
	kind := detectAssetKind(mimeType)
	asset := buildAsset(kind, cleanTitle(input.FileName, input.FileName), input.FileName, mimeType, input.Content, meta, s.driver, input.UploaderIP)
	return s.persist(ctx, asset, input.Content)
}

// List 返回按时间倒序排列的资产列表。
func (s AssetService) List(ctx context.Context, filter domain.ListFilter) ([]domain.Asset, error) {
	return s.repo.List(ctx, filter)
}

// Get 读取指定资产详情。
func (s AssetService) Get(ctx context.Context, id string) (domain.Asset, error) {
	return s.repo.GetByID(ctx, id)
}

// OpenContent 打开资产内容流，供下载或预览接口复用。
func (s AssetService) OpenContent(ctx context.Context, id string, previewMode bool) (ContentResult, error) {
	asset, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return ContentResult{}, err
	}
	if previewMode && asset.PreviewKind == domain.PreviewKindUnsupported {
		return ContentResult{}, domain.ErrPreviewBlocked
	}
	object, err := s.store.Get(ctx, asset.StoredKey)
	return ContentResult{Asset: asset, Object: object, Inline: previewMode, Preview: previewMode}, err
}

// Delete 删除资产记录及其对应对象内容。
func (s AssetService) Delete(ctx context.Context, id string) error {
	asset, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err = s.store.Delete(ctx, asset.StoredKey); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}

// persist 持久化对象内容与元数据记录。
func (s AssetService) persist(ctx context.Context, asset domain.Asset, payload []byte) (domain.Asset, error) {
	_, err := s.store.Put(ctx, storage.PutInput{Key: asset.StoredKey, ContentType: asset.MimeType, Reader: bytes.NewReader(payload), Size: int64(len(payload))})
	if err != nil {
		return domain.Asset{}, err
	}
	return s.repo.Create(ctx, asset)
}

// buildAsset 构造统一的资产元数据模型。
func buildAsset(kind domain.AssetKind, title string, originalName string, mimeType string, payload []byte, meta metadata.Result, driver domain.StorageDriver, uploaderIP string) domain.Asset {
	id := newID()
	hash := sumSHA256(payload)
	storedKey := storageKey(id, originalName)
	return domain.Asset{ID: id, Kind: kind, Title: title, OriginalName: originalName, StoredKey: storedKey, MimeType: mimeType, SizeBytes: int64(len(payload)), SHA256: hash, PreviewKind: preview.Detect(kind, mimeType), Width: meta.Width, Height: meta.Height, CharCount: meta.CharCount, StorageDriver: driver, UploaderIP: uploaderIP, CreatedAt: time.Now().UTC()}
}

// detectAssetKind 根据 MIME 判断资产大类。
func detectAssetKind(mimeType string) domain.AssetKind {
	if strings.HasPrefix(mimeType, "image/") {
		return domain.AssetKindImage
	}
	return domain.AssetKindFile
}

// cleanTitle 统一整理标题文本，避免展示名称为空。
func cleanTitle(raw string, fallback string) string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return fallback
	}
	return trimmed
}

// newID 生成用于资产主键的随机十六进制标识。
func newID() string {
	buf := make([]byte, 16)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf)
}

// sumSHA256 计算上传内容的哈希值，便于属性展示与后续排查。
func sumSHA256(payload []byte) string {
	sum := sha256.Sum256(payload)
	return hex.EncodeToString(sum[:])
}

// storageKey 生成对象存储中的稳定键名。
func storageKey(id string, originalName string) string {
	ext := filepath.Ext(originalName)
	return fmt.Sprintf("assets/%s%s", id, strings.ToLower(ext))
}

// ReadUpload 把请求体上传内容读取为字节切片，供 handler 复用。
func ReadUpload(reader io.Reader) ([]byte, error) {
	return io.ReadAll(reader)
}

// DownloadName 返回下载时推荐使用的文件名。
func DownloadName(asset domain.Asset) string {
	if asset.Kind == domain.AssetKindSnippet {
		return titleWithExt(asset.Title, ".txt")
	}
	return asset.OriginalName
}

// titleWithExt 为便签标题补全下载后缀。
func titleWithExt(title string, ext string) string {
	base := strings.TrimSpace(title)
	if strings.HasSuffix(strings.ToLower(base), ext) {
		return base
	}
	return mime.QEncoding.Encode("utf-8", base) + ext
}
