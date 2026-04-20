// 主页面测试文件用于验证备忘录式工作区、管理员编辑和列表详情同步，避免首页关键交互回归。
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

// TestAppThemeToggle 验证主题切换仍然可用。
async function TestAppThemeToggle() {
  const user = userEvent.setup();
  stubFetch(baseAssets);
  renderApp();
  await screen.findByRole('region', { name: '共享列表' });
  expect(document.documentElement.dataset.theme).toBe('light');
  await user.click(screen.getByRole('button', { name: '切换主题' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
}

test('主题切换可用', TestAppThemeToggle);

// TestWorkspaceLayout 验证共享列表、过滤和内容画布语义都存在。
async function TestWorkspaceLayout() {
  const user = userEvent.setup();
  stubFetch(baseAssets);
  renderApp();
  const list = await screen.findByRole('region', { name: '共享列表' });
  expect(screen.getByRole('region', { name: '内容画布' })).toBeInTheDocument();
  expect(within(list).getByText('会议纪要')).toBeInTheDocument();
  await user.click(screen.getByRole('tab', { name: '图片', selected: false }));
  await waitFor(() => expect(within(list).queryByText('会议纪要')).not.toBeInTheDocument());
  expect(within(list).getByText('客厅照片')).toBeInTheDocument();
}

test('备忘录式工作区支持过滤与内容画布', TestWorkspaceLayout);

// TestSnippetEditFlow 验证管理员可编辑便签标题和正文并同步更新列表与详情。
async function TestSnippetEditFlow() {
  const user = userEvent.setup();
  const fetchMock = stubFetch(baseAssets);
  renderApp();
  await screen.findByRole('region', { name: '共享列表' });
  await unlockAdmin(user);
  const editRegion = screen.getByRole('region', { name: '内容画布' });
  const titleInput = screen.getByPlaceholderText('输入共享标题');
  const contentInput = screen.getByPlaceholderText('输入便签正文');
  await user.clear(titleInput);
  await user.type(titleInput, '修订后的会议纪要');
  await user.clear(contentInput);
  await user.type(contentInput, '新的同步说明');
  await user.click(screen.getByRole('button', { name: '保存更改' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/assets/snippet-1', expect.objectContaining({ method: 'PATCH', credentials: 'include' })));
  expect(within(screen.getByRole('region', { name: '共享列表' })).getByText('修订后的会议纪要')).toBeInTheDocument();
  expect(within(editRegion).getByDisplayValue('新的同步说明')).toBeInTheDocument();
}

test('管理员可编辑便签并同步更新列表与详情', TestSnippetEditFlow);

// TestImageRenameFlow 验证图片标题编辑后会同步影响列表与详情区。
async function TestImageRenameFlow() {
  const user = userEvent.setup();
  stubFetch(baseAssets);
  renderApp();
  await unlockAdmin(user);
  await user.click(screen.getByRole('button', { name: /客厅照片/ }));
  const titleInput = await screen.findByPlaceholderText('输入共享标题');
  await user.clear(titleInput);
  await user.type(titleInput, '客厅封面');
  await user.click(screen.getByRole('button', { name: '保存更改' }));
  await waitFor(() => expect(screen.getAllByDisplayValue('客厅封面').length).toBeGreaterThan(0));
  expect(screen.getByRole('button', { name: /客厅封面/ })).toBeInTheDocument();
}

test('管理员重命名图片后列表与详情会同步更新', TestImageRenameFlow);

// renderApp 挂载完整应用。
function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

// unlockAdmin 通过输入口令进入管理态。
async function unlockAdmin(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('输入管理口令'), 'lan-share-admin');
  await user.click(screen.getByRole('button', { name: '解锁管理能力' }));
}

// stubFetch 按当前请求路径返回测试所需的资产数据并支持编辑更新。
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
    if (init?.method === 'PATCH') {
      return jsonResponse(updateExistingAsset(items, url.split('/').pop() ?? '', init.body));
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

// updateExistingAsset 根据 PATCH 请求体更新测试资产并返回最新内容。
function updateExistingAsset(items: Asset[], id: string, body: BodyInit | null | undefined): Asset {
  const payload = JSON.parse(String(body ?? '{}')) as { title?: string; content?: string };
  const index = items.findIndex((item) => item.id === id);
  const current = items[index];
  const next = current.kind === 'snippet' ? applySnippetUpdate(current, payload) : { ...current, title: payload.title ?? current.title };
  items.splice(index, 1, next);
  return next;
}

// applySnippetUpdate 把便签编辑请求映射为新的测试资产对象。
function applySnippetUpdate(asset: Asset, payload: { title?: string; content?: string }): Asset {
  const content = payload.content ?? asset.textContent ?? '';
  return { ...asset, title: payload.title ?? asset.title, textContent: content, sizeBytes: content.length, charCount: content.length };
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
