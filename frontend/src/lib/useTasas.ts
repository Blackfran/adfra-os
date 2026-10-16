import { useEffect, useState, useSyncExternalStore } from 'react'
import { getTasasSnapshot, refreshTasas, subscribeTasas } from './tasasStore'

export function useTasas(opts?: { auto?: boolean }) {
  const snap = useSyncExternalStore(subscribeTasas, getTasasSnapshot, getTasasSnapshot)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (opts?.auto === false) return
    setLoading(true)
    void refreshTasas().finally(() => setLoading(false))
  }, [opts?.auto])

  async function refresh(force = true) {
    setLoading(true)
    try {
      return await refreshTasas({ force })
    } finally {
      setLoading(false)
    }
  }

  return {
    tasas: snap.tasas,
    monedas: snap.monedas,
    liveBs: snap.liveBs,
    error: snap.error,
    updatedAt: snap.updatedAt,
    loading,
    refresh,
  }
}
