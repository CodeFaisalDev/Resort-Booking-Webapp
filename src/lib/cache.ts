/**
 * Lightweight in-memory cache for API responses.
 * Avoids repeated database queries for data that rarely changes (e.g. resorts list).
 * Each entry auto-expires after its TTL.
 * 
 * In serverless environments (Vercel), each cold-start gets a fresh cache.
 * Warm invocations reuse cached data, significantly reducing DB round-trips.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  /**
   * Get cached data, or execute the fetcher and cache the result.
   * @param key - Unique cache key
   * @param fetcher - Async function that produces the data
   * @param ttlSeconds - Time-to-live in seconds (default: 60s)
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 60): Promise<T> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && existing.expiresAt > now) {
      return existing.data as T;
    }

    const data = await fetcher();
    this.store.set(key, {
      data,
      expiresAt: now + ttlSeconds * 1000,
    });

    return data;
  }

  /** Invalidate a specific cache key */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Invalidate all keys matching a prefix */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /** Clear the entire cache */
  clear(): void {
    this.store.clear();
  }
}

// Singleton instance persists across warm serverless invocations
const globalForCache = global as unknown as { __memoryCache: MemoryCache };
export const cache = globalForCache.__memoryCache || new MemoryCache();
if (process.env.NODE_ENV !== 'production') globalForCache.__memoryCache = cache;
