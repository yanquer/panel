// Package metadata 提取图片与文本属性，解决预览与属性面板需要的宽高、字符数等信息归档问题。
package metadata

import (
	"bytes"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"strings"
)

type Result struct {
	Width     *int
	Height    *int
	CharCount *int
}

// FromBytes 根据内容类型从原始字节中提取附加属性。
func FromBytes(mimeType string, payload []byte) Result {
	if strings.HasPrefix(mimeType, "image/") {
		return imageResult(payload)
	}
	if strings.HasPrefix(mimeType, "text/") {
		return textResult(payload)
	}
	return Result{}
}

// imageResult 提取图片宽高属性，供预览和详情侧栏展示。
func imageResult(payload []byte) Result {
	cfg, _, err := image.DecodeConfig(bytes.NewReader(payload))
	if err != nil {
		return Result{}
	}
	width := cfg.Width
	height := cfg.Height
	return Result{Width: &width, Height: &height}
}

// textResult 统计文本字符数，供文字便签详情展示。
func textResult(payload []byte) Result {
	count := len([]rune(string(payload)))
	return Result{CharCount: &count}
}
