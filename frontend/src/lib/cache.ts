import { get, set, del, keys } from 'idb-keyval'
import { useEffect, useState } from 'react'

const PREFIX = 'adfra-cache-v2:'

export async function cacheGet<T>(key: string): Promise<T | undefined> {
  return get<T>(PREFIX + key)
}

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  await set(PREFIX + key, value)
}

export async function cacheInvalidate(prefix?: string): Promise<void> {
  const all = await keys()
  const targets = all.filter((k) => {
    const s = String(k)
    if (!s.startsWith(PREFIX)) return false
    if (!prefix) return true
    return s.startsWith(PREFIX + prefix)
  })
  await Promise.all(targets.map((k) => del(k)))
}

/** Show cached data instantly, then refresh from network. */
export function useCachedQuery<T>(key: string, fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  const reload = async () => {
    setRefreshing(true)
    try {
      const fresh = await fetcher()
      setData(fresh)
      setFromCache(false)
      setError(null)
      await cacheSet(key, fresh)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let alive = true
    setLoading(true)
    void (async () => {
      const cached = await cacheGet<T>(key)
      if (alive && cached !== undefined) {
        setData(cached)
        setFromCache(true)
        setLoading(false)
      }
      try {
        const fresh = await fetcher()
        if (!alive) return
        setData(fresh)
        setFromCache(false)
        setError(null)
        await cacheSet(key, fresh)
      } catch (e) {
        if (alive && cached === undefined) setError((e as Error).message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, refreshing, error, fromCache, reload, setData }
}
