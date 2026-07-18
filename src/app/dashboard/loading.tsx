export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#141414] pt-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white/5 rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 bg-white/5 rounded-lg w-48 animate-pulse" />
            <div className="h-3 bg-white/5 rounded-lg w-32 animate-pulse" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5">
              <div className="h-3 bg-white/5 rounded w-20 mb-3 animate-pulse" />
              <div className="h-8 bg-white/5 rounded w-16 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-white/5 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 bg-white/5 rounded-xl animate-pulse shrink-0" />
              <div className="flex-grow space-y-2">
                <div className="h-3 bg-white/5 rounded w-3/4 animate-pulse" />
                <div className="h-2 bg-white/5 rounded w-1/2 animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-white/5 rounded-lg animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
