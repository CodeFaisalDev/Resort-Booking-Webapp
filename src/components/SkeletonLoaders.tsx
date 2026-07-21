import React from 'react';
import { Skeleton } from './ui/skeleton';

export function ResortCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1A1A1A]/80 overflow-hidden space-y-4 p-5">
      <Skeleton className="h-48 sm:h-52 w-full rounded-xl bg-white/[0.03]" />
      <div className="space-y-3">
        <div className="flex justify-between items-center gap-4">
          <Skeleton className="h-6 w-1/2 bg-white/[0.03]" />
          <Skeleton className="h-6 w-1/4 bg-white/[0.03]" />
        </div>
        <Skeleton className="h-4 w-3/4 bg-white/[0.02]" />
        <Skeleton className="h-4 w-5/6 bg-white/[0.02]" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-full rounded-lg bg-white/[0.03]" />
          <Skeleton className="h-8 w-12 rounded-lg bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}

export function ResortGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ResortCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardTableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-4">
      {/* Table Header skeleton */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={idx} className="h-4 w-20 bg-white/[0.03]" />
        ))}
      </div>
      {/* Table Body rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center justify-between py-2 border-b border-white/[0.02]">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <Skeleton key={cIdx} className="h-4 w-24 bg-white/[0.02]" />
            ))}
          </div>
        ))}
      </div>
      {/* Pagination skeleton */}
      <div className="flex justify-between items-center pt-4">
        <Skeleton className="h-8 w-32 bg-white/[0.03] rounded-lg" />
        <Skeleton className="h-8 w-24 bg-white/[0.03] rounded-lg" />
      </div>
    </div>
  );
}

export function KPIGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#1A1A1A]/80 p-5 rounded-2xl border border-white/5 space-y-3">
          <Skeleton className="h-3 w-16 bg-white/[0.02]" />
          <Skeleton className="h-8 w-24 bg-white/[0.03]" />
        </div>
      ))}
    </div>
  );
}

export function RoomsBoardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <Skeleton className="h-6 w-48 bg-white/[0.03]" />
        <Skeleton className="h-4 w-64 bg-white/[0.02]" />
      </div>
      <div className="space-y-6">
        {[1, 2].map((group) => (
          <div key={group} className="space-y-4 border border-white/5 p-5 rounded-2xl bg-white/[0.01]">
            <Skeleton className="h-5 w-32 bg-white/[0.03]" />
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/5 text-center space-y-2 bg-[#1A1A1A]/40">
                  <Skeleton className="h-3 w-8 mx-auto bg-white/[0.02]" />
                  <Skeleton className="h-5 w-12 mx-auto bg-white/[0.03]" />
                  <Skeleton className="h-2 w-10 mx-auto bg-white/[0.02]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CheckoutPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full bg-white/[0.03]" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-white/[0.03]" />
          <Skeleton className="h-4 w-32 bg-white/[0.02]" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1A1A1A]/80 p-6 rounded-3xl border border-white/5 space-y-4">
            <Skeleton className="h-6 w-36 bg-white/[0.03]" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full bg-white/[0.02]" />
              <Skeleton className="h-10 w-full bg-white/[0.02]" />
            </div>
            <Skeleton className="h-10 w-full bg-white/[0.02]" />
          </div>
          <div className="bg-[#1A1A1A]/80 p-6 rounded-3xl border border-white/5 space-y-4">
            <Skeleton className="h-6 w-48 bg-white/[0.03]" />
            <Skeleton className="h-24 w-full bg-white/[0.02]" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-[#1A1A1A]/80 p-6 rounded-3xl border border-white/5 space-y-4">
            <Skeleton className="h-40 w-full rounded-2xl bg-white/[0.03]" />
            <Skeleton className="h-6 w-32 bg-white/[0.03]" />
            <Skeleton className="h-4 w-full bg-white/[0.02]" />
            <div className="border-t border-white/5 pt-4 space-y-2">
              <div className="flex justify-between"><Skeleton className="h-4 w-20 bg-white/[0.02]" /><Skeleton className="h-4 w-12 bg-white/[0.02]" /></div>
              <div className="flex justify-between"><Skeleton className="h-4 w-24 bg-white/[0.02]" /><Skeleton className="h-4 w-12 bg-white/[0.02]" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GlobalPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0C0A09] flex flex-col items-center justify-center p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-2xl bg-white/10 animate-pulse" />
        <Skeleton className="h-6 w-40 rounded-lg bg-white/10 animate-pulse" />
      </div>
      <div className="w-full max-w-4xl space-y-4">
        <Skeleton className="h-14 w-full rounded-2xl bg-white/[0.04]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-2xl bg-white/[0.03]" />
          <Skeleton className="h-32 rounded-2xl bg-white/[0.03]" />
          <Skeleton className="h-32 rounded-2xl bg-white/[0.03]" />
        </div>
        <Skeleton className="h-64 w-full rounded-3xl bg-white/[0.03]" />
      </div>
    </div>
  );
}

export function AuditLogsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-white/5">
        <Skeleton className="h-4 w-28 bg-white/[0.03]" />
        <Skeleton className="h-4 w-44 bg-white/[0.03]" />
        <Skeleton className="h-4 w-32 bg-white/[0.03]" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex justify-between items-center py-3 border-b border-white/[0.02]">
            <div className="space-y-1">
              <Skeleton className="h-4 w-40 bg-white/[0.03]" />
              <Skeleton className="h-3 w-24 bg-white/[0.02]" />
            </div>
            <Skeleton className="h-6 w-20 bg-white/[0.03] rounded-full" />
            <Skeleton className="h-4 w-32 bg-white/[0.02]" />
          </div>
        ))}
      </div>
    </div>
  );
}

