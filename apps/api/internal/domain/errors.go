// Package domain 定义服务层复用的业务错误，便于在 HTTP 层统一映射响应状态。
package domain

import "errors"

var (
	ErrUnauthorized   = errors.New("unauthorized")
	ErrInvalidInput   = errors.New("invalid input")
	ErrAssetNotFound  = errors.New("asset not found")
	ErrPreviewBlocked = errors.New("preview blocked")
)
