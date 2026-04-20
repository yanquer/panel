// 文字编辑器文件用于快速创建便签共享项，解决临时文字内容在局域网中的即刻分发问题。
import { useState } from 'react';

interface Props {
  busy: boolean;
  onSubmit: (title: string, content: string) => Promise<void>;
}

// SnippetComposer 渲染文字便签创建区域。
export function SnippetComposer({ busy, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  async function handleSubmit() {
    await onSubmit(title, content);
    setTitle('');
    setContent('');
  }

  return (
    <section className="panel panel--glass">
      <span className="meta-label">Quick Note</span>
      <div>
        <h2 className="panel__title">快速写下一段内容</h2>
        <p className="panel__description">适合密码、临时说明、待办或一段刚复制出来的文字，发布后会立刻进入共享流。</p>
      </div>
      <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="标题，可留空" />
      <textarea className="textarea" value={content} onChange={(event) => setContent(event.target.value)} placeholder="输入将要共享的文字" />
      <div className="composer__actions">
        <button className="button button--primary" disabled={busy || content.trim().length === 0} onClick={() => void handleSubmit()}>
          发布文字
        </button>
      </div>
    </section>
  );
}
