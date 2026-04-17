var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
        { name: 'desktop', use: __assign({}, devices['Desktop Chrome']) },
        { name: 'mobile', use: __assign({}, devices['iPhone 13']) },
    ],
});
