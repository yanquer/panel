// Package storage 的测试文件用于验证本地存储驱动的读写删能力，避免 local 模式行为与预期不一致。
package storage

import (
	"bytes"
	"context"
	"io"
	"testing"
)

// TestLocalStoreContract 验证本地存储满足统一对象存储契约。
func TestLocalStoreContract(t *testing.T) {
	store, err := NewLocalStore(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	info, err := store.Put(context.Background(), PutInput{Key: "assets/demo.txt", ContentType: "text/plain", Reader: bytes.NewReader([]byte("demo")), Size: 4})
	if err != nil || info.Size != 4 {
		t.Fatalf("put failed: %v %+v", err, info)
	}
	reader, err := store.Get(context.Background(), "assets/demo.txt")
	if err != nil {
		t.Fatal(err)
	}
	payload, err := io.ReadAll(reader.Body)
	reader.Body.Close()
	if err != nil || string(payload) != "demo" {
		t.Fatalf("get failed: %v %s", err, string(payload))
	}
	if err = store.Delete(context.Background(), "assets/demo.txt"); err != nil {
		t.Fatal(err)
	}
}
