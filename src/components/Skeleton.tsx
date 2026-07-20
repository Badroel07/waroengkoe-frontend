export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-slate-200 dark:bg-slate-850 animate-shimmer ${className}`}
      style={{ backgroundSize: '200% 100%' }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-none flex items-center justify-between">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shrink-0" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
      <div className="flex gap-3 items-center justify-between">
        <div className="flex gap-3 flex-1 min-w-0 items-center">
          <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <Skeleton className="w-5 h-5 rounded-full shrink-0" />
      </div>
      <Skeleton className="h-4 w-5/6 rounded border-l-2 border-slate-200 dark:border-slate-800 pl-3" />
    </div>
  );
}

export function UserCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
      <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 w-full">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full shrink-0" />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-2">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </div>
      <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
    </div>
  );
}

export function AuditCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-4">
      <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-1.5 flex-1 rounded-full" />
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      <div className="flex sm:flex-col items-center gap-2 sm:items-end shrink-0 w-full sm:w-auto">
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  );
}
