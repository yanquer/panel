// Package domain 定义共享资产的核心领域模型与查询结构，用于统一文字、图片和文件的元数据表达。
package domain

import "time"

type AssetKind string

type StorageDriver string

type PreviewKind string

const (
	AssetKindSnippet AssetKind = "snippet"
	AssetKindImage   AssetKind = "image"
	AssetKindFile    AssetKind = "file"
)

const (
	StorageDriverLocal StorageDriver = "local"
	StorageDriverMinio StorageDriver = "minio"
)

const (
	PreviewKindText        PreviewKind = "text"
	PreviewKindImage       PreviewKind = "image"
	PreviewKindPDF         PreviewKind = "pdf"
	PreviewKindUnsupported PreviewKind = "unsupported"
)

type Asset struct {
	ID            string        `json:"id"`
	Kind          AssetKind     `json:"kind"`
	Title         string        `json:"title"`
	TextContent   string        `json:"textContent,omitempty"`
	OriginalName  string        `json:"originalName"`
	StoredKey     string        `json:"-"`
	MimeType      string        `json:"mimeType"`
	SizeBytes     int64         `json:"sizeBytes"`
	SHA256        string        `json:"sha256"`
	PreviewKind   PreviewKind   `json:"previewKind"`
	Width         *int          `json:"width,omitempty"`
	Height        *int          `json:"height,omitempty"`
	CharCount     *int          `json:"charCount,omitempty"`
	StorageDriver StorageDriver `json:"storageDriver"`
	UploaderIP    string        `json:"uploaderIp"`
	CreatedAt     time.Time     `json:"createdAt"`
}

type ListFilter struct {
	Kind *AssetKind
}
