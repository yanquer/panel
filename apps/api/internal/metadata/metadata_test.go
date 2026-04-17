// Package metadata 的测试文件用于验证图片和文本属性提取，避免详情面板所需元数据缺失。
package metadata

import "testing"

var tinyPNG = []byte{137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84, 8, 91, 99, 248, 15, 4, 0, 9, 251, 3, 253, 160, 198, 55, 53, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130}

// TestFromBytes 验证元数据提取结果满足图片与文字资产需求。
func TestFromBytes(t *testing.T) {
	imageMeta := FromBytes("image/png", tinyPNG)
	if imageMeta.Width == nil || *imageMeta.Width != 1 {
		t.Fatalf("unexpected image width: %+v", imageMeta.Width)
	}
	textMeta := FromBytes("text/plain", []byte("你好，局域网"))
	if textMeta.CharCount == nil || *textMeta.CharCount != 6 {
		t.Fatalf("unexpected char count: %+v", textMeta.CharCount)
	}
}
