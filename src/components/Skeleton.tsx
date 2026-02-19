export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="w-24 h-24 bg-gray-200 rounded-full" />
        <div className="h-6 bg-gray-200 rounded w-40" />
        <div className="h-4 bg-gray-200 rounded w-24" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
