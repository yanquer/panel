// 剪贴板工具文件用于统一处理文字复制与兼容回退，解决局域网 HTTP 场景下 navigator.clipboard 不稳定的问题。

// copyText 先尝试系统剪贴板接口，失败时回退到隐藏文本域复制。
export async function copyText(value: string): Promise<void> {
  if (canUseClipboardApi()) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      copyTextWithTextarea(value);
      return;
    }
  }
  copyTextWithTextarea(value);
}

// canUseClipboardApi 判断当前环境是否可直接使用系统剪贴板接口。
function canUseClipboardApi(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function';
}

// copyTextWithTextarea 通过隐藏文本域和 execCommand 完成复制回退。
function copyTextWithTextarea(value: string): void {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) {
    throw new Error('copy failed');
  }
}
