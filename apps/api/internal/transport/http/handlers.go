// Package http 实现局域网共享服务的 HTTP 入口，解决外部请求与内部业务能力之间的协议转换问题。
package http

import (
	"encoding/json"
	"fmt"
	"io"
	stdhttp "net/http"
	"strings"
	"time"

	"lan-share/api/internal/auth"
	"lan-share/api/internal/domain"
	"lan-share/api/internal/service"
)

type Handler struct {
	assets  service.AssetService
	session auth.SessionManager
}

type unlockRequest struct {
	Password string `json:"password"`
}

type snippetRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

type updateAssetRequest struct {
	Title   string  `json:"title"`
	Content *string `json:"content,omitempty"`
}

// NewHandler 创建 API 处理器并注入业务依赖。
func NewHandler(assets service.AssetService, session auth.SessionManager) Handler {
	return Handler{assets: assets, session: session}
}

// Unlock 校验管理口令并写入管理态 Cookie。
func (h Handler) Unlock(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	request := unlockRequest{}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, domain.ErrInvalidInput)
		return
	}
	if !h.session.ValidatePassword(request.Password) {
		writeError(w, domain.ErrUnauthorized)
		return
	}
	stdhttp.SetCookie(w, h.adminCookie())
	writeJSON(w, stdhttp.StatusOK, map[string]bool{"ok": true})
}

// CreateSnippet 创建文字便签资产。
func (h Handler) CreateSnippet(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	request := snippetRequest{}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, domain.ErrInvalidInput)
		return
	}
	asset, err := h.assets.CreateSnippet(r.Context(), service.CreateSnippetInput{Title: request.Title, Content: request.Content, UploaderIP: clientIP(r)})
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusCreated, asset)
}

// CreateFile 处理图片和文件上传请求。
func (h Handler) CreateFile(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, domain.ErrInvalidInput)
		return
	}
	defer file.Close()
	payload, err := service.ReadUpload(file)
	if err != nil {
		writeError(w, err)
		return
	}
	asset, err := h.assets.CreateFile(r.Context(), service.CreateFileInput{FileName: header.Filename, Content: payload, UploaderIP: clientIP(r)})
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusCreated, asset)
}

// ListAssets 返回按类型过滤后的资产列表。
func (h Handler) ListAssets(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	filter := parseListFilter(r)
	assets, err := h.assets.List(r.Context(), filter)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]any{"items": assets})
}

// GetAsset 返回单个资产详情。
func (h Handler) GetAsset(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	asset, err := h.assets.Get(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusOK, asset)
}

// UpdateAsset 更新指定资产的标题与便签正文。
func (h Handler) UpdateAsset(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	if !h.isAdmin(r) {
		writeError(w, domain.ErrUnauthorized)
		return
	}
	request := updateAssetRequest{}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, domain.ErrInvalidInput)
		return
	}
	asset, err := h.assets.Update(r.Context(), service.UpdateAssetInput{ID: r.PathValue("id"), Title: request.Title, Content: request.Content})
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusOK, asset)
}

// GetContent 输出资产原始内容，用于下载。
func (h Handler) GetContent(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	h.writeObject(w, r, false)
}

// GetPreview 输出资产预览内容，用于前端内嵌展示。
func (h Handler) GetPreview(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	h.writeObject(w, r, true)
}

// DeleteAsset 删除指定资产。
func (h Handler) DeleteAsset(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	if !h.isAdmin(r) {
		writeError(w, domain.ErrUnauthorized)
		return
	}
	if err := h.assets.Delete(r.Context(), r.PathValue("id")); err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]bool{"ok": true})
}

// writeObject 复用内容读取逻辑并设置预览/下载响应头。
func (h Handler) writeObject(w stdhttp.ResponseWriter, r *stdhttp.Request, previewMode bool) {
	result, err := h.assets.OpenContent(r.Context(), r.PathValue("id"), previewMode)
	if err != nil {
		writeError(w, err)
		return
	}
	defer result.Object.Body.Close()
	setObjectHeaders(w, result.Asset, previewMode)
	_, _ = io.Copy(w, result.Object.Body)
}

// adminCookie 构造管理态 Cookie，供解锁成功后写回浏览器。
func (h Handler) adminCookie() *stdhttp.Cookie {
	return &stdhttp.Cookie{Name: auth.CookieName, Value: h.session.IssueToken(), Path: "/", HttpOnly: true, SameSite: stdhttp.SameSiteLaxMode, Expires: time.Now().Add(12 * time.Hour)}
}

// isAdmin 判断当前请求是否已经进入管理态。
func (h Handler) isAdmin(r *stdhttp.Request) bool {
	cookie, err := r.Cookie(auth.CookieName)
	return err == nil && h.session.ValidateToken(cookie.Value)
}

// parseListFilter 把查询参数映射为资产筛选条件。
func parseListFilter(r *stdhttp.Request) domain.ListFilter {
	kind := strings.TrimSpace(r.URL.Query().Get("kind"))
	if kind == "" {
		return domain.ListFilter{}
	}
	value := domain.AssetKind(kind)
	return domain.ListFilter{Kind: &value}
}

// clientIP 提取当前请求来源 IP 便于展示上传来源。
func clientIP(r *stdhttp.Request) string {
	if forwarded := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); forwarded != "" {
		return strings.Split(forwarded, ",")[0]
	}
	return strings.Split(r.RemoteAddr, ":")[0]
}

// setObjectHeaders 根据预览模式设置内容类型与下载头。
func setObjectHeaders(w stdhttp.ResponseWriter, asset domain.Asset, previewMode bool) {
	w.Header().Set("Content-Type", asset.MimeType)
	if previewMode {
		w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=%q", service.DownloadName(asset)))
		return
	}
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", service.DownloadName(asset)))
}
