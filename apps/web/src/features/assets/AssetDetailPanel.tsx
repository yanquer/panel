// 资产详情面板文件用于展示预览、属性与管理操作，解决单个共享项的浏览和删除需求。
import type { Asset } from '../../api/types';
import { contentUrl, previewUrl } from '../../api/client';
import { assetMetaLine, formatBytes } from '../../shared/lib/format';

interface Props {
  asset: Asset | null;
  busy: boolean;
  adminUnlocked: boolean;
  onDelete: (assetId: string) => Promise<void>;
}

// AssetDetailPanel 渲染当前资产的预览与属性面板。
export function AssetDetailPanel({ asset, busy, adminUnlocked, onDelete }: Props): JSX.Element {
  if (!asset) {
    return (
      <aside className="detail detail--glass" aria-label="资产详情">
        <div className="detail__header">
          <div className="detail__heading">
            <span className="meta-label">Quick Look</span>
            <h2 className="asset-title">选中一个共享项</h2>
            <p className="muted">图片会显示预览，文字会显示正文，文件会显示下载入口与属性。</p>
          </div>
        </div>
        <div className="detail__content" role="region" aria-label="详情内容"><div className="empty"><span className="empty__glyph">⌘</span><p className="muted">从左侧共享流里选一项，这里会放大展示内容。</p></div></div>
      </aside>
    );
  }

  return (
    <aside className="detail detail--glass" aria-label="资产详情">
      <div className="detail__header">
        <div className="detail__heading">
          <span className="meta-label">Quick Look</span>
          <h2 className="detail__title">{asset.title}</h2>
          <p className="detail__description">{assetMetaLine(asset)}</p>
        </div>
        <div className="detail__actions">
          <a className="button button--primary" href={contentUrl(asset.id)}>下载内容</a>
          {adminUnlocked ? <button className="button button--danger" disabled={busy} onClick={() => void onDelete(asset.id)}>删除</button> : null}
        </div>
      </div>
      <div className="detail__content" role="region" aria-label="详情内容"><Preview asset={asset} /></div>
      <dl className="detail__meta" role="group" aria-label="格式属性">
        <Property label="文件类型" value={asset.mimeType} />
        <Property label="存储方式" value={asset.storageDriver} />
        <Property label="来源地址" value={asset.uploaderIp} />
        <Property label="哈希摘要" value={asset.sha256.slice(0, 12)} />
        <Property label="文件大小" value={formatBytes(asset.sizeBytes)} />
      </dl>
    </aside>
  );
}

// Preview 根据预览类型渲染详情面板中的内容区域。
function Preview({ asset }: { asset: Asset }): JSX.Element {
  if (asset.previewKind === 'image') {
    return <div className="preview__image"><img src={previewUrl(asset.id)} alt={asset.title} /></div>;
  }
  if (asset.previewKind === 'pdf') {
    return <div className="preview__image"><iframe title={asset.title} src={previewUrl(asset.id)} /></div>;
  }
  if (asset.previewKind === 'text') {
    return <div className="preview__text">{asset.textContent ?? asset.title}</div>;
  }
  return <div className="preview__fallback"><span className="empty__glyph">↓</span><p className="muted">此文件暂不支持内嵌预览，请直接下载查看。</p></div>;
}

// Property 渲染资产详情中的单个属性项。
function Property({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="detail__property">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
