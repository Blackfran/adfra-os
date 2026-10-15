export interface AgendaEvento {
  id: number
  titulo: string
  descripcion?: string | null
  tipo: string
  prioridad: string
  fecha_inicio: string
  fecha_fin?: string | null
  completado: boolean
  proyecto_id?: number | null
  alarma_anticipacion_min?: number
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

export interface Insight {
  codigo: string
  severidad: 'info' | 'aviso' | 'critico'
  titulo: string
  detalle: string
  accion_url?: string | null
}

export interface RecurrenteLite {
  id: number
  nombre: string
  monto: string | number
  moneda_id: string
  dias_restantes?: number | null
  proximo_pago?: string | null
}

export interface VistaHoy {
  fecha: string
  eventos_del_dia: AgendaEvento[]
  tareas_pendientes: AgendaEvento[]
  hitos_por_cobrar_hoy: HitoPorCobrar[]
  hitos_vencidos: HitoPorCobrar[]
  balance_dia: BalanceDia
  balance_mes: BalanceDia
  liquidez: { total_usd: string | number; cuentas_activas: number }
  recurrentes_proximos: RecurrenteLite[]
  insights: Insight[]
  por_cobrar_total: string | number
}

export interface Transaccion {
  id: number
  uuid_sync?: string | null
  tipo: 'ingreso' | 'gasto' | string
  categoria_id?: number | null
  proyecto_id?: number | null
  hito_id?: number | null
  monto: string | number
  moneda_id: string
  tasa_cambio: string | number
  metodo_pago?: string | null
  comprobante_ref?: string | null
  nota?: string | null
  fecha_transaccion: string
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

export interface FlujoCaja {
  ingresos_totales: string | number
  gastos_totales: string | number
  balance_neto: string | number
  desglose_monedas: Record<string, { ingresos: string | number; gastos: string | number }>
  moneda_consolidada: string
}

export interface DesgloseCategoria {
  categoria_id: number | null
  nombre: string
  total: string | number
  porcentaje: number
}

export interface Categoria {
  id: number
  nombre: string
  tipo: string
  icono?: string | null
}

export interface Cliente {
  id: number
  nombre: string
  empresa?: string | null
  email?: string | null
  telefono?: string | null
  notas?: string | null
}

export interface Proyecto {
  id: number
  cliente_id?: number | null
  titulo: string
  descripcion?: string | null
  estado: string
  moneda_id: string
  presupuesto_total: string | number
  fecha_inicio?: string | null
  fecha_limite?: string | null
  cobrado: string | number
  pendiente: string | number
  cliente_nombre?: string | null
}

export interface Hito {
  id: number
  proyecto_id: number
  concepto: string
  monto: string | number
  fecha_vencimiento: string
  estado: string
  fecha_pago?: string | null
}

export interface WishlistItem {
  id: number
  titulo: string
  precio_estimado: string | number
  moneda_id: string
  monto_ahorrado: string | number
  prioridad: string
  enlace_compra?: string | null
  estado: string
  fecha_objetivo?: string | null
  progreso_pct: number
  meses_estimados?: number | null
}

export interface Nota {
  id: number
  uuid_sync?: string | null
  titulo?: string | null
  contenido: string
  etiquetas?: string | null
  fijado: boolean
  creado_el?: string | null
}

export interface SearchHit {
  entity: string
  id: number
  titulo: string
  detalle?: string | null
}

export interface SyncMutation {
  entity: 'transaccion' | 'nota'
  payload: Record<string, unknown>
}
