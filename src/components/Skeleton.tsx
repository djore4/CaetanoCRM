export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="A carregar">
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40 md:col-span-2" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-16" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-busy="true" aria-label="A carregar">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-[4.5rem]" />
      ))}
    </div>
  );
}

export function ErrorCard({ message }: { message: string }) {
  return (
    <div className="card p-5 text-sm">
      <p className="font-semibold text-danger">Não foi possível carregar.</p>
      <p className="text-muted mt-1 break-words">{message}</p>
    </div>
  );
}
