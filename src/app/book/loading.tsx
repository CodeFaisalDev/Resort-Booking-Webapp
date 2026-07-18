export default function BookLoading() {
  return (
    <div className="min-h-screen bg-[#141414] pt-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Search skeleton */}
        <div className="h-14 bg-white/5 rounded-2xl animate-pulse" />

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#1A1A1A] rounded-3xl overflow-hidden border border-white/5">
              <div className="h-52 bg-white/5 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-white/5 rounded-lg w-3/4 animate-pulse" />
                <div className="h-3 bg-white/5 rounded-lg w-1/2 animate-pulse" />
                <div className="h-8 bg-white/5 rounded-xl w-full mt-4 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
