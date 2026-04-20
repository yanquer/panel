// 格式化工具文件用于统一字节、时间和属性展示文本，解决前端重复渲染逻辑问题。
import type { Asset } from '../../api/types';

// formatBytes 把字节数转换为更易读的文件大小文本。
export function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

// formatDate 把 ISO 时间转换为本地简洁显示格式。
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

// assetMetaLine 汇总资产的核心属性，供列表与详情复用。
export function assetMetaLine(asset: Asset): string {
  const parts = [formatBytes(asset.sizeBytes), formatDate(asset.createdAt)];
  if (asset.kind === 'image' && asset.width && asset.height) {
    parts.unshift(`${asset.width} × ${asset.height}`);
  }
  if (asset.kind === 'snippet' && asset.charCount) {
    parts.unshift(`${asset.charCount} 字`);
  }
  return parts.join(' · ');
}

// assetGlyph 返回资产类型对应的简洁图形字符。
export function assetGlyph(asset: Asset): string {
  if (asset.kind === 'image') {
    return '◩';
  }
  if (asset.kind === 'snippet') {
    return '✎';
  }
  return '▣';
}

// assetKindLabel 返回更适合列表与属性面板展示的类型名称。
export function assetKindLabel(asset: Asset): string {
  if (asset.kind === 'image') {
    return '图片';
  }
  if (asset.kind === 'snippet') {
    return '便签';
  }
  return '文件';
}

// assetSummary 返回资产在列表中使用的次级摘要文本。
export function assetSummary(asset: Asset): string {
  if (asset.kind === 'snippet') {
    return compactText(asset.textContent ?? '文字便签');
  }
  return asset.originalName;
}

// compactText 把多行文字压缩为更适合列表摘要的一行内容。
function compactText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
