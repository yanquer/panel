// API 客户端文件用于封装共享服务请求，解决组件层重复拼接地址和处理凭证的问题。
import type { Asset, AssetKind, AssetListResponse, UpdateAssetInput } from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1';

// fetchAssets 获取资产列表并按类型执行可选过滤。
export async function fetchAssets(kind: AssetKind | 'all'): Promise<Asset[]> {
  const suffix = kind === 'all' ? '' : `?kind=${kind}`;
  const payload = await request<AssetListResponse>(`/assets${suffix}`);
  return payload.items;
}

// createSnippet 创建新的文字便签。
export function createSnippet(input: { title: string; content: string }): Promise<Asset> {
  return request<Asset>('/assets/snippets', { method: 'POST', body: JSON.stringify(input) });
}

// uploadFile 上传图片或通用文件。
export function uploadFile(file: File): Promise<Asset> {
  const form = new FormData();
  form.set('file', file);
  return request<Asset>('/assets/files', { method: 'POST', body: form });
}

// unlockAdmin 进入管理态以允许删除操作。
export function unlockAdmin(password: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/admin/unlock', { method: 'POST', body: JSON.stringify({ password }) });
}

// deleteAsset 删除指定资产。
export function deleteAsset(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/assets/${id}`, { method: 'DELETE' });
}

// updateAsset 更新指定资产的标题和便签正文。
export function updateAsset(id: string, input: UpdateAssetInput): Promise<Asset> {
  return request<Asset>(`/assets/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

// previewUrl 生成资产预览地址供图片和 PDF 内嵌展示。
export function previewUrl(id: string): string {
  return absoluteUrl(`/assets/${id}/preview`);
}

// contentUrl 生成资产下载地址供浏览器直接拉取内容。
export function contentUrl(id: string): string {
  return absoluteUrl(`/assets/${id}/content`);
}

// request 统一处理 JSON 请求、错误映射与凭证携带。
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(absoluteUrl(path), withDefaults(init));
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<T>;
}

// absoluteUrl 把接口路径拼接为可直接请求的完整地址。
function absoluteUrl(path: string): string {
  return `${API_BASE}${path}`;
}

// withDefaults 为请求补全 JSON 头和 Cookie 策略。
function withDefaults(init: RequestInit): RequestInit {
  return {
    credentials: 'include',
    ...init,
    headers: mergeHeaders(init.body, init.headers),
  };
}

// mergeHeaders 仅在 JSON 请求时注入默认内容类型头。
function mergeHeaders(body: BodyInit | null | undefined, headers: HeadersInit | undefined): HeadersInit {
  if (body instanceof FormData) {
    return headers ?? {};
  }
  return { 'Content-Type': 'application/json', ...(headers ?? {}) };
}

// readError 读取服务端错误文案并回退到通用提示。
async function readError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  return payload?.message ?? '请求失败，请稍后重试';
}
