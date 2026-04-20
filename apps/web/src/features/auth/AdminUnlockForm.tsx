// 管理解锁表单文件用于在弹窗中输入管理口令并进入管理态，解决顶部头像入口迁移后仍需安全解锁的问题。
import { useState } from 'react';
import type { FormEvent } from 'react';

interface Props {
  busy: boolean;
  unlocked: boolean;
  onUnlock: (password: string) => Promise<void>;
}

// AdminUnlockForm 渲染管理模式的口令输入和状态信息。
export function AdminUnlockForm({ busy, unlocked, onUnlock }: Props): JSX.Element {
  const [password, setPassword] = useState('');

  // submitUnlock 提交管理口令并在成功后清空输入值。
  async function submitUnlock(): Promise<void> {
    await onUnlock(password);
    setPassword('');
  }

  // handleSubmit 拦截表单默认提交并转交解锁动作。
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submitUnlock();
  }

  return (
    <form className="unlock-form" onSubmit={handleSubmit}>
      <span className="meta-label">Admin Mode</span>
      <div className="quick-create__section-head">
        <h3 className="panel__title">解锁编辑与删除</h3>
        <p className="panel__description">匿名访问者仍可上传、查看和下载，共享项的编辑与删除只对管理员开放。</p>
      </div>
      <div className="status-pill">{unlocked ? '管理模式已开启' : '当前为匿名共享模式'}</div>
      <label className="detail__field">
        <span className="field-label">管理口令</span>
        <input className="input" type="password" value={password} autoFocus onChange={(event) => setPassword(event.target.value)} placeholder="输入管理口令" />
      </label>
      <div className="unlock__actions">
        <button className="button button--primary" disabled={busy || unlocked || password.trim().length === 0} type="submit">
          解锁管理能力
        </button>
      </div>
    </form>
  );
}
