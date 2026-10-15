import { get, set } from 'idb-keyval'
import type { SyncMutation } from '../types/api'
import { syncMutations } from './api'

const QUEUE_KEY = 'pending_sync_queue'

export async function getQueue(): Promise<SyncMutation[]> {
  return (await get<SyncMutation[]>(QUEUE_KEY)) ?? []
}

export async function enqueueMutation(mutation: SyncMutation): Promise<void> {
  const queue = await getQueue()
  queue.push(mutation)
  await set(QUEUE_KEY, queue)
}

export async function flushQueue(): Promise<{ procesados: number; fallidos: number } | null> {
  if (!navigator.onLine) return null
  const queue = await getQueue()
  if (!queue.length) return { procesados: 0, fallidos: 0 }

  const result = await syncMutations(queue)
  if (result.fallidos === 0) {
    await set(QUEUE_KEY, [])
  } else {
    // Keep failed items for retry; drop successfully processed by uuid when possible
    const conflictUuids = new Set(
      result.conflictos
        .map((c) => (c as { uuid_sync?: string }).uuid_sync)
        .filter(Boolean) as string[],
    )
    const remaining = queue.filter((m) => {
      const uuid = m.payload.uuid_sync as string | undefined
      return uuid ? conflictUuids.has(uuid) || result.fallidos > 0 : true
    })
    // Simpler: clear if any processed; keep only if all failed
    if (result.procesados > 0 && result.fallidos === 0) {
      await set(QUEUE_KEY, [])
    } else if (result.procesados > 0) {
      await set(QUEUE_KEY, remaining.slice(-result.fallidos))
    }
  }
  return { procesados: result.procesados, fallidos: result.fallidos }
}

export function registerOnlineSync(): () => void {
  const handler = () => {
    void flushQueue()
  }
  window.addEventListener('online', handler)
  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.ready.then((reg) => {
      // Background Sync when supported
      const syncManager = (reg as ServiceWorkerRegistration & {
        sync?: { register: (tag: string) => Promise<void> }
      }).sync
      if (syncManager) {
        void syncManager.register('sync-mutations-queue').catch(() => undefined)
      }
    })
  }
  return () => window.removeEventListener('online', handler)
}
