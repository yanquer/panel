// Package preview 负责根据资产类型与 MIME 判断预览策略，解决不同内容在前端的展示方式选择。
package preview

import (
	"strings"

	"lan-share/api/internal/domain"
)

// Detect 根据资产类型与 MIME 推导预览类型。
func Detect(kind domain.AssetKind, mimeType string) domain.PreviewKind {
	if kind == domain.AssetKindSnippet {
		return domain.PreviewKindText
	}
	if strings.HasPrefix(mimeType, "image/") {
		return domain.PreviewKindImage
	}
	if mimeType == "application/pdf" {
		return domain.PreviewKindPDF
	}
	if strings.HasPrefix(mimeType, "text/") {
		return domain.PreviewKindText
	}
	return domain.PreviewKindUnsupported
}
