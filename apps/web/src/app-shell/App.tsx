// 应用主页面文件用于组装顶部操作区与双列工作区，解决共享流、编辑区和快捷操作入口分散的问题。
import { useState } from 'react';
import { AssetDetailPanel } from '../features/assets/AssetDetailPanel';
import { AssetGrid } from '../features/assets/AssetGrid';
import { EmptyState } from '../features/assets/EmptyState';
import { useAssetWorkspace } from '../features/assets/useAssetWorkspace';
import { AdminUnlockForm } from '../features/auth/AdminUnlockForm';
import { QuickCreatePanel } from '../features/upload/QuickCreatePanel';
import { SegmentedControl } from '../shared/components/SegmentedControl';
import { ModalShell } from '../shared/components/ModalShell';
import { ThemeToggle } from '../shared/components/ThemeToggle';
import { ToolbarIconButton } from '../shared/components/ToolbarIconButton';

type ActiveDialog = 'admin' | 'create' | null;

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '文字', value: 'snippet' },
  { label: '图片', value: 'image' },
  { label: '文件', value: 'file' },
] as const;

// App 渲染局域网共享服务的备忘录式主工作区。
export function App(): JSX.Element {
  const workspace = useAssetWorkspace();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const listStatus = workspace.loading ? '正在刷新共享流…' : workspace.items.length === 0 ? '共享流暂时为空' : `共享流中共有 ${workspace.items.length} 项`;
  const workspaceStatus = workspace.loading ? '共享流正在同步更新…' : workspace.message;

  // handleUnlock 完成管理态解锁后关闭当前弹窗。
  async function handleUnlock(password: string): Promise<void> {
    await workspace.unlock(password);
    setActiveDialog(null);
  }

  // handleSnippetSubmit 完成便签创建后关闭快捷新建弹窗。
  async function handleSnippetSubmit(title: string, content: string): Promise<void> {
    await workspace.submitSnippet(title, content);
    setActiveDialog(null);
  }

  // handleUpload 完成文件上传后关闭快捷新建弹窗。
  async function handleUpload(files: FileList | File[]): Promise<void> {
    await workspace.submitFiles(files);
    setActiveDialog(null);
  }

  return (
    <div className="app">
      <div className="notes-shell">
        <header className="workspace-hero panel panel--glass">
          <div className="workspace-hero__copy">
            <div className="workspace-hero__intro">
              <span className="meta-label">Lan Share</span>
              <h1 className="shell-title">同一网络，轻轻共享。</h1>
              <p className="shell-copy">像写备忘录一样保存一段文字、图片或文件，再从局域网里的其他设备继续查看、下载或编辑。</p>
            </div>
            <div className="workspace-hero__status-line">
              <div className="status-pill">{workspace.adminUnlocked ? '管理模式已开启' : '当前为匿名共享模式'}</div>
              <p className="workspace-hero__status muted">{workspaceStatus}</p>
            </div>
          </div>
          <div className="workspace-hero__toolbar" role="toolbar" aria-label="顶部操作">
            <ToolbarIconButton label={workspace.adminUnlocked ? '查看管理状态' : '打开管理面板'} active={workspace.adminUnlocked} showDot={workspace.adminUnlocked} onClick={() => setActiveDialog('admin')}>
              <svg viewBox="0 0 24 24">
                <path d="M12 12.2A4.1 4.1 0 1 0 12 4a4.1 4.1 0 0 0 0 8.2Z" />
                <path d="M4.5 19.3a7.8 7.8 0 0 1 15 0" />
              </svg>
            </ToolbarIconButton>
            <ThemeToggle />
            <ToolbarIconButton label="打开快捷新建" tone="accent" onClick={() => setActiveDialog('create')}>
              <svg viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </ToolbarIconButton>
          </div>
        </header>

        <main className="notes-main">
          <section className="notes-list panel panel--glass" aria-label="共享列表区域">
            <div className="notes-list__header">
              <div className="notes-list__header-copy">
                <span className="meta-label">Shared Notes</span>
                <h2 className="section-title">共享流</h2>
              </div>
              <SegmentedControl ariaLabel="资产过滤" value={workspace.filter} options={filterOptions} onChange={workspace.setFilter} />
            </div>
            <p className="notes-list__status muted">{listStatus}</p>
            {workspace.items.length === 0 && !workspace.loading ? <EmptyState /> : <AssetGrid items={workspace.items} selectedId={workspace.selectedId} onSelect={workspace.selectAsset} />}
          </section>
          <AssetDetailPanel asset={workspace.selectedAsset} busy={workspace.busy} adminUnlocked={workspace.adminUnlocked} onDelete={workspace.remove} onSave={workspace.saveAsset} />
        </main>
      </div>
      <ModalShell open={activeDialog === 'admin'} onClose={() => setActiveDialog(null)} title="管理模式" description="输入管理口令后，可编辑标题、便签正文并删除共享项。">
        <AdminUnlockForm busy={workspace.busy} unlocked={workspace.adminUnlocked} onUnlock={handleUnlock} />
      </ModalShell>
      <ModalShell open={activeDialog === 'create'} onClose={() => setActiveDialog(null)} size="wide" title="快捷新建" description="可以直接写便签，也可以拖入图片或文件加入共享流。">
        <QuickCreatePanel busy={workspace.busy} onSnippetSubmit={handleSnippetSubmit} onUpload={handleUpload} />
      </ModalShell>
    </div>
  );
}
