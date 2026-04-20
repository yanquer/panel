// 空状态文件用于在没有共享内容时提供轻量引导，解决首屏空列表缺乏方向感的问题。
// EmptyState 渲染 Apple 风格的简洁空状态提示。
export function EmptyState() {
  return (
    <section className="empty">
      <span className="empty__glyph">⌘</span>
      <div>
        <h2 className="empty__title">还没有共享内容</h2>
        <p className="muted">先写一段文字，或拖一张图片进来。第一条内容出现后，中间列表会自动形成共享流。</p>
      </div>
    </section>
  );
}
