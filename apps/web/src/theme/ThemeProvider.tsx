// 主题提供器文件用于管理浅色与深色模式，解决全局 design token 与持久化偏好同步问题。
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { ThemeMode } from '../api/types';

interface ThemeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ThemeProvider 挂载全局主题状态并同步到文档根节点。
export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>(() => readThemeMode());
  const value = useMemo(() => ({ mode, toggleMode: () => setMode(nextTheme(mode)) }), [mode]);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    window.localStorage.setItem('lan-share-theme', mode);
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// useTheme 读取当前主题状态与切换动作。
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context) {
    return context;
  }
  throw new Error('ThemeProvider 缺失');
}

// readThemeMode 读取本地缓存主题并在缺失时回退到浅色。
function readThemeMode(): ThemeMode {
  const saved = window.localStorage.getItem('lan-share-theme');
  return saved === 'dark' ? 'dark' : 'light';
}

// nextTheme 计算下一个主题模式。
function nextTheme(mode: ThemeMode): ThemeMode {
  return mode === 'light' ? 'dark' : 'light';
}
