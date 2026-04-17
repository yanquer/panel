// Package auth 提供管理态解锁与校验能力，用于在免登录场景下保护删除等高风险操作。
package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
)

const CookieName = "lan_share_admin"

type SessionManager struct {
	password string
	secret   string
}

// NewSessionManager 创建基于口令与密钥的管理态会话管理器。
func NewSessionManager(password string, secret string) SessionManager {
	return SessionManager{password: password, secret: secret}
}

// ValidatePassword 校验输入的管理口令是否正确。
func (m SessionManager) ValidatePassword(password string) bool {
	return hmac.Equal([]byte(password), []byte(m.password))
}

// IssueToken 生成写入 Cookie 的管理态签名令牌。
func (m SessionManager) IssueToken() string {
	mac := hmac.New(sha256.New, []byte(m.secret))
	mac.Write([]byte(m.password))
	return hex.EncodeToString(mac.Sum(nil))
}

// ValidateToken 校验请求携带的令牌是否为当前有效管理态。
func (m SessionManager) ValidateToken(token string) bool {
	return hmac.Equal([]byte(token), []byte(m.IssueToken()))
}
