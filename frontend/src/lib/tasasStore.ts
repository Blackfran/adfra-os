import { api, type Moneda } from './api'
import { mergeTasas, type TasasBs } from './tasas'

type Snapshot = {
  monedas: Moneda[]
  liveBs: Record<string, number> | null
  tasas: TasasBs
  updatedAt: number | null
  error: string | null
}

type Listener = () => void

let snapshot: Snapshot = {
  monedas: [],
  liveBs: null,
  tasas: { VES: 1, USD_BCV: null, EUR: null, USDT: null },
  updatedAt: null,
  error: null,
}

let inflight: Promise<Snapshot> | null = null
const listeners = new Set<Listener>()

function emit() {
  for (const l of listeners) l()
}

function apply(monedas: Moneda[], liveBs: Record<string, number> | null, error: string | null) {
  snapshot = {
    monedas,
    liveBs,
    tasas: mergeTasas(monedas, liveBs),
    updatedAt: Date.now(),
    error,
  }
  emit()
  return snapshot
}

export function getTasasSnapshot() {
  return snapshot
}

export function subscribeTasas(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Misma cotización para Ajustes y Conversor. */
export async function refreshTasas(opts?: { force?: boolean }): Promise<Snapshot> {
  if (inflight) return inflight
  // Reusa si hay datos frescos (< 45s) salvo force
  if (
    !opts?.force &&
    snapshot.updatedAt &&
    Date.now() - snapshot.updatedAt < 45_000 &&
    (snapshot.tasas.USDT != null || snapshot.tasas.USD_BCV != null)
  ) {
    return snapshot
  }

  inflight = (async () => {
    try {
      const r = await api.actualizarTasasVivas()
      const monedas = await api.monedas()
      return apply(monedas, r.cotizaciones_bs, null)
    } catch (e) {
      const msg = (e as Error).message || 'No se pudieron cargar las tasas'
      try {
        const monedas = await api.monedas()
        return apply(monedas, snapshot.liveBs, msg)
      } catch {
        return apply(snapshot.monedas, snapshot.liveBs, msg)
      }
    } finally {
      inflight = null
    }
  })()

  return inflight
}
