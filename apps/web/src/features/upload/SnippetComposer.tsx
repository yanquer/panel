// 文字编辑器文件用于快速创建便签共享项，解决临时文字内容在局域网中的即刻分发问题。
import { useState } from 'react';
import type { FormEvent } from 'react';

interface Props {
  busy: boolean;
  onSubmit: (title: string, content: string) => Promise<void>;
}

// SnippetComposer 渲染文字便签创建区域。
export function SnippetComposer({ busy, onSubmit }: Props): JSX.Element {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // submitSnippet 提交当前便签并在成功后清空表单。
  async function submitSnippet(): Promise<void> {
    await onSubmit(title, content);
    setTitle('');
    setContent('');
  }

  // handleSubmit 拦截表单默认提交并转交便签创建动作。
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submitSnippet();
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <span className="meta-label">Quick Note</span>
      <div className="quick-create__section-head">
        <h2 className="panel__title">快速写下一段内容</h2>
        <p className="panel__description">适合密码、临时说明、待办或一段刚复制出来的文字，发布后会立刻进入共享流。</p>
      </div>
      <label className="detail__field">
        <span className="field-label">标题</span>
        <input className="input" value={title} disabled={busy} onChange={(event) => setTitle(event.target.value)} placeholder="标题，可留空" />
      </label>
      <label className="detail__field">
        <span className="field-label">正文</span>
        <textarea className="textarea" value={content} disabled={busy} onChange={(event) => setContent(event.target.value)} placeholder="输入将要共享的文字" />
      </label>
      <div className="composer__actions">
        <button className="button button--primary" disabled={busy || content.trim().length === 0} type="submit">
          发布文字
        </button>
      </div>
    </form>
  );
}
