export function EmailSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl">
      <div className="w-9 h-9 rounded-full skeleton flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div className="h-3.5 w-32 skeleton rounded" />
          <div className="h-3 w-12 skeleton rounded" />
        </div>
        <div className="h-3.5 w-48 skeleton rounded" />
        <div className="h-3 w-full skeleton rounded" />
      </div>
    </div>
  );
}
