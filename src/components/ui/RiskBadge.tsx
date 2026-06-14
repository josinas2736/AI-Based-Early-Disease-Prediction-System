import type { RiskLevel } from '@/types/types';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
  className?: string;
}

export function RiskBadge({ level, showIcon = true, className }: RiskBadgeProps) {
  const config = {
    Low: {
      label: 'Low Risk',
      classes: 'risk-low',
      dot: 'bg-[hsl(var(--risk-low))]',
    },
    Medium: {
      label: 'Medium Risk',
      classes: 'risk-medium',
      dot: 'bg-[hsl(var(--risk-medium))]',
    },
    High: {
      label: 'High Risk',
      classes: 'risk-high',
      dot: 'bg-[hsl(var(--risk-high))]',
    },
  }[level];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        config.classes,
        className
      )}
    >
      {showIcon && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />}
      {config.label}
    </span>
  );
}
