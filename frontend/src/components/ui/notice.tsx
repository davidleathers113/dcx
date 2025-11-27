import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type NoticeBannerProps = {
  tone?: 'info' | 'warning';
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

// Manually replicated Trackdrive notice styling for reuse across layouts.
export function NoticeBanner({
  tone = 'info',
  title,
  description,
  action,
  className
}: NoticeBannerProps) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm',
        tone === 'info'
          ? 'border-[color:var(--notice-info)] bg-[color:color-mix(in oklab,var(--notice-info)15%,transparent)] text-slate-100'
          : 'border-[color:var(--notice-warning)] bg-[color:color-mix(in oklab,var(--notice-warning)15%,transparent)] text-amber-50',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{title}</p>
          {description ? (
            <p className="text-xs opacity-80">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
    </div>
  );
}

