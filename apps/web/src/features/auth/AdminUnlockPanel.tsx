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
    <section className="panel">
      <span className="meta-label">Admin Mode</span>
      <div>
        <h2 className="asset-title">删除前先进入管理态</h2>
        <p className="muted">默认所有访问者都能上传、查看和下载，但删除需要口令确认。</p>
      </div>
      <div className="status-pill">{unlocked ? '管理模式已开启' : '当前为匿名共享模式'}</div>
      <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="输入管理口令" />
      <div className="unlock__actions">
        <button className="button" disabled={busy || unlocked || password.trim().length === 0} onClick={() => void handleUnlock()}>
          解锁删除能力
        </button>
      </div>
    </section>
  );
}
