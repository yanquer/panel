/// <reference types="vitest" />
// Vite 配置文件用于串联 React 构建、单元测试环境与开发服务器端口设置。
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// default 导出统一的前端构建与测试配置。
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/shared/test/setup.ts',
    include: ['src/**/*.test.ts?(x)'],
    exclude: ['tests/**'],
  },
});
