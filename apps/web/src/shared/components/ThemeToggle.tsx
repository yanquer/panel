// 主题切换文件用于在浅色和深色之间切换，解决双主题下的快速视觉切换需求。
import { useTheme } from '../../theme/ThemeProvider';
import { ToolbarIconButton } from './ToolbarIconButton';

// ThemeToggle 渲染顶部主题切换按钮。
export function ThemeToggle(): JSX.Element {
  const { mode, toggleMode } = useTheme();
  const isDark = mode === 'dark';
  const label = isDark ? '切换到浅色主题' : '切换到深色主题';

  return (
    <ToolbarIconButton label={label} active={isDark} aria-pressed={isDark} onClick={toggleMode}>
      {isDark ? (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5V5.3M12 18.7V21.5M21.5 12H18.7M5.3 12H2.5M18.72 5.28L16.74 7.26M7.26 16.74L5.28 18.72M18.72 18.72L16.74 16.74M7.26 7.26L5.28 5.28" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24">
          <path d="M20 14.2A7.7 7.7 0 0 1 9.8 4A8.7 8.7 0 1 0 20 14.2Z" />
        </svg>
      )}
    </ToolbarIconButton>
  );
}
