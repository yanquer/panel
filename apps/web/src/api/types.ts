// API 类型文件用于约束前端与后端之间的数据结构，解决资产列表、详情与操作返回值的一致性问题。
export type AssetKind = 'snippet' | 'image' | 'file';
export type PreviewKind = 'text' | 'image' | 'pdf' | 'unsupported';
export type ThemeMode = 'light' | 'dark';

export interface Asset {
  id: string;
  kind: AssetKind;
  title: string;
  textContent?: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  previewKind: PreviewKind;
  width?: number;
  height?: number;
  charCount?: number;
  storageDriver: 'local' | 'minio';
  uploaderIp: string;
  createdAt: string;
}

export interface AssetListResponse {
  items: Asset[];
}
