interface CacheItem<T> {
  data: T;
  timestamp: number;
  isRefreshing: boolean;
}

export class ISRCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL: number; // in milliseconds

  constructor(defaultTTLSeconds: number = 300) {
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  /**
   * Get data from cache or fetch it if not present.
   * Implements stale-while-revalidate logic.
   */
  async getData<T>(key: string, fetcher: () => Promise<T>, ttlOverride?: number): Promise<T> {
    const ttl = (ttlOverride ?? (this.defaultTTL / 1000)) * 1000;
    const now = Date.now();
    const cachedItem = this.cache.get(key);

    if (cachedItem) {
      const isStale = now - cachedItem.timestamp > ttl;

      if (isStale) {
        // Data is stale. If not already refreshing, trigger refresh in background
        if (!cachedItem.isRefreshing) {
          cachedItem.isRefreshing = true;
          // Trigger background refresh without awaiting
          fetcher()
            .then(freshData => {
              this.cache.set(key, {
                data: freshData,
                timestamp: Date.now(),
                isRefreshing: false
              });
            })
            .catch(err => {
              console.error(`ISRCache background refresh failed for key ${key}:`, err);
              cachedItem.isRefreshing = false;
            });
        }
        // Return stale data immediately (this is the ISR part)
        return cachedItem.data as T;
      }

      // Data is fresh, return it
      return cachedItem.data as T;
    }

    // No cache entry, must wait for initial fetch
    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      isRefreshing: false
    });
    return data;
  }

  /**
   * Invalidate specific key
   */
  invalidate(key: string) {
    this.cache.delete(key);
  }

  /**
   * Invalidate keys matching a pattern (prefix)
   */
  invalidatePattern(pattern: string) {
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
  }
}

// Export a singleton instance
export const isrCache = new ISRCache();
