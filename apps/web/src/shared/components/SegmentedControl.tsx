// 分段控件文件用于切换资产筛选维度，解决列表视图在不同类型之间的快速切换问题。
import type { ReactNode } from 'react';

interface Option<T extends string> {
  label: string;
  value: T;
  icon?: ReactNode;
}

interface Props<T extends string> {
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
}

// SegmentedControl 渲染 Apple 风格的分段切换控件。
export function SegmentedControl<T extends string>({ value, options, onChange, ariaLabel = '分段切换' }: Props<T>): JSX.Element {
  return (
    <div className="segmented" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button key={option.value} data-active={value === option.value} onClick={() => onChange(option.value)} role="tab" aria-selected={value === option.value}>
          {option.icon} {option.label}
        </button>
      ))}
    </div>
  );
}
