// 端到端测试文件用于验证备忘录式工作区在桌面与移动端的浏览和管理员编辑能力，避免核心交互链路回归。
import { expect, test } from '@playwright/test';

const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4XmP4DwQACfsD/aDGNzUAAAAASUVORK5CYII=', 'base64');

type Asset = {
  id: string;
  kind: 'snippet' | 'image' | 'file';
  title: string;
  textContent?: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  previewKind: 'text' | 'image' | 'pdf' | 'unsupported';
  width?: number;
  height?: number;
  charCount?: number;
  storageDriver: 'local' | 'minio';
  uploaderIp: string;
  createdAt: string;
};

// test.beforeEach 为每个用例注入独立的 API 路由桩状态。
test.beforeEach(async ({ page }) => {
  await installRoutes(page);
});

// 桌面端覆盖过滤图片列表后进入大图内容画布查看详情。
test('桌面端可过滤列表并查看图片内容画布', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/');
  await expect(page.getByRole('toolbar', { name: '顶部操作' })).toBeVisible();
  await page.getByRole('tab', { name: '图片', exact: true }).click();
  await expect(page.getByRole('region', { name: '共享列表', exact: true })).toContainText('窗边照片');
  await page.getByRole('button', { name: /窗边照片/ }).click();
  await expect(page.getByRole('region', { name: '内容画布' }).locator('img[alt="窗边照片"]')).toBeVisible();
});

// 桌面端覆盖便签复制按钮与顶部提示。
test('桌面端文字资产支持复制并显示顶部提示', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await installClipboardMock(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: '复制内容' })).toBeVisible();
  await expect(page.getByRole('button', { name: '复制', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '复制内容' }).click();
  await expect(page.getByRole('status')).toContainText('文字已复制到剪贴板。');
});

// 桌面端覆盖顶部三个操作入口和快捷新建弹窗开启行为。
test('桌面端顶部操作区可打开管理与快捷新建弹窗', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/');
  await expect(page.getByRole('button', { name: '打开管理面板' })).toBeVisible();
  await expect(page.getByRole('button', { name: '切换到深色主题' })).toBeVisible();
  await expect(page.getByRole('button', { name: '打开快捷新建' })).toBeVisible();
  await page.getByRole('button', { name: '打开快捷新建' }).click();
  await expect(page.getByRole('dialog', { name: '快捷新建' })).toBeVisible();
  await page.getByRole('button', { name: '关闭弹窗' }).click();
  await page.getByRole('button', { name: '打开管理面板' }).click();
  await expect(page.getByRole('dialog', { name: '管理模式' })).toBeVisible();
});

// 桌面端覆盖管理员编辑便签后的保存链路。
test('桌面端管理员可编辑便签并保存', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/');
  await unlockAdmin(page);
  await page.getByPlaceholder('输入共享标题').fill('修订后的便签');
  await page.getByPlaceholder('输入便签正文').fill('新的便签正文');
  await page.getByRole('button', { name: '保存更改' }).click();
  await expect(page.getByRole('button', { name: /修订后的便签/ })).toBeVisible();
  await expect(page.getByPlaceholder('输入便签正文')).toHaveValue('新的便签正文');
});

// 桌面端覆盖快捷新建弹窗中的便签发布链路。
test('桌面端快捷新建弹窗可创建便签', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/');
  await page.getByRole('button', { name: '打开快捷新建' }).click();
  const dialog = page.getByRole('dialog', { name: '快捷新建' });
  await dialog.getByPlaceholder('标题，可留空').fill('桌面端新便签');
  await dialog.getByPlaceholder('输入将要共享的文字').fill('从顶部入口直接写下一段内容');
  await dialog.getByRole('button', { name: '发布文字' }).click();
  await expect(page.getByRole('button', { name: /桌面端新便签/ })).toBeVisible();
  await expect(dialog).toBeHidden();
});

// 桌面端覆盖快捷新建弹窗中的文件上传链路。
test('桌面端快捷新建弹窗可上传文件', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/');
  await page.getByRole('button', { name: '打开快捷新建' }).click();
  await page.locator('[data-testid="quick-create-file-input"]').setInputFiles({
    name: 'meeting-note.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello'),
  });
  await expect(page.getByRole('button', { name: /meeting-note.txt/ })).toBeVisible();
  await expect(page.getByRole('dialog', { name: '快捷新建' })).toBeHidden();
});

// 桌面端覆盖管理员重命名图片标题。
test('桌面端管理员可重命名图片标题', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/');
  await unlockAdmin(page);
  await page.getByRole('button', { name: /窗边照片/ }).click();
  const titleInput = page.getByPlaceholder('输入共享标题');
  await titleInput.fill('封面图片');
  await page.getByRole('button', { name: '保存更改' }).click();
  await expect(page.getByRole('button', { name: /封面图片/ })).toBeVisible();
  await expect(titleInput).toHaveValue('封面图片');
});

// 移动端覆盖顶部工具栏、主题切换和快捷新建弹窗可见性。
test('移动端顶部工具栏仍可切换主题并打开快捷新建', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  await expect(page.getByRole('button', { name: '切换到深色主题' })).toBeVisible();
  await page.getByRole('button', { name: '切换到深色主题' }).click();
  await expect(page.getByRole('button', { name: '切换到浅色主题' })).toBeVisible();
  await page.getByRole('button', { name: '打开快捷新建' }).click();
  await expect(page.getByRole('dialog', { name: '快捷新建' })).toBeVisible();
  await expect(page.getByPlaceholder('输入将要共享的文字')).toBeVisible();
});

// 移动端覆盖便签复制后的顶部提示。
test('移动端文字资产复制后仍显示顶部提示', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await installClipboardMock(page);
  await page.goto('/');
  await page.getByRole('button', { name: '复制内容' }).click();
  await expect(page.getByRole('status')).toContainText('文字已复制到剪贴板。');
});

// 移动端覆盖内容优先布局下的管理员便签编辑链路。
test('移动端内容优先布局下仍可保存便签编辑', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  await unlockAdmin(page);
  await page.getByPlaceholder('输入共享标题').fill('手机便签');
  await page.getByPlaceholder('输入便签正文').fill('移动端也能保存');
  await page.getByRole('button', { name: '保存更改' }).click();
  await expect(page.getByRole('button', { name: /手机便签/ })).toBeVisible();
  await expect(page.getByPlaceholder('输入便签正文')).toHaveValue('移动端也能保存');
});

// unlockAdmin 输入管理员口令并解锁编辑能力。
async function unlockAdmin(page: Parameters<typeof test.beforeEach>[0]['page']) {
  await page.getByRole('button', { name: '打开管理面板' }).click();
  const dialog = page.getByRole('dialog', { name: '管理模式' });
  await dialog.getByPlaceholder('输入管理口令').fill('lan-share-admin');
  await dialog.getByRole('button', { name: '解锁管理能力' }).click();
  await expect(dialog).toBeHidden();
}

// installClipboardMock 为页面注入成功返回的剪贴板写入接口。
async function installClipboardMock(page: Parameters<typeof test.beforeEach>[0]['page']) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => undefined },
    });
  });
}

// installRoutes 为页面注入带状态的模拟 API 服务。
async function installRoutes(page: Parameters<typeof test.beforeEach>[0]['page']) {
  const assets: Asset[] = seedAssets();
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'GET' && url.pathname === '/api/v1/assets') {
      return route.fulfill(json({ items: filterAssets(assets, url.searchParams.get('kind')) }));
    }
    if (request.method() === 'POST' && url.pathname === '/api/v1/assets/snippets') {
      assets.unshift(createSnippetAsset(await request.postDataJSON()));
      return route.fulfill(json(assets[0], 201));
    }
    if (request.method() === 'POST' && url.pathname === '/api/v1/assets/files') {
      assets.unshift(createImageAsset(extractFileName(request.postData() ?? '')));
      return route.fulfill(json(assets[0], 201));
    }
    if (request.method() === 'POST' && url.pathname === '/api/v1/admin/unlock') {
      return route.fulfill(json({ ok: true }));
    }
    if (request.method() === 'PATCH' && url.pathname.startsWith('/api/v1/assets/')) {
      return route.fulfill(json(updateAsset(assets, url.pathname.split('/').pop() ?? '', await request.postDataJSON())));
    }
    if (request.method() === 'DELETE' && url.pathname.startsWith('/api/v1/assets/')) {
      removeAsset(assets, url.pathname.split('/').pop() ?? '');
      return route.fulfill(json({ ok: true }));
    }
    if (request.method() === 'GET' && url.pathname.endsWith('/preview')) {
      return route.fulfill(previewResponse(findAsset(assets, url)));
    }
    if (request.method() === 'GET' && url.pathname.endsWith('/content')) {
      return route.fulfill(previewResponse(findAsset(assets, url)));
    }
    return route.fulfill(json({}, 404));
  });
}

// seedAssets 提供页面初始展示所需的模拟资产集合。
function seedAssets(): Asset[] {
  return [
    { id: 'seed-snippet', kind: 'snippet', title: '欢迎便签', textContent: '拖一张图片，或写下一段文字。', originalName: 'snippet.txt', mimeType: 'text/plain', sizeBytes: 32, sha256: 'hash-snippet', previewKind: 'text', charCount: 14, storageDriver: 'local', uploaderIp: '192.168.1.21', createdAt: '2026-04-17T10:10:00.000Z' },
    { id: 'seed-image', kind: 'image', title: '窗边照片', originalName: 'window.png', mimeType: 'image/png', sizeBytes: 2048, sha256: 'hash-image', previewKind: 'image', width: 1440, height: 900, storageDriver: 'minio', uploaderIp: '192.168.1.20', createdAt: '2026-04-17T10:00:00.000Z' },
  ];
}

// filterAssets 根据查询参数过滤返回的资产列表。
function filterAssets(items: Asset[], kind: string | null): Asset[] {
  return kind ? items.filter((item) => item.kind === kind) : items;
}

// updateAsset 把 PATCH 请求体映射到模拟资产状态中。
function updateAsset(items: Asset[], id: string, payload: unknown): Asset {
  const input = payload as { title?: string; content?: string };
  const index = items.findIndex((item) => item.id === id);
  const current = items[index];
  const next = current.kind === 'snippet' ? updateSnippetAsset(current, input) : { ...current, title: input.title ?? current.title };
  items.splice(index, 1, next);
  return next;
}

// updateSnippetAsset 构造便签编辑后的模拟返回值。
function updateSnippetAsset(asset: Asset, input: { title?: string; content?: string }): Asset {
  const content = input.content ?? asset.textContent ?? '';
  return { ...asset, title: input.title ?? asset.title, textContent: content, sizeBytes: content.length, charCount: content.length };
}

// createSnippetAsset 构造新建文字便签的模拟返回值。
function createSnippetAsset(payload: unknown): Asset {
  const input = payload as { title?: string; content?: string };
  return { id: `snippet-${Date.now()}`, kind: 'snippet', title: input.title || '新便签', textContent: input.content ?? '', originalName: 'snippet.txt', mimeType: 'text/plain', sizeBytes: (input.content ?? '').length, sha256: 'hash-new-snippet', previewKind: 'text', charCount: (input.content ?? '').length, storageDriver: 'local', uploaderIp: '192.168.1.30', createdAt: new Date().toISOString() };
}

// createImageAsset 构造新上传图片的模拟返回值。
function createImageAsset(name: string): Asset {
  return { id: `image-${Date.now()}`, kind: 'image', title: name, originalName: name, mimeType: 'image/png', sizeBytes: tinyPng.length, sha256: 'hash-upload', previewKind: 'image', width: 1, height: 1, storageDriver: 'minio', uploaderIp: '192.168.1.31', createdAt: new Date().toISOString() };
}

// removeAsset 从模拟状态中移除指定资产。
function removeAsset(items: Asset[], id: string) {
  const index = items.findIndex((item) => item.id === id);
  if (index >= 0) {
    items.splice(index, 1);
  }
}

// findAsset 根据预览或下载请求路径定位资产。
function findAsset(items: Asset[], url: URL): Asset {
  const parts = url.pathname.split('/');
  return items.find((item) => item.id === parts[4]) ?? items[0];
}

// extractFileName 从 multipart 请求体中提取上传文件名并在缺失时回退默认值。
function extractFileName(payload: string): string {
  const match = payload.match(/filename="([^"]+)"/);
  return match?.[1] ?? '新图片.png';
}

// previewResponse 根据资产类型返回预览或下载内容。
function previewResponse(asset: Asset) {
  if (asset.kind === 'image') {
    return { status: 200, body: tinyPng, contentType: 'image/png' };
  }
  return { status: 200, body: asset.textContent ?? 'file', contentType: asset.mimeType };
}

// json 构造 JSON 响应定义。
function json(payload: unknown, status = 200) {
  return { status, body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } };
}
