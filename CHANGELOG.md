<!-- 该文件用于记录项目变更历史，按日期归档每次重要的功能、部署、文档和测试更新，方便后续追踪演进过程。 -->
# Changelog

## 2026-04-17

### 新增
- 初始化 Git 仓库，默认分支为 `main`
- 新建局域网共享服务项目骨架，完成 `Go API + React Web + Docker Compose` 基础结构
- 支持文字、图片、文件的统一资产模型、上传、预览、属性查看、下载与管理态删除
- 新增 Apple 风格浅色/深色双主题界面与前端交互测试、端到端功能测试
- 补充 `README.md`、`docs/api/openapi.yaml`、`docs/development.md`、`docs/deployment/compose.md`、`docs/design.md`

### 变更
- 共享流新增卡片 / 列表主视图切换，并为列表模式补充 Finder、大缩略、表格三种风格
- 详情面板重排为内容优先布局，扩大预览区域并降低格式属性的视觉权重
