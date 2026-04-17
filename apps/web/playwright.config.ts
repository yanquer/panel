// Playwright 配置文件用于运行前端功能测试，解决桌面与移动端交互链路回归问题。
import { defineConfig, devices } from '@playwright/test';

// default 导出端到端测试运行配置。
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: true,
    cwd: '.',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
});
