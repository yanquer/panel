// Package preview 的测试文件用于校验不同资产类型的预览策略，避免前端展示分支回归。
package preview

import (
	"testing"

	"lan-share/api/internal/domain"
)

// TestDetect 验证不同输入会映射到正确的预览类型。
func TestDetect(t *testing.T) {
	cases := []struct {
		name     string
		kind     domain.AssetKind
		mimeType string
		want     domain.PreviewKind
	}{
		{name: "snippet", kind: domain.AssetKindSnippet, mimeType: "text/plain", want: domain.PreviewKindText},
		{name: "image", kind: domain.AssetKindImage, mimeType: "image/png", want: domain.PreviewKindImage},
		{name: "pdf", kind: domain.AssetKindFile, mimeType: "application/pdf", want: domain.PreviewKindPDF},
		{name: "binary", kind: domain.AssetKindFile, mimeType: "application/octet-stream", want: domain.PreviewKindUnsupported},
	}
	for _, item := range cases {
		if got := Detect(item.kind, item.mimeType); got != item.want {
			t.Fatalf("%s: got %s want %s", item.name, got, item.want)
		}
	}
}
