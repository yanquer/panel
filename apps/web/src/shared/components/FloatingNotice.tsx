// 顶部浮层提示文件用于在页面顶部居中展示短暂反馈，解决复制结果缺少即时提示的问题。
import { createPortal } from 'react-dom';
import type { FeedbackNotice } from '../lib/feedback';

interface Props {
  notice: FeedbackNotice | null;
}

// FloatingNotice 渲染顶部居中的 Apple 风格轻提示。
export function FloatingNotice({ notice }: Props): JSX.Element | null {
  if (!notice) {
    return null;
  }

  return createPortal(
    <div className="floating-notice-layer" aria-live="polite">
      <div className="floating-notice" data-tone={notice.tone} role={notice.tone === 'error' ? 'alert' : 'status'}>
        <span className="floating-notice__icon" aria-hidden="true">
          {notice.tone === 'success' ? '✓' : '!'}
        </span>
        <p className="floating-notice__text">{notice.message}</p>
      </div>
    </div>,
    document.body,
  );
}
