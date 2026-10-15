export interface AgendaEvento {
  id: number
  titulo: string
  tipo: string
  prioridad: string
  fecha_inicio: string
  completado: boolean
}

export interface HitoPorCobrar {
  id: number
  concepto: string
  monto: string | number
  moneda_id: string
  fecha_vencimiento: string
  proyecto_titulo: string
  estado: string
}

export interface BalanceDia {
  ingresos: string | number
  gastos: string | number
  neto: string | number
  moneda: string
}

export interface VistaHoy {
  fecha: string
  eventos_del_dia: AgendaEvento[]
  tareas_pendientes: AgendaEvento[]
  hitos_por_cobrar_hoy: HitoPorCobrar[]
  balance_dia: BalanceDia
}

export interface TransaccionPayload {
  uuid_sync: string
  tipo: 'ingreso' | 'gasto'
  monto: number
  moneda_id: string
  tasa_cambio?: number
  nota?: string
  fecha_transaccion: string
  metodo_pago?: string
  categoria_id?: number | null
}

export interface SyncMutation {
  entity: 'transaccion' | 'nota'
  payload: Record<string, unknown>
}
