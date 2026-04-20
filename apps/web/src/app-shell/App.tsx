// 应用主页面文件用于组装备忘录式三栏工作区，解决共享流、编辑区和管理区层级不清的问题。
import { AssetDetailPanel } from '../features/assets/AssetDetailPanel';
import { AssetGrid } from '../features/assets/AssetGrid';
import { EmptyState } from '../features/assets/EmptyState';
import { useAssetWorkspace } from '../features/assets/useAssetWorkspace';
import { AdminUnlockPanel } from '../features/auth/AdminUnlockPanel';
import { UploadDropzone } from '../features/upload/UploadDropzone';
import { SnippetComposer } from '../features/upload/SnippetComposer';
import { SegmentedControl } from '../shared/components/SegmentedControl';
import { ThemeToggle } from '../shared/components/ThemeToggle';

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '文字', value: 'snippet' },
  { label: '图片', value: 'image' },
  { label: '文件', value: 'file' },
] as const;

// App 渲染局域网共享服务的备忘录式主工作区。
export function App(): JSX.Element {
  const workspace = useAssetWorkspace();

  return (
    <div className="app">
      <div className="notes-shell">
        <aside className="notes-sidebar">
          <header className="notes-sidebar__header panel panel--glass">
            <div className="notes-sidebar__intro">
              <span className="meta-label">Lan Share</span>
              <h1 className="shell-title">同一网络，轻轻共享。</h1>
              <p className="shell-copy">像写备忘录一样保存一段文字、图片或文件，再从局域网里的其他设备继续查看、下载或编辑。</p>
            </div>
            <ThemeToggle />
          </header>
          <div className="notes-sidebar__panels">
            <SnippetComposer busy={workspace.busy} onSubmit={workspace.submitSnippet} />
            <UploadDropzone busy={workspace.busy} onUpload={workspace.submitFiles} />
            <AdminUnlockPanel busy={workspace.busy} unlocked={workspace.adminUnlocked} onUnlock={workspace.unlock} />
          </div>
        </aside>

        <main className="notes-main">
          <section className="notes-list panel panel--glass" aria-label="共享列表区域">
            <div className="notes-list__header">
              <div>
                <span className="meta-label">Shared Notes</span>
                <h2 className="section-title">共享流</h2>
              </div>
              <SegmentedControl ariaLabel="资产过滤" value={workspace.filter} options={filterOptions} onChange={workspace.setFilter} />
            </div>
            <p className="notes-list__status muted">{workspace.loading ? '正在刷新共享流…' : workspace.message}</p>
            {workspace.items.length === 0 && !workspace.loading ? <EmptyState /> : <AssetGrid items={workspace.items} selectedId={workspace.selectedId} onSelect={workspace.selectAsset} />}
          </section>
          <AssetDetailPanel asset={workspace.selectedAsset} busy={workspace.busy} adminUnlocked={workspace.adminUnlocked} onDelete={workspace.remove} onSave={workspace.saveAsset} />
        </main>
      </div>
    </div>
  );
}
