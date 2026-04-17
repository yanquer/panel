// 主题切换文件用于在浅色和深色之间切换，解决双主题下的快速视觉切换需求。
import { useTheme } from '../../theme/ThemeProvider';

// ThemeToggle 渲染顶部主题切换按钮。
export function ThemeToggle() {
  const { mode, toggleMode } = useTheme();

  return (
    <button className="button" onClick={toggleMode} aria-label="切换主题">
      {mode === 'light' ? '切到深色' : '切到浅色'}
    </button>
  );
}
