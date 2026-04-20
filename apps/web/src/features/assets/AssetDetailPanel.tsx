// 资产详情面板文件用于渲染内容优先的阅读与编辑画布，解决预览区、标题和属性区层级过于接近的问题。
import type { Asset, UpdateAssetInput } from '../../api/types';
import { contentUrl, previewUrl } from '../../api/client';
import { assetKindLabel, assetMetaLine, formatBytes } from '../../shared/lib/format';
import { useAssetEditor } from './useAssetEditor';

interface Props {
  asset: Asset | null;
  busy: boolean;
  adminUnlocked: boolean;
  onDelete: (assetId: string) => Promise<void>;
  onSave: (assetId: string, input: UpdateAssetInput) => Promise<Asset>;
}

// AssetDetailPanel 渲染当前选中共享项的阅读、编辑和管理操作区域。
export function AssetDetailPanel({ asset, busy, adminUnlocked, onDelete, onSave }: Props): JSX.Element {
  const editor = useAssetEditor(asset, onSave);

  if (!asset) {
    return (
      <aside className="detail detail--glass" aria-label="共享详情">
        <div className="detail__chrome">
          <div>
            <span className="meta-label">Content Canvas</span>
            <h2 className="section-title">当前内容</h2>
          </div>
        </div>
        <div className="detail__empty">
          <span className="empty__glyph">⌘</span>
          <h3 className="detail__empty-title">选中一条共享内容</h3>
          <p className="muted">中间列表负责浏览，右侧画布负责查看和编辑。解锁管理态后，这里也会出现保存与删除操作。</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="detail detail--glass" aria-label="共享详情">
      <div className="detail__chrome">
        <div>
          <span className="meta-label">Content Canvas</span>
          <h2 className="section-title">当前内容</h2>
        </div>
        <div className="status-pill">{adminUnlocked ? '管理模式已开启' : '当前为只读浏览'}</div>
      </div>
      <section className="detail__editor" aria-label="编辑区域">
        <TitleField adminUnlocked={adminUnlocked} title={editor.draft.title} onChange={editor.setTitle} />
        <p className="detail__summary">{assetMetaLine(asset)}</p>
        {!adminUnlocked ? <p className="detail__hint">解锁管理态后可编辑标题、便签正文和删除共享项。</p> : null}
      </section>
      <div className="detail__content" role="region" aria-label="内容画布">
        <PreviewStage asset={asset} adminUnlocked={adminUnlocked} busy={busy} content={editor.draft.content} onChange={editor.setContent} />
      </div>
      <AdminActions asset={asset} adminUnlocked={adminUnlocked} busy={busy} dirty={editor.dirty} isSnippet={editor.isSnippet} onDelete={onDelete} onReset={editor.reset} onSave={editor.save} />
      <PropertyGrid asset={asset} />
    </aside>
  );
}

// TitleField 渲染标题的只读展示或管理员可编辑输入框。
function TitleField({ adminUnlocked, title, onChange }: { adminUnlocked: boolean; title: string; onChange: (value: string) => void }): JSX.Element {
  return adminUnlocked ? (
    <label className="detail__field">
      <span className="field-label">标题</span>
      <input className="detail__title-input" value={title} onChange={(event) => onChange(event.target.value)} placeholder="输入共享标题" />
    </label>
  ) : (
    <div className="detail__title-block">
      <span className="field-label">标题</span>
      <h3 className="detail__title">{title}</h3>
    </div>
  );
}

// PreviewStage 根据资产类型渲染正文编辑区、图片预览区或下载舞台。
function PreviewStage({ asset, adminUnlocked, busy, content, onChange }: { asset: Asset; adminUnlocked: boolean; busy: boolean; content: string; onChange: (value: string) => void }): JSX.Element {
  if (asset.kind === 'snippet') {
    return adminUnlocked ? (
      <label className="detail__field detail__field--canvas">
        <span className="field-label">正文</span>
        <textarea className="detail__canvas-editor" disabled={busy} value={content} onChange={(event) => onChange(event.target.value)} placeholder="输入便签正文" />
      </label>
    ) : (
      <article className="preview__text preview__text--note">{asset.textContent ?? asset.title}</article>
    );
  }
  if (asset.previewKind === 'image') {
    return <div className="preview__image preview__image--stage"><img src={previewUrl(asset.id)} alt={asset.title} /></div>;
  }
  if (asset.previewKind === 'pdf') {
    return <div className="preview__image preview__image--stage"><iframe title={asset.title} src={previewUrl(asset.id)} /></div>;
  }
  return (
    <div className="preview__fallback preview__fallback--stage">
      <span className="empty__glyph">↓</span>
      <p className="muted">此文件暂不支持内嵌预览，可以直接下载后查看原始内容。</p>
      <a className="button button--primary" href={contentUrl(asset.id)}>下载内容</a>
    </div>
  );
}

// AdminActions 渲染管理员可见的保存、重置与删除操作区。
function AdminActions({ asset, adminUnlocked, busy, dirty, isSnippet, onDelete, onReset, onSave }: { asset: Asset; adminUnlocked: boolean; busy: boolean; dirty: boolean; isSnippet: boolean; onDelete: (assetId: string) => Promise<void>; onReset: () => void; onSave: () => Promise<Asset | null> }): JSX.Element {
  return (
    <section className="detail__actions-panel" aria-label="管理员操作">
      <div className="detail__actions-copy">
        <span className="field-label">管理员操作</span>
        <p className="muted">{adminUnlocked ? (isSnippet ? '保存会同步更新便签正文与标题。' : '保存会更新当前共享项的展示标题。') : '当前仅支持下载和浏览内容。'}</p>
      </div>
      <div className="detail__actions">
        <a className="button" href={contentUrl(asset.id)}>下载内容</a>
        {adminUnlocked ? <button className="button" disabled={busy || !dirty} onClick={onReset}>取消修改</button> : null}
        {adminUnlocked ? <button className="button button--primary" disabled={busy || !dirty} onClick={() => void onSave()}>保存更改</button> : null}
        {adminUnlocked ? <button className="button button--danger" disabled={busy} onClick={() => void onDelete(asset.id)}>删除</button> : null}
      </div>
    </section>
  );
}

// PropertyGrid 渲染当前共享项的轻量属性信息。
function PropertyGrid({ asset }: { asset: Asset }): JSX.Element {
  return (
    <dl className="detail__meta" role="group" aria-label="格式属性">
      <Property label="类型" value={assetKindLabel(asset)} />
      <Property label="文件类型" value={asset.mimeType} />
      <Property label="存储方式" value={asset.storageDriver} />
      <Property label="来源地址" value={asset.uploaderIp} />
      <Property label="哈希摘要" value={asset.sha256.slice(0, 12)} />
      <Property label="文件大小" value={formatBytes(asset.sizeBytes)} />
    </dl>
  );
}

// Property 渲染属性面板中的单个键值项。
function Property({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="detail__property">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
