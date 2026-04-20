// Package postgres 提供资产元数据仓储实现，解决共享记录在 PostgreSQL 中的持久化与检索问题。
package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"lan-share/api/internal/domain"
)

type AssetRepository struct {
	pool *pgxpool.Pool
}

// NewAssetRepository 创建 PostgreSQL 资产仓储。
func NewAssetRepository(pool *pgxpool.Pool) AssetRepository {
	return AssetRepository{pool: pool}
}

// EnsureSchema 确保资产表在服务启动时可用。
func (r AssetRepository) EnsureSchema(ctx context.Context) error {
	_, err := r.pool.Exec(ctx, schemaSQL)
	return err
}

// Create 写入一条新的资产元数据记录。
func (r AssetRepository) Create(ctx context.Context, asset domain.Asset) (domain.Asset, error) {
	args := toArgs(asset)
	_, err := r.pool.Exec(ctx, insertSQL, args...)
	return asset, err
}

// GetByID 按主键读取资产详情。
func (r AssetRepository) GetByID(ctx context.Context, id string) (domain.Asset, error) {
	row := r.pool.QueryRow(ctx, selectBaseSQL+" WHERE id = $1", id)
	asset, err := scanAsset(row)
	return asset, mapNotFound(err)
}

// List 查询资产列表，支持按类型过滤。
func (r AssetRepository) List(ctx context.Context, filter domain.ListFilter) ([]domain.Asset, error) {
	query, args := buildListQuery(filter)
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAssets(rows)
}

// Update 更新指定资产的可编辑元数据字段。
func (r AssetRepository) Update(ctx context.Context, asset domain.Asset) (domain.Asset, error) {
	result, err := r.pool.Exec(ctx, updateSQL, updateArgs(asset)...)
	if err != nil {
		return domain.Asset{}, err
	}
	if result.RowsAffected() == 0 {
		return domain.Asset{}, domain.ErrAssetNotFound
	}
	return asset, nil
}

// Delete 删除指定资产记录。
func (r AssetRepository) Delete(ctx context.Context, id string) error {
	result, err := r.pool.Exec(ctx, "DELETE FROM assets WHERE id = $1", id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return domain.ErrAssetNotFound
	}
	return nil
}

// buildListQuery 组装列表查询语句与参数。
func buildListQuery(filter domain.ListFilter) (string, []any) {
	query := selectBaseSQL
	args := []any{}
	if filter.Kind != nil {
		query += " WHERE kind = $1"
		args = append(args, *filter.Kind)
	}
	query += " ORDER BY created_at DESC"
	return query, args
}

// scanAssets 扫描多行结果并转换为资产切片。
func scanAssets(rows pgx.Rows) ([]domain.Asset, error) {
	items := []domain.Asset{}
	for rows.Next() {
		asset, err := scanAsset(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, asset)
	}
	return items, rows.Err()
}

// scanAsset 扫描单行结果并转换为资产模型。
func scanAsset(scanner interface{ Scan(...any) error }) (domain.Asset, error) {
	asset := domain.Asset{}
	var width, height, charCount *int
	var kind, previewKind, storageDriver string
	var mimeType, originalName, title, storedKey, sha256, uploaderIP, textContent string
	err := scanner.Scan(&asset.ID, &kind, &title, &textContent, &originalName, &storedKey, &mimeType, &asset.SizeBytes, &sha256, &previewKind, &width, &height, &charCount, &storageDriver, &uploaderIP, &asset.CreatedAt)
	asset.Kind = domain.AssetKind(kind)
	asset.Title = title
	asset.TextContent = textContent
	asset.OriginalName = originalName
	asset.StoredKey = storedKey
	asset.MimeType = mimeType
	asset.SHA256 = sha256
	asset.PreviewKind = domain.PreviewKind(previewKind)
	asset.Width = width
	asset.Height = height
	asset.CharCount = charCount
	asset.StorageDriver = domain.StorageDriver(storageDriver)
	asset.UploaderIP = uploaderIP
	return asset, err
}

// toArgs 把资产模型展开为 SQL 写入参数列表。
func toArgs(asset domain.Asset) []any {
	return []any{asset.ID, asset.Kind, asset.Title, asset.TextContent, asset.OriginalName, asset.StoredKey, asset.MimeType, asset.SizeBytes, asset.SHA256, asset.PreviewKind, asset.Width, asset.Height, asset.CharCount, asset.StorageDriver, asset.UploaderIP, asset.CreatedAt}
}

// updateArgs 把可编辑资产字段展开为 SQL 更新参数。
func updateArgs(asset domain.Asset) []any {
	return []any{asset.Title, asset.TextContent, asset.MimeType, asset.SizeBytes, asset.SHA256, asset.CharCount, asset.ID}
}

// mapNotFound 把无结果错误映射为统一业务错误。
func mapNotFound(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrAssetNotFound
	}
	return err
}

const selectBaseSQL = `
SELECT id, kind, title, text_content, original_name, stored_key, mime_type, size_bytes, sha256,
       preview_kind, width, height, char_count, storage_driver, uploader_ip, created_at
FROM assets`

const insertSQL = `
INSERT INTO assets (
  id, kind, title, text_content, original_name, stored_key, mime_type, size_bytes,
  sha256, preview_kind, width, height, char_count, storage_driver, uploader_ip, created_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8,
  $9, $10, $11, $12, $13, $14, $15, $16
)`

const updateSQL = `
UPDATE assets
SET title = $1,
    text_content = $2,
    mime_type = $3,
    size_bytes = $4,
    sha256 = $5,
    char_count = $6
WHERE id = $7`

var schemaSQL = strings.TrimSpace(fmt.Sprintf(`
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  text_content TEXT NOT NULL DEFAULT '',
  original_name TEXT NOT NULL,
  stored_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  sha256 TEXT NOT NULL,
  preview_kind TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  char_count INTEGER,
  storage_driver TEXT NOT NULL,
  uploader_ip TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets (created_at DESC);
`))
