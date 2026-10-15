import type { SyncMutation, TransaccionPayload, VistaHoy } from '../types/api'

const API_BASE = ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function fetchVistaHoy(fecha?: string): Promise<VistaHoy> {
  const qs = fecha ? `?fecha=${fecha}` : ''
  return request<VistaHoy>(`/api/hoy${qs}`)
}

export function createTransaccion(payload: TransaccionPayload) {
  return request('/api/transacciones', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function syncMutations(mutaciones: SyncMutation[]) {
  return request<{ procesados: number; fallidos: number; conflictos: unknown[] }>('/api/sync', {
    method: 'POST',
    body: JSON.stringify(mutaciones),
  })
}
