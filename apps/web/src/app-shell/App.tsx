// 应用主页面文件用于组合首页结构、共享流与详情区域，解决 Apple 风格局域网共享界面的整体呈现问题。
import { useMemo } from 'react';
import { EmptyState } from '../features/assets/EmptyState';
import { AssetGrid } from '../features/assets/AssetGrid';
import { AssetDetailPanel } from '../features/assets/AssetDetailPanel';
import { useAssetWorkspace } from '../features/assets/useAssetWorkspace';
import { AdminUnlockPanel } from '../features/auth/AdminUnlockPanel';
import { SnippetComposer } from '../features/upload/SnippetComposer';
import { UploadDropzone } from '../features/upload/UploadDropzone';
import { SegmentedControl } from '../shared/components/SegmentedControl';
import { ThemeToggle } from '../shared/components/ThemeToggle';

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '文字', value: 'snippet' },
  { label: '图片', value: 'image' },
  { label: '文件', value: 'file' },
] as const;

// App 渲染局域网共享服务的主界面。
export function App() {
  const workspace = useAssetWorkspace();
  const counts = useMemo(() => summarize(workspace.items), [workspace.items]);

  return (
    <div className="app">
      <div className="shell">
        <header className="hero">
          <div className="hero__bar">
            <div>
              <span className="hero__eyebrow">Lan Share</span>
              <h1 className="hero__title">同一网络，安静共享。</h1>
              <p className="hero__summary">把一段文字、一张图片或一个文件轻轻放进来，局域网内的设备就能立刻查看、预览和下载。</p>
            </div>
            <div className="hero__stats">
              <div className="toolbar__right">
                <div className="status-pill">局域网共享已在线</div>
                <ThemeToggle />
              </div>
              <StatCard label="共享总数" value={String(counts.total)} />
              <StatCard label="图片与文件" value={String(counts.media)} />
              <StatCard label="文字便签" value={String(counts.snippets)} />
            </div>
          </div>
        </header>

        <main className="workspace">
          <div className="workspace__main">
            <SnippetComposer busy={workspace.busy} onSubmit={workspace.submitSnippet} />
            <UploadDropzone busy={workspace.busy} onUpload={workspace.submitFiles} />
          </div>

          <section className="workspace__main">
            <div className="toolbar panel panel--glass">
              <SegmentedControl value={workspace.filter} options={filterOptions} onChange={workspace.setFilter} />
              <div className="toolbar__right">
                <span className="muted">{workspace.loading ? '正在刷新共享流…' : workspace.message}</span>
              </div>
            </div>
            {workspace.items.length === 0 && !workspace.loading ? <EmptyState /> : <AssetGrid items={workspace.items} selectedId={workspace.selectedId} onSelect={workspace.selectAsset} />}
          </section>

          <div className="workspace__main">
            <AdminUnlockPanel busy={workspace.busy} unlocked={workspace.adminUnlocked} onUnlock={workspace.unlock} />
            <AssetDetailPanel asset={workspace.selectedAsset} busy={workspace.busy} adminUnlocked={workspace.adminUnlocked} onDelete={workspace.remove} />
          </div>
        </main>
      </div>
    </div>
  );
}

// StatCard 渲染首页顶部的单个统计卡片。
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="hero__stat">
      <span className="meta-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

// summarize 统计首页展示所需的资产数量概览。
function summarize(items: { kind: string }[]) {
  const snippets = items.filter((item) => item.kind === 'snippet').length;
  const media = items.filter((item) => item.kind !== 'snippet').length;
  return { total: items.length, snippets, media };
}
