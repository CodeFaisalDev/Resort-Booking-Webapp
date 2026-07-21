import { KPIGridSkeleton, DashboardTableSkeleton } from '@/components/SkeletonLoaders';

export default function DashboardLoading() {
  return (
    <div className="w-full h-screen bg-[#0C0A09] flex flex-col p-6 space-y-6">
      <KPIGridSkeleton count={5} />
      <DashboardTableSkeleton rows={8} cols={6} />
    </div>
  );
}

