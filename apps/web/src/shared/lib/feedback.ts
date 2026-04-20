// 提示状态文件用于描述顶部浮层提示的文案与视觉语气，解决复制动作需要统一反馈结构的问题。

export type FeedbackTone = 'success' | 'error';

export interface FeedbackNotice {
  tone: FeedbackTone;
  message: string;
}

// feedbackDuration 根据提示语气返回自动消失时长。
export function feedbackDuration(tone: FeedbackTone): number {
  return tone === 'error' ? 3200 : 2200;
}
