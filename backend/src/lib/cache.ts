/**
 * In-memory cache. Swap implementation for Redis later for multi-instance / TTL.
 * Use for: permissions, settings, feature flags.
 */

const store = new Map<string, { value: unknown; expiresAt?: number }>();

function isExpired(entry: { expiresAt?: number }): boolean {
  if (entry.expiresAt == null) return false;
  return Date.now() > entry.expiresAt;
}

export const cache = {
  get<T>(key: string): T | undefined {
    const entry = store.get(key);
    if (!entry || isExpired(entry)) {
      if (entry) store.delete(key);
      return undefined;
    }
    return entry.value as T;
  },

  set(key: string, value: unknown, ttlMs?: number): void {
    const expiresAt = ttlMs != null ? Date.now() + ttlMs : undefined;
    store.set(key, { value, expiresAt });
  },

  delete(key: string): boolean {
    return store.delete(key);
  },

  clear(): void {
    store.clear();
  },
};
