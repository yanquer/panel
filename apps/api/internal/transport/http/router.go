// Package http 负责装配路由与中间件，解决 API 服务入口的访问路径、跨域与日志衔接问题。
package http

import (
	"log"
	stdhttp "net/http"
	"time"
)

// NewRouter 装配 API 路由与基础中间件。
func NewRouter(handler Handler) stdhttp.Handler {
	mux := stdhttp.NewServeMux()
	mux.HandleFunc("OPTIONS /", options)
	mux.HandleFunc("POST /api/v1/admin/unlock", handler.Unlock)
	mux.HandleFunc("POST /api/v1/assets/snippets", handler.CreateSnippet)
	mux.HandleFunc("POST /api/v1/assets/files", handler.CreateFile)
	mux.HandleFunc("GET /api/v1/assets", handler.ListAssets)
	mux.HandleFunc("GET /api/v1/assets/{id}", handler.GetAsset)
	mux.HandleFunc("GET /api/v1/assets/{id}/content", handler.GetContent)
	mux.HandleFunc("GET /api/v1/assets/{id}/preview", handler.GetPreview)
	mux.HandleFunc("DELETE /api/v1/assets/{id}", handler.DeleteAsset)
	return withLogging(withCORS(mux))
}

// options 返回跨域预检请求响应。
func options(w stdhttp.ResponseWriter, _ *stdhttp.Request) {
	w.WriteHeader(stdhttp.StatusNoContent)
}

// withCORS 为浏览器访问提供局域网场景下所需的跨域响应头。
func withCORS(next stdhttp.Handler) stdhttp.Handler {
	return stdhttp.HandlerFunc(func(w stdhttp.ResponseWriter, r *stdhttp.Request) {
		applyCORSHeaders(w, r)
		if r.Method == stdhttp.MethodOptions {
			w.WriteHeader(stdhttp.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// withLogging 输出简洁请求日志，便于本地调试与 Compose 观察。
func withLogging(next stdhttp.Handler) stdhttp.Handler {
	return stdhttp.HandlerFunc(func(w stdhttp.ResponseWriter, r *stdhttp.Request) {
		startedAt := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(startedAt).String())
	})
}

// applyCORSHeaders 回显请求来源并允许携带管理态 Cookie。
func applyCORSHeaders(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	origin := r.Header.Get("Origin")
	if origin != "" {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
	}
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS")
}
