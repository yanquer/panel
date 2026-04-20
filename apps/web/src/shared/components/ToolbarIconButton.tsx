// 顶部工具按钮文件用于复用圆形图标操作入口，解决头部管理、主题切换和快捷新建按钮样式与交互不统一的问题。
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  active?: boolean;
  tone?: 'default' | 'accent';
  showDot?: boolean;
  children: ReactNode;
}

// ToolbarIconButton 渲染头部工具栏使用的圆形图标按钮。
export function ToolbarIconButton({ label, active = false, tone = 'default', showDot = false, className, type = 'button', children, ...buttonProps }: Props): JSX.Element {
  const classes = `toolbar-button toolbar-button--${tone}${active ? ' is-active' : ''}${className ? ` ${className}` : ''}`;

  return (
    <button {...buttonProps} type={type} className={classes} aria-label={label} title={label} data-active={active}>
      <span className="toolbar-button__icon" aria-hidden="true">{children}</span>
      {showDot ? <span className="toolbar-button__dot" aria-hidden="true" /> : null}
    </button>
  );
}
