// 通用弹窗壳文件用于统一处理遮罩、关闭、标题和移动端底部弹层行为，解决多个弹窗重复实现和交互不一致的问题。
import { useEffect, useId } from 'react';
import type { MouseEvent, PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

type ModalSize = 'compact' | 'wide';

interface Props extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
}

// ModalShell 渲染带遮罩与标题区的通用弹窗容器。
export function ModalShell({ open, onClose, title, description, size = 'compact', children }: Props): JSX.Element | null {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="modal-shell" role="presentation" onClick={handleBackdropClick}>
      <section className="modal-shell__panel" data-size={size} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}>
        <div className="modal-shell__header">
          <div className="modal-shell__title-block">
            <h2 className="modal-shell__title" id={titleId}>{title}</h2>
            {description ? <p className="modal-shell__description" id={descriptionId}>{description}</p> : null}
          </div>
          <button className="modal-shell__close" type="button" aria-label="关闭弹窗" onClick={onClose}>
            <svg viewBox="0 0 24 24">
              <path d="M6 6L18 18M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="modal-shell__body">{children}</div>
      </section>
    </div>,
    document.body,
  );

  // handleBackdropClick 在点击遮罩空白区域时关闭弹窗。
  function handleBackdropClick(event: MouseEvent<HTMLDivElement>): void {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
}
