// 资产网格文件用于展示图片、文字和文件混合流，解决不同资产类型在统一列表中的差异化呈现问题。
import type { Asset } from '../../api/types';
import { contentUrl, previewUrl } from '../../api/client';
import { assetGlyph, assetMetaLine } from '../../shared/lib/format';

interface Props {
  items: Asset[];
  selectedId: string | null;
  onSelect: (assetId: string) => void;
}

// AssetGrid 根据资产类型渲染图片卡片、文字卡片和文件行项目。
export function AssetGrid({ items, selectedId, onSelect }: Props) {
  return (
    <div className="asset-grid" aria-label="资产列表">
      {items.map((asset) => (asset.kind === 'file' ? <FileRow key={asset.id} asset={asset} active={asset.id === selectedId} onSelect={onSelect} /> : <AssetCard key={asset.id} asset={asset} active={asset.id === selectedId} onSelect={onSelect} />))}
    </div>
  );
}

// AssetCard 渲染图片或文字资产的卡片视图。
function AssetCard({ asset, active, onSelect }: { asset: Asset; active: boolean; onSelect: (assetId: string) => void }) {
  return (
    <button className="asset-card" data-active={active} onClick={() => onSelect(asset.id)}>
      {asset.kind === 'image' ? <div className="asset-card__thumb"><img src={previewUrl(asset.id)} alt={asset.title} /></div> : <div className="asset-card__snippet">{asset.textContent ?? asset.title}</div>}
      <div className="asset-card__header">
        <h3 className="asset-title">{asset.title}</h3>
        <span className="asset-subtitle">{assetMetaLine(asset)}</span>
      </div>
    </button>
  );
}

// FileRow 渲染通用文件的列表行视图。
function FileRow({ asset, active, onSelect }: { asset: Asset; active: boolean; onSelect: (assetId: string) => void }) {
  return (
    <button className="asset-row" data-active={active} onClick={() => onSelect(asset.id)}>
      <div>
        <div className="asset-title">{assetGlyph(asset)} {asset.title}</div>
        <div className="asset-subtitle">{assetMetaLine(asset)}</div>
      </div>
      <a href={contentUrl(asset.id)} onClick={(event) => event.stopPropagation()}>
        下载
      </a>
    </button>
  );
}
