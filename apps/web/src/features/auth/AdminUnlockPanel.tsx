// 管理解锁面板文件用于进入删除管理态，解决匿名共享场景中的高风险操作保护问题。
import { useState } from 'react';

interface Props {
  busy: boolean;
  unlocked: boolean;
  onUnlock: (password: string) => Promise<void>;
}

// AdminUnlockPanel 渲染管理态状态与口令输入入口。
export function AdminUnlockPanel({ busy, unlocked, onUnlock }: Props) {
  const [password, setPassword] = useState('');

  async function handleUnlock() {
    await onUnlock(password);
    setPassword('');
  }

  return (
    <section className="panel panel--glass">
      <span className="meta-label">Admin Mode</span>
      <div>
        <h2 className="panel__title">解锁编辑与删除</h2>
        <p className="panel__description">匿名访问者仍可上传、查看和下载，共享项的编辑与删除只对管理员开放。</p>
      </div>
      <div className="status-pill">{unlocked ? '管理模式已开启' : '当前为匿名共享模式'}</div>
      <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="输入管理口令" />
      <div className="unlock__actions">
        <button className="button" disabled={busy || unlocked || password.trim().length === 0} onClick={() => void handleUnlock()}>
          解锁管理能力
        </button>
      </div>
    </section>
  );
}
