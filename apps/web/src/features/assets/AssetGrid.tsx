// 资产网格文件用于展示图片、文字和文件混合流，解决不同资产类型在统一列表中的差异化呈现问题。
import type { Asset } from '../../api/types';
import { contentUrl, previewUrl } from '../../api/client';
import { assetGlyph, assetKindLabel, assetMetaLine, assetSummary, formatBytes, formatDate } from '../../shared/lib/format';
import type { ListStyle, ViewMode } from './useAssetWorkspace';

interface Props {
  items: Asset[];
  selectedId: string | null;
  onSelect: (assetId: string) => void;
  viewMode: ViewMode;
  listStyle: ListStyle;
}

// AssetGrid 根据主视图模式和列表风格渲染资产集合。
export function AssetGrid({ items, selectedId, onSelect, viewMode, listStyle }: Props): JSX.Element {
  if (viewMode === 'card') {
    return <div className="asset-grid asset-grid--cards" role="region" aria-label="卡片视图">{items.map((asset) => <AssetCard key={asset.id} asset={asset} active={asset.id === selectedId} onSelect={onSelect} />)}</div>;
  }
  if (listStyle === 'gallery') {
    return <div className="asset-list asset-list--gallery" role="region" aria-label="大缩略列表">{items.map((asset) => <GalleryRow key={asset.id} asset={asset} active={asset.id === selectedId} onSelect={onSelect} />)}</div>;
  }
  if (listStyle === 'table') {
    return <div className="asset-table" role="region" aria-label="表格式列表"><TableHeader />{items.map((asset) => <TableRow key={asset.id} asset={asset} active={asset.id === selectedId} onSelect={onSelect} />)}</div>;
  }
  return <div className="asset-list asset-list--finder" role="region" aria-label="Finder 列表">{items.map((asset) => <FinderRow key={asset.id} asset={asset} active={asset.id === selectedId} onSelect={onSelect} />)}</div>;
}

// AssetCard 渲染卡片视图下的单个资产项。
function AssetCard({ asset, active, onSelect }: { asset: Asset; active: boolean; onSelect: (assetId: string) => void }): JSX.Element {
  return (
    <button className="asset-card" data-active={active} onClick={() => onSelect(asset.id)}>
      <CardPreview asset={asset} />
      <div className="asset-card__header">
        <h3 className="asset-title">{asset.title}</h3>
        <span className="asset-subtitle">{assetMetaLine(asset)}</span>
      </div>
    </button>
  );
}

// FinderRow 渲染 Finder 风格的一行一项列表。
function FinderRow({ asset, active, onSelect }: { asset: Asset; active: boolean; onSelect: (assetId: string) => void }): JSX.Element {
  return (
    <button className="asset-list__row asset-list__row--finder" data-active={active} onClick={() => onSelect(asset.id)}>
      <div className="asset-list__lead">
        <ListThumb asset={asset} size="compact" />
        <div className="asset-list__body">
          <h3 className="asset-title">{asset.title}</h3>
          <p className="asset-subtitle">{assetSummary(asset)}</p>
        </div>
      </div>
      <div className="asset-list__meta">
        <span>{assetKindLabel(asset)}</span>
        <span>{formatDate(asset.createdAt)}</span>
        <span>{formatBytes(asset.sizeBytes)}</span>
        <a href={contentUrl(asset.id)} onClick={(event) => event.stopPropagation()}>下载</a>
      </div>
    </button>
  );
}

// GalleryRow 渲染保留大缩略图的列表风格。
function GalleryRow({ asset, active, onSelect }: { asset: Asset; active: boolean; onSelect: (assetId: string) => void }): JSX.Element {
  return (
    <button className="asset-list__row asset-list__row--gallery" data-active={active} onClick={() => onSelect(asset.id)}>
      <ListThumb asset={asset} size="large" />
      <div className="asset-list__body asset-list__body--gallery">
        <div>
          <h3 className="asset-title">{asset.title}</h3>
          <p className="asset-subtitle">{assetSummary(asset)}</p>
        </div>
        <span className="asset-subtitle">{assetMetaLine(asset)}</span>
      </div>
      <a className="asset-list__link" href={contentUrl(asset.id)} onClick={(event) => event.stopPropagation()}>下载</a>
    </button>
  );
}

// TableHeader 渲染表格式列表的列标题。
function TableHeader(): JSX.Element {
  return <div className="asset-table__header"><span>名称</span><span>类型</span><span>时间</span><span>大小</span><span>操作</span></div>;
}

// TableRow 渲染表格式列表中的单行资产记录。
function TableRow({ asset, active, onSelect }: { asset: Asset; active: boolean; onSelect: (assetId: string) => void }): JSX.Element {
  return (
    <button className="asset-table__row" data-active={active} onClick={() => onSelect(asset.id)}>
      <span className="asset-table__name"><ListThumb asset={asset} size="tiny" /><span>{asset.title}</span></span>
      <span>{assetKindLabel(asset)}</span>
      <span>{formatDate(asset.createdAt)}</span>
      <span>{formatBytes(asset.sizeBytes)}</span>
      <a href={contentUrl(asset.id)} onClick={(event) => event.stopPropagation()}>下载</a>
    </button>
  );
}

// CardPreview 渲染卡片视图中的首屏预览区域。
function CardPreview({ asset }: { asset: Asset }): JSX.Element {
  if (asset.kind === 'image') {
    return <div className="asset-card__thumb"><img src={previewUrl(asset.id)} alt={asset.title} /></div>;
  }
  if (asset.kind === 'snippet') {
    return <div className="asset-card__snippet">{asset.textContent ?? asset.title}</div>;
  }
  return <div className="asset-card__file"><span className="asset-card__glyph">{assetGlyph(asset)}</span><span className="meta-label">{assetKindLabel(asset)}</span></div>;
}

// ListThumb 渲染列表视图中的缩略图或文件图标区域。
function ListThumb({ asset, size }: { asset: Asset; size: 'tiny' | 'compact' | 'large' }): JSX.Element {
  if (asset.kind === 'image') {
    return <div className={`asset-list__thumb asset-list__thumb--${size}`}><img src={previewUrl(asset.id)} alt={asset.title} /></div>;
  }
  return <div className={`asset-list__thumb asset-list__thumb--${size} asset-list__thumb--icon`}><span>{assetGlyph(asset)}</span></div>;
}
