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
  await user.click(screen.getByRole('button', { name: '切换到深色主题' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(screen.getByRole('button', { name: '切换到浅色主题' })).toBeInTheDocument();
}

test('主题切换可用', TestAppThemeToggle);

// TestWorkspaceLayout 验证顶部操作、共享列表过滤和内容画布语义都存在。
async function TestWorkspaceLayout() {
  const user = userEvent.setup();
  stubFetch(baseAssets);
  renderApp();
  const list = await screen.findByRole('region', { name: '共享列表' });
  expect(screen.getByRole('toolbar', { name: '顶部操作' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '打开管理面板' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '打开快捷新建' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: '内容画布' })).toBeInTheDocument();
  expect(within(list).getByText('会议纪要')).toBeInTheDocument();
  await user.click(screen.getByRole('tab', { name: '图片', selected: false }));
  await waitFor(() => expect(within(list).queryByText('会议纪要')).not.toBeInTheDocument());
  expect(within(list).getByText('客厅照片')).toBeInTheDocument();
}

test('顶部操作区与工作区布局可用', TestWorkspaceLayout);

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

// TestQuickCreateSnippetFlow 验证快捷新建弹窗可以发布便签并自动关闭。
async function TestQuickCreateSnippetFlow() {
  const user = userEvent.setup();
  const fetchMock = stubFetch(baseAssets);
  renderApp();
  await screen.findByRole('region', { name: '共享列表' });
  await openQuickCreate(user);
  const dialog = screen.getByRole('dialog', { name: '快捷新建' });
  await user.type(within(dialog).getByPlaceholderText('标题，可留空'), '新的共享便签');
  await user.type(within(dialog).getByPlaceholderText('输入将要共享的文字'), '刚刚复制的一段内容');
  await user.click(within(dialog).getByRole('button', { name: '发布文字' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/assets/snippets', expect.objectContaining({ method: 'POST', credentials: 'include' })));
  expect(screen.queryByRole('dialog', { name: '快捷新建' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /新的共享便签/ })).toBeInTheDocument();
}

test('快捷新建弹窗可创建便签并自动关闭', TestQuickCreateSnippetFlow);

// TestQuickCreateUploadFlow 验证快捷新建弹窗中的上传入口仍可添加文件。
async function TestQuickCreateUploadFlow() {
  const user = userEvent.setup();
  const fetchMock = stubFetch(baseAssets);
  renderApp();
  await screen.findByRole('region', { name: '共享列表' });
  await openQuickCreate(user);
  const input = screen.getByTestId('quick-create-file-input');
  const file = new File(['hello'], 'meeting-note.txt', { type: 'text/plain' });
  await user.upload(input, file);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/assets/files', expect.objectContaining({ method: 'POST', credentials: 'include' })));
  expect(screen.queryByRole('dialog', { name: '快捷新建' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /meeting-note.txt/ })).toBeInTheDocument();
}

test('快捷新建弹窗可上传文件并进入共享流', TestQuickCreateUploadFlow);

// TestSnippetCopyFlow 验证文字资产在详情区和列表区都使用复制动作并显示成功提示。
async function TestSnippetCopyFlow() {
  const user = userEvent.setup();
  const clipboard = installClipboardMock();
  stubFetch(baseAssets);
  renderApp();
  await screen.findByRole('region', { name: '共享列表' });
  expect(screen.getByRole('button', { name: '复制内容' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '复制' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '复制内容' }));
  await waitFor(() => expect(clipboard.writeText).toHaveBeenCalledWith('把今天讨论的三件事同步到手机。'));
  expect(screen.getByRole('status')).toHaveTextContent('文字已复制到剪贴板。');
}

test('文字资产复制成功时会显示顶部提示', TestSnippetCopyFlow);

// TestSnippetCopyFailureFlow 验证复制失败时会显示错误提示。
async function TestSnippetCopyFailureFlow() {
  const user = userEvent.setup();
  installClipboardMock().writeText.mockRejectedValueOnce(new Error('copy failed'));
  installExecCommandMock(false);
  stubFetch(baseAssets);
  renderApp();
  await screen.findByRole('region', { name: '共享列表' });
  await user.click(screen.getByRole('button', { name: '复制' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('复制失败，请手动选中文本。'));
}

test('文字资产复制失败时会显示顶部错误提示', TestSnippetCopyFailureFlow);

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
function renderApp(): ReturnType<typeof render> {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

// installClipboardMock 安装可控的剪贴板写入桩函数。
function installClipboardMock() {
  const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
  return clipboard;
}

// installExecCommandMock 安装可控的 execCommand 回退桩函数。
function installExecCommandMock(result: boolean) {
  const execCommand = vi.fn(() => result);
  Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
  return execCommand;
}

// openQuickCreate 打开顶部快捷新建弹窗。
async function openQuickCreate(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole('button', { name: '打开快捷新建' }));
  await screen.findByRole('dialog', { name: '快捷新建' });
}

// unlockAdmin 通过输入口令进入管理态。
async function unlockAdmin(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole('button', { name: '打开管理面板' }));
  const dialog = await screen.findByRole('dialog', { name: '管理模式' });
  await user.type(within(dialog).getByPlaceholderText('输入管理口令'), 'lan-share-admin');
  await user.click(within(dialog).getByRole('button', { name: '解锁管理能力' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: '管理模式' })).not.toBeInTheDocument());
}

// stubFetch 按当前请求路径返回测试所需的资产数据并支持创建、编辑与删除。
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
    if (url === '/api/v1/assets/snippets' && init?.method === 'POST') {
      const asset = createSnippetAsset(init.body);
      items.unshift(asset);
      return jsonResponse(asset, 201);
    }
    if (url === '/api/v1/assets/files' && init?.method === 'POST') {
      const asset = createFileAsset(init.body);
      items.unshift(asset);
      return jsonResponse(asset, 201);
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

// createSnippetAsset 构造快捷新建便签后的测试资产对象。
function createSnippetAsset(body: BodyInit | null | undefined): Asset {
  const payload = JSON.parse(String(body ?? '{}')) as { title?: string; content?: string };
  const content = payload.content ?? '';
  return { id: `snippet-${Date.now()}`, kind: 'snippet', title: payload.title || '新便签', textContent: content, originalName: 'snippet.txt', mimeType: 'text/plain', sizeBytes: content.length, sha256: 'hash-created-snippet', previewKind: 'text', charCount: content.length, storageDriver: 'local', uploaderIp: '192.168.1.30', createdAt: '2026-04-20T08:00:00.000Z' };
}

// createFileAsset 构造快捷新建上传文件后的测试资产对象。
function createFileAsset(body: BodyInit | null | undefined): Asset {
  const file = body instanceof FormData ? body.get('file') : null;
  const name = file instanceof File ? file.name : '新文件.txt';
  return { id: `file-${Date.now()}`, kind: 'file', title: name, originalName: name, mimeType: file instanceof File ? file.type || 'application/octet-stream' : 'application/octet-stream', sizeBytes: file instanceof File ? file.size : 0, sha256: 'hash-created-file', previewKind: 'unsupported', storageDriver: 'local', uploaderIp: '192.168.1.31', createdAt: '2026-04-20T08:10:00.000Z' };
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
function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
}
