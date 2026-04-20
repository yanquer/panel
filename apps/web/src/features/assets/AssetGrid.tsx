// 资产列表文件用于渲染备忘录式共享流，解决原先多视图切换造成的信息噪声和层级混乱问题。
import type { Asset } from '../../api/types';
import { contentUrl, previewUrl } from '../../api/client';
import { assetGlyph, assetKindLabel, assetSummary, formatDate } from '../../shared/lib/format';

interface Props {
  items: Asset[];
  selectedId: string | null;
  onSelect: (assetId: string) => void;
}

// AssetGrid 按备忘录列表样式渲染当前共享项集合。
export function AssetGrid({ items, selectedId, onSelect }: Props): JSX.Element {
  return (
    <div className="note-list" role="region" aria-label="共享列表">
      {items.map((asset) => <AssetRow key={asset.id} asset={asset} active={asset.id === selectedId} onSelect={onSelect} />)}
    </div>
  );
}

// AssetRow 渲染单条共享记录的标题、摘要、时间与类型信息。
function AssetRow({ asset, active, onSelect }: { asset: Asset; active: boolean; onSelect: (assetId: string) => void }): JSX.Element {
  return (
    <button className="note-list__row" data-active={active} onClick={() => onSelect(asset.id)}>
      <AssetRowVisual asset={asset} />
      <div className="note-list__body">
        <div className="note-list__header">
          <h3 className="note-list__title">{asset.title}</h3>
          <span className="note-list__time">{formatDate(asset.createdAt)}</span>
        </div>
        <p className="note-list__summary">{assetSummary(asset)}</p>
        <div className="note-list__meta">
          <span className="note-list__kind">{assetKindLabel(asset)}</span>
          <a href={contentUrl(asset.id)} onClick={(event) => event.stopPropagation()}>下载</a>
        </div>
      </div>
    </button>
  );
}

// AssetRowVisual 渲染列表行左侧的缩略图或类型图标。
function AssetRowVisual({ asset }: { asset: Asset }): JSX.Element {
  if (asset.kind === 'image') {
    return <div className="note-list__visual note-list__visual--image"><img src={previewUrl(asset.id)} alt={asset.title} /></div>;
  }
  return <div className="note-list__visual note-list__visual--icon"><span>{assetGlyph(asset)}</span></div>;
}
