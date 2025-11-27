import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type WidgetCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

// Manually created widget shell to keep dashboard modules consistent.
export function WidgetCard({
  title,
  description,
  children,
  footer,
  className
}: WidgetCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-800 bg-slate-950/50 p-4 shadow-sm h-full flex flex-col',
        className
      )}
    >
      {title ? (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          {description ? (
            <p className="text-xs text-slate-500">{description}</p>
          ) : null}
        </div>
      ) : null}
      <div className="flex-1">{children}</div>
      {footer ? (
        <div className="mt-3 border-t border-slate-900 pt-3 text-xs text-slate-500">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

