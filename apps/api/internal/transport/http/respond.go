// Package http 提供 API 响应辅助函数，解决 JSON、错误码与下载响应的统一输出问题。
package http

import (
	"encoding/json"
	"errors"
	stdhttp "net/http"

	"lan-share/api/internal/domain"
)

type errorBody struct {
	Message string `json:"message"`
}

// writeJSON 输出标准 JSON 响应体。
func writeJSON(w stdhttp.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// writeError 根据业务错误映射统一 HTTP 状态码。
func writeError(w stdhttp.ResponseWriter, err error) {
	writeJSON(w, mapStatus(err), errorBody{Message: err.Error()})
}

// mapStatus 把业务错误转换为外部响应状态码。
func mapStatus(err error) int {
	switch {
	case errors.Is(err, domain.ErrUnauthorized):
		return stdhttp.StatusUnauthorized
	case errors.Is(err, domain.ErrInvalidInput):
		return stdhttp.StatusBadRequest
	case errors.Is(err, domain.ErrAssetNotFound):
		return stdhttp.StatusNotFound
	case errors.Is(err, domain.ErrPreviewBlocked):
		return stdhttp.StatusUnsupportedMediaType
	default:
		return stdhttp.StatusInternalServerError
	}
}
