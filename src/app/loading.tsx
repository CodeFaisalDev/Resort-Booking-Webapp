export default function Loading() {
  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#B9784F] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#8a8a8a] text-xs uppercase tracking-widest font-bold animate-pulse">
          Loading Experience...
        </p>
      </div>
    </div>
  );
}
