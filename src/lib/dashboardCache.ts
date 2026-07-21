// Client-side in-memory cache for Admin Dashboard datasets

interface CacheStore {
  overviewData?: any;
  bookingsData?: any[];
  roomsData?: any[];
  staffData?: any[];
  deptsData?: any[];
  financeData?: any[];
  resortsData?: any[];
  fetchedTabs: Set<string>;
  lastFetched: Record<string, number>;
}

const cache: CacheStore = {
  fetchedTabs: new Set(),
  lastFetched: {},
};

export const dashboardCache = {
  get<T = any>(key: string): T | null {
    if (!cache.fetchedTabs.has(key)) return null;
    return (cache as any)[`${key}Data`] || null;
  },

  set(key: string, data: any): void {
    cache.fetchedTabs.add(key);
    (cache as any)[`${key}Data`] = data;
    cache.lastFetched[key] = Date.now();
  },

  has(key: string): boolean {
    return cache.fetchedTabs.has(key);
  },

  invalidate(key?: string): void {
    if (key) {
      cache.fetchedTabs.delete(key);
      delete (cache as any)[`${key}Data`];
      delete cache.lastFetched[key];
    } else {
      cache.fetchedTabs.clear();
      cache.overviewData = undefined;
      cache.bookingsData = undefined;
      cache.roomsData = undefined;
      cache.staffData = undefined;
      cache.deptsData = undefined;
      cache.financeData = undefined;
      cache.resortsData = undefined;
      cache.lastFetched = {};
    }
  },

  getLastFetched(key: string): number | null {
    return cache.lastFetched[key] || null;
  }
};
