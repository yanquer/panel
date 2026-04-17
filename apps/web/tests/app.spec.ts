// 端到端测试文件用于验证桌面与移动端关键交互链路，解决共享页面 UI 功能回归问题。
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

// 桌面端完整链路覆盖上传、查看、解锁和删除流程。
test('桌面端浅色主题完整链路', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/');
  await expect(page.getByText('同一网络，安静共享。')).toBeVisible();
  await page.getByPlaceholder('输入将要共享的文字').fill('今晚 8 点前发版。');
  await page.getByRole('button', { name: '发布文字' }).click();
  await expect(page.getByText('今晚 8 点前发版。')).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({ name: 'new-shot.png', mimeType: 'image/png', buffer: tinyPng });
  await expect(page.getByText('new-shot.png')).toBeVisible();
  await page.getByPlaceholder('输入管理口令').fill('lan-share-admin');
  await page.getByRole('button', { name: '解锁删除能力' }).click();
  await page.getByRole('button', { name: /new-shot\.png/ }).click();
  await page.getByRole('button', { name: '删除', exact: true }).click();
  await expect(page.getByText('new-shot.png')).toHaveCount(0);
});

// 深色主题链路覆盖主题切换和图片预览。
test('桌面端深色主题图片预览链路', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/');
  await page.getByRole('button', { name: '切换主题' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: /窗边照片/ }).click();
  await expect(page.locator('.detail img[alt="窗边照片"]')).toBeVisible();
});

// 移动端链路覆盖上传后查看详情面板。
test('移动端上传与详情查看链路', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  await page.locator('input[type="file"]').setInputFiles({ name: 'phone-shot.png', mimeType: 'image/png', buffer: tinyPng });
  await expect(page.getByText('phone-shot.png')).toBeVisible();
  await page.getByRole('button', { name: /phone-shot\.png/ }).click();
  await expect(page.getByRole('complementary').getByRole('heading', { name: 'phone-shot.png' })).toBeVisible();
});

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
    { id: 'seed-image', kind: 'image', title: '窗边照片', originalName: 'window.png', mimeType: 'image/png', sizeBytes: 2048, sha256: 'hash-image', previewKind: 'image', width: 1440, height: 900, storageDriver: 'minio', uploaderIp: '192.168.1.20', createdAt: '2026-04-17T10:00:00.000Z' },
    { id: 'seed-snippet', kind: 'snippet', title: '欢迎', textContent: '拖一张图片，或写下一段文字。', originalName: 'snippet.txt', mimeType: 'text/plain', sizeBytes: 32, sha256: 'hash-snippet', previewKind: 'text', charCount: 14, storageDriver: 'local', uploaderIp: '192.168.1.21', createdAt: '2026-04-17T10:10:00.000Z' },
  ];
}

// filterAssets 根据查询参数过滤返回的资产列表。
function filterAssets(items: Asset[], kind: string | null): Asset[] {
  return kind ? items.filter((item) => item.kind === kind) : items;
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
