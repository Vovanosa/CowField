/**
 * One cache, used by every resource, with in-flight deduplication built in.
 *
 * The storage layer grew **three different bespoke caches** — a module singleton
 * (`statisticsStorage`), a singleton plus an in-flight promise (`difficultyOverviewStorage`), and a
 * `Map` per difficulty plus an in-flight `Map` (`difficultyLevelsPageStorage`) — and no cache at all
 * for level boards or per-level progress. Three consequences, all measured:
 *
 * 1. **Dedup is per-module, so the modules without it have none.** The game page and the editor
 *    fire duplicate requests whenever two callers ask at once, which is also why dev `StrictMode`
 *    doubles every level load.
 * 2. **Each cache was written for one page, so it is keyed by page rather than by resource.** The
 *    levels-page cache holds levels *and* progress together, so a completed level evicts the
 *    immutable 200-level catalogue and it is downloaded again.
 * 3. Invalidation is hand-wired by cross-import, which is the cycle that already forced
 *    `DIFFICULTIES` out into `levels/constants.ts`.
 *
 * Making dedup a property of the primitive fixes (1) everywhere at once, and `patch` is what fixes
 * (2): a write can update the row it changed instead of throwing the collection away.
 */

export type ResourceOptions<Key, Value> = {
  /** Fetches one entry. Never called twice concurrently for the same key. */
  load: (key: Key) => Promise<Value>
  /**
   * How long a loaded value stays fresh, in ms. Omit for **no expiry** — correct for immutable
   * content like a level board, which cannot change under a player mid-session.
   */
  ttlMs?: number
  /**
   * Turns a key into a cache key. Needed only for composite keys; the default is fine for strings,
   * numbers and anything else that is its own identity.
   */
  toCacheKey?: (key: Key) => string
  /**
   * Copies a value on the way in and out, so a caller mutating what it got cannot corrupt the
   * cache. Omit when values are already treated as immutable.
   */
  clone?: (value: Value) => Value
}

export type Resource<Key, Value> = {
  /** Cached value, the in-flight request for it, or a new request — in that order. */
  get: (key: Key) => Promise<Value>
  /** Cached value only. Never triggers a request; `undefined` if absent or stale. */
  peek: (key: Key) => Value | undefined
  /** Writes a value straight in, as if it had just loaded. For data a write already returned. */
  set: (key: Key, value: Value) => void
  /**
   * Updates a cached value in place, if there is one. **The point of the whole primitive**: after a
   * completion, patch the one row that changed instead of invalidating a collection and
   * re-downloading everything around it. A miss is a no-op — nothing to keep fresh.
   */
  patch: (key: Key, update: (current: Value) => Value) => void
  /** Drops one key, or the whole resource when called with no argument. */
  invalidate: (key?: Key) => void
}

type Entry<Value> = {
  value: Value
  /** `null` means no expiry. */
  expiresAtMs: number | null
}

export function createResource<Key, Value>({
  load,
  ttlMs,
  toCacheKey,
  clone,
}: ResourceOptions<Key, Value>): Resource<Key, Value> {
  const entries = new Map<string, Entry<Value>>()
  const inFlight = new Map<string, Promise<Value>>()

  const cacheKeyOf = toCacheKey ?? ((key: Key) => String(key))
  const copy = clone ?? ((value: Value) => value)

  function readFresh(cacheKey: string) {
    const entry = entries.get(cacheKey)

    if (!entry) {
      return undefined
    }

    if (entry.expiresAtMs !== null && Date.now() >= entry.expiresAtMs) {
      entries.delete(cacheKey)
      return undefined
    }

    return entry
  }

  function store(cacheKey: string, value: Value) {
    entries.set(cacheKey, {
      value,
      expiresAtMs: ttlMs === undefined ? null : Date.now() + ttlMs,
    })
  }

  return {
    async get(key) {
      const cacheKey = cacheKeyOf(key)
      const entry = readFresh(cacheKey)

      if (entry) {
        return copy(entry.value)
      }

      const pending = inFlight.get(cacheKey)

      if (pending) {
        return pending.then(copy)
      }

      const request = load(key)
        .then((value) => {
          store(cacheKey, value)
          return value
        })
        .finally(() => {
          inFlight.delete(cacheKey)
        })

      inFlight.set(cacheKey, request)

      return request.then(copy)
    },

    peek(key) {
      const entry = readFresh(cacheKeyOf(key))
      return entry ? copy(entry.value) : undefined
    },

    set(key, value) {
      store(cacheKeyOf(key), copy(value))
    },

    patch(key, update) {
      const cacheKey = cacheKeyOf(key)
      const entry = readFresh(cacheKey)

      if (!entry) {
        return
      }

      store(cacheKey, update(copy(entry.value)))
    },

    invalidate(key) {
      if (key === undefined) {
        entries.clear()
        inFlight.clear()
        return
      }

      const cacheKey = cacheKeyOf(key)
      entries.delete(cacheKey)
      inFlight.delete(cacheKey)
    },
  }
}
