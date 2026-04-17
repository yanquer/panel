// 前端入口文件用于挂载主题系统与主应用组件，解决浏览器启动时的根节点渲染问题。
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app-shell/App';
import { ThemeProvider } from './theme/ThemeProvider';
import './theme/tokens.css';
import './theme/global.css';

// bootstrap 挂载 React 根节点并注入主题上下文。
function bootstrap() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>,
  );
}

bootstrap();
