// 主页面测试文件用于验证视图切换、详情布局与管理态交互，避免共享首页核心体验回归。
import { render, screen, waitFor, within } from '@testing-library/react';
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
  await screen.findByRole('region', { name: '卡片视图' });
  expect(document.documentElement.dataset.theme).toBe('light');
  await user.click(screen.getByRole('button', { name: '切换主题' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
}

test('主题切换可用', TestAppThemeToggle);

// TestViewModes 验证默认卡片视图和列表视图二级切换都可用。
async function TestViewModes() {
  const user = userEvent.setup();
  stubFetch(baseAssets);
  renderApp();
  expect(await screen.findByRole('region', { name: '卡片视图' })).toBeInTheDocument();
  expect(screen.queryByRole('tablist', { name: '列表风格' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('tab', { name: '列表', selected: false }));
  expect(await screen.findByRole('region', { name: 'Finder 列表' })).toBeInTheDocument();
  await user.click(screen.getByRole('tab', { name: '大缩略' }));
  expect(await screen.findByRole('region', { name: '大缩略列表' })).toBeInTheDocument();
  await user.click(screen.getByRole('tab', { name: '表格' }));
  expect(await screen.findByRole('region', { name: '表格式列表' })).toBeInTheDocument();
}

test('卡片和三种列表风格都能切换', TestViewModes);

// TestDetailLayoutAndDelete 验证详情面板结构层级和删除链路保持可用。
async function TestDetailLayoutAndDelete() {
  const user = userEvent.setup();
  const fetchMock = stubFetch(baseAssets);
  renderApp();
  await user.click(await screen.findByRole('tab', { name: '列表', selected: false }));
  await user.click(await screen.findByRole('button', { name: /客厅照片/ }));
  expect(screen.getByRole('region', { name: '详情内容' })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: '格式属性' })).toBeInTheDocument();
  expect(screen.getAllByAltText('客厅照片').length).toBeGreaterThan(0);
  await user.type(screen.getByPlaceholderText('输入管理口令'), 'lan-share-admin');
  await user.click(screen.getByRole('button', { name: '解锁删除能力' }));
  await user.click(await screen.findByRole('button', { name: '删除' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/assets/image-1', expect.objectContaining({ method: 'DELETE', credentials: 'include' })));
}

test('详情面板强调内容区并保留删除链路', TestDetailLayoutAndDelete);

// TestPreferenceRestore 验证视图偏好会从本地存储中恢复。
async function TestPreferenceRestore() {
  stubFetch(baseAssets);
  renderApp({ 'lan-share-view-mode': 'list', 'lan-share-list-style': 'table' });
  expect(await screen.findByRole('region', { name: '表格式列表' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: '列表', selected: true })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: '表格', selected: true })).toBeInTheDocument();
  const table = screen.getByRole('region', { name: '表格式列表' });
  expect(within(table).getByText('名称')).toBeInTheDocument();
}

test('视图偏好可从 localStorage 恢复', TestPreferenceRestore);

// renderApp 挂载完整应用并在渲染前写入可选的界面偏好。
function renderApp(preferences: Record<string, string> = {}) {
  installStorage(preferences);
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

// installStorage 为测试运行时注入可控的 localStorage 实现。
function installStorage(preferences: Record<string, string>) {
  const store = new Map(Object.entries(preferences));
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
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
