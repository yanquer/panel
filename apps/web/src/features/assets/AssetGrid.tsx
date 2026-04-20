// 资产列表文件用于渲染备忘录式共享流，解决原先多视图切换造成的信息噪声和层级混乱问题。
import type { Asset } from '../../api/types';
import { contentUrl, previewUrl } from '../../api/client';
import { assetGlyph, assetKindLabel, assetSummary, formatDate } from '../../shared/lib/format';

interface Props {
  items: Asset[];
  selectedId: string | null;
  onCopy: (asset: Asset) => Promise<void>;
  onSelect: (assetId: string) => void;
}

// AssetGrid 按备忘录列表样式渲染当前共享项集合。
export function AssetGrid({ items, selectedId, onCopy, onSelect }: Props): JSX.Element {
  return (
    <div className="note-list" role="region" aria-label="共享列表">
      {items.map((asset) => <AssetRow key={asset.id} asset={asset} active={asset.id === selectedId} onCopy={onCopy} onSelect={onSelect} />)}
    </div>
  );
}

// AssetRow 渲染单条共享记录的标题、摘要、时间与类型信息。
function AssetRow({ asset, active, onCopy, onSelect }: { asset: Asset; active: boolean; onCopy: (asset: Asset) => Promise<void>; onSelect: (assetId: string) => void }): JSX.Element {
  return (
    <div className="note-list__row" data-active={active} role="button" tabIndex={0} onClick={() => onSelect(asset.id)} onKeyDown={(event) => handleRowKeydown(event, asset.id, onSelect)}>
      <AssetRowVisual asset={asset} />
      <div className="note-list__body">
        <div className="note-list__header">
          <h3 className="note-list__title">{asset.title}</h3>
          <span className="note-list__time">{formatDate(asset.createdAt)}</span>
        </div>
        <p className="note-list__summary">{assetSummary(asset)}</p>
        <div className="note-list__meta">
          <span className="note-list__kind">{assetKindLabel(asset)}</span>
          <AssetRowAction asset={asset} onCopy={onCopy} />
        </div>
      </div>
    </div>
  );
}

// handleRowKeydown 让列表行支持键盘 Enter 和空格选中。
function handleRowKeydown(event: React.KeyboardEvent<HTMLDivElement>, assetId: string, onSelect: (assetId: string) => void): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onSelect(assetId);
  }
}

// AssetRowAction 根据资产类型渲染复制或下载入口。
function AssetRowAction({ asset, onCopy }: { asset: Asset; onCopy: (asset: Asset) => Promise<void> }): JSX.Element {
  return asset.kind === 'snippet' ? (
    <button className="note-list__action" type="button" onClick={(event) => { event.stopPropagation(); void onCopy(asset); }}>
      复制
    </button>
  ) : (
    <a className="note-list__action" href={contentUrl(asset.id)} onClick={(event) => event.stopPropagation()}>
      下载
    </a>
  );
}

// AssetRowVisual 渲染列表行左侧的缩略图或类型图标。
function AssetRowVisual({ asset }: { asset: Asset }): JSX.Element {
  if (asset.kind === 'image') {
    return <div className="note-list__visual note-list__visual--image"><img src={previewUrl(asset.id)} alt={asset.title} /></div>;
  }
  return <div className="note-list__visual note-list__visual--icon"><span>{assetGlyph(asset)}</span></div>;
}
