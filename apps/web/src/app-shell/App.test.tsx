// 主页面测试文件用于验证主题切换、筛选、预览与管理态交互，避免 Apple 风格首页核心体验回归。
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { ThemeProvider } from '../theme/ThemeProvider';
import type { Asset } from '../api/types';

const baseAssets: Asset[] = [
  {
    id: 'snippet-1',
    kind: 'snippet',
    title: '会议纪要',
    textContent: '把今天讨论的三件事同步到手机。',
    originalName: 'snippet.txt',
    mimeType: 'text/plain',
    sizeBytes: 24,
    sha256: 'hash-snippet',
    previewKind: 'text',
    charCount: 14,
    storageDriver: 'local',
    uploaderIp: '192.168.1.10',
    createdAt: '2026-04-17T10:00:00.000Z',
  },
  {
    id: 'image-1',
    kind: 'image',
    title: '客厅照片',
    originalName: 'living-room.png',
    mimeType: 'image/png',
    sizeBytes: 2048,
    sha256: 'hash-image',
    previewKind: 'image',
    width: 1440,
    height: 900,
    storageDriver: 'minio',
    uploaderIp: '192.168.1.11',
    createdAt: '2026-04-17T11:00:00.000Z',
  },
  {
    id: 'file-1',
    kind: 'file',
    title: '设计说明.pdf',
    originalName: 'design.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 4096,
    sha256: 'hash-file',
    previewKind: 'pdf',
    storageDriver: 'local',
    uploaderIp: '192.168.1.12',
    createdAt: '2026-04-17T12:00:00.000Z',
  },
];

// TestAppThemeToggle 验证主题切换会更新根节点主题标识。
async function TestAppThemeToggle() {
  const user = userEvent.setup();
  stubFetch(baseAssets);
  renderApp();
  await screen.findAllByText('会议纪要');
  expect(document.documentElement.dataset.theme).toBe('light');
  await user.click(screen.getByRole('button', { name: '切换主题' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
}

test('主题切换可用', TestAppThemeToggle);

// TestAppFiltering 验证筛选控件会切换列表内容。
async function TestAppFiltering() {
  const user = userEvent.setup();
  stubFetch(baseAssets);
  renderApp();
  await screen.findByRole('link', { name: '下载' });
  await user.click(screen.getByRole('tab', { name: '图片' }));
  await waitFor(() => expect(screen.queryByText('会议纪要')).not.toBeInTheDocument());
  expect(screen.getAllByText('客厅照片').length).toBeGreaterThan(0);
}

test('分段控件支持过滤图片', TestAppFiltering);

// TestAppPreviewAndDelete 验证管理态解锁后可以删除选中的资产。
async function TestAppPreviewAndDelete() {
  const user = userEvent.setup();
  const fetchMock = stubFetch(baseAssets);
  renderApp();
  await screen.findByText('客厅照片');
  await user.click(screen.getByText('客厅照片'));
  expect(screen.getAllByAltText('客厅照片').length).toBeGreaterThan(0);
  expect(screen.queryByRole('button', { name: '删除' })).not.toBeInTheDocument();
  await user.type(screen.getByPlaceholderText('输入管理口令'), 'lan-share-admin');
  await user.click(screen.getByRole('button', { name: '解锁删除能力' }));
  await waitFor(() => expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: '删除' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/assets/image-1', expect.objectContaining({ method: 'DELETE', credentials: 'include' })));
}

test('图片预览和管理态删除可用', TestAppPreviewAndDelete);

// TestAppMixedRendering 验证文字卡片和文件行项目都按各自样式渲染。
async function TestAppMixedRendering() {
  stubFetch(baseAssets);
  renderApp();
  const matches = await screen.findAllByText('把今天讨论的三件事同步到手机。');
  expect(matches.length).toBeGreaterThan(0);
  expect(screen.getByRole('link', { name: '下载' })).toBeInTheDocument();
}

test('文字卡片和文件行项目都能渲染', TestAppMixedRendering);

// renderApp 挂载完整应用并附带主题提供器。
function renderApp() {
  window.localStorage.clear();
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

// stubFetch 按当前请求路径返回测试所需的资产数据。
function stubFetch(seedAssets: Asset[]) {
  const items = [...seedAssets];
  const mock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.startsWith('/api/v1/assets') && (!init?.method || init.method === 'GET')) {
      return jsonResponse({ items: filterAssets(items, url) });
    }
    if (url === '/api/v1/admin/unlock') {
      return jsonResponse({ ok: true });
    }
    if (init?.method === 'DELETE') {
      removeAsset(items, url.split('/').pop() ?? '');
      return jsonResponse({ ok: true });
    }
    return jsonResponse({});
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

// filterAssets 根据请求中的 kind 参数过滤测试资产。
function filterAssets(items: Asset[], url: string): Asset[] {
  const requestUrl = new URL(url, 'http://localhost');
  const kind = requestUrl.searchParams.get('kind');
  return kind ? items.filter((item) => item.kind === kind) : items;
}

// removeAsset 从测试资产数组中删除指定资产。
function removeAsset(items: Asset[], id: string) {
  const index = items.findIndex((item) => item.id === id);
  if (index >= 0) {
    items.splice(index, 1);
  }
}

// jsonResponse 构造测试中使用的 JSON 响应对象。
function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
