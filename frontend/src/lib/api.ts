import type {
  AgendaEvento,
  Categoria,
  Cliente,
  DesgloseCategoria,
  FlujoCaja,
  Hito,
  Nota,
  Proyecto,
  SearchHit,
  SyncMutation,
  Transaccion,
  TransaccionPayload,
  VistaHoy,
  WishlistItem,
} from '../types/api'

export interface Cuenta {
  id: number
  nombre: string
  tipo: string
  moneda_id: string
  saldo: string | number
  activa: boolean
  banco?: string | null
  numero_cuenta?: string | null
  tipo_cuenta?: string | null
  titular?: string | null
  documento_id?: string | null
  telefono_pago?: string | null
  email_pago?: string | null
  notas?: string | null
  saldo_usd: string | number
}

export interface Recurrente {
  id: number
  nombre: string
  monto: string | number
  moneda_id: string
  categoria_id?: number | null
  dia_cobro: number
  activo: boolean
  proximo_pago?: string | null
  notas?: string | null
  dias_restantes?: number | null
}

export interface Presupuesto {
  id: number
  anio: number
  mes: number
  categoria_id: number | null
  categoria_nombre: string
  limite: string | number
  gastado: string | number
  restante: string | number
  porcentaje: number
  moneda_id: string
}

export interface Moneda {
  id: string
  nombre: string
  simbolo: string
  tasa_referencia: string | number
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('adfra_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init?.headers || {}),
    },
  })
  if (res.status === 401) {
    localStorage.removeItem('adfra_token')
    localStorage.removeItem('adfra_user')
    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign('/login')
    }
    throw new Error('Sesión requerida')
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  hoy: (fecha?: string) => request<VistaHoy>(`/api/hoy${fecha ? `?fecha=${fecha}` : ''}`),

  transacciones: (qs = '') => request<Transaccion[]>(`/api/transacciones${qs}`),
  createTransaccion: (payload: TransaccionPayload) =>
    request<Transaccion>('/api/transacciones', { method: 'POST', body: JSON.stringify(payload) }),
  flujoCaja: (inicio: string, fin: string) =>
    request<FlujoCaja>(`/api/flujo-caja?fecha_inicio=${inicio}&fecha_fin=${fin}`),
  desgloseGastos: (inicio: string, fin: string) =>
    request<DesgloseCategoria[]>(`/api/desglose-gastos?fecha_inicio=${inicio}&fecha_fin=${fin}`),
  categorias: () => request<Categoria[]>('/api/categorias'),

  clientes: () => request<Cliente[]>('/api/clientes'),
  createCliente: (payload: Partial<Cliente> & { nombre: string }) =>
    request<Cliente>('/api/clientes', { method: 'POST', body: JSON.stringify(payload) }),
  updateCliente: (id: number, payload: Partial<Cliente>) =>
    request<Cliente>(`/api/clientes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCliente: (id: number) => request<void>(`/api/clientes/${id}`, { method: 'DELETE' }),

  proyectos: (estado?: string) =>
    request<Proyecto[]>(`/api/proyectos${estado ? `?estado=${estado}` : ''}`),
  createProyecto: (payload: Record<string, unknown>) =>
    request<Proyecto>('/api/proyectos', { method: 'POST', body: JSON.stringify(payload) }),
  updateProyecto: (id: number, payload: Record<string, unknown>) =>
    request<Proyecto>(`/api/proyectos/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteProyecto: (id: number) => request<void>(`/api/proyectos/${id}`, { method: 'DELETE' }),
  hitos: (proyectoId: number) => request<Hito[]>(`/api/proyectos/${proyectoId}/hitos`),
  createHito: (proyectoId: number, payload: Record<string, unknown>) =>
    request<Hito>(`/api/proyectos/${proyectoId}/hitos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateHito: (hitoId: number, payload: Record<string, unknown>) =>
    request<Hito>(`/api/hitos/${hitoId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteHito: (hitoId: number) => request<void>(`/api/hitos/${hitoId}`, { method: 'DELETE' }),
  liquidarHito: (hitoId: number, payload: Record<string, unknown> = {}) =>
    request<{ hito_actualizado: Hito; transaccion_ingreso_id: number }>(
      `/api/hitos/${hitoId}/liquidar`,
      { method: 'POST', body: JSON.stringify(payload) },
    ),

  wishlist: () => request<WishlistItem[]>('/api/wishlist'),
  createWishlist: (payload: Record<string, unknown>) =>
    request<WishlistItem>('/api/wishlist', { method: 'POST', body: JSON.stringify(payload) }),
  aporteWishlist: (id: number, monto: number) =>
    request<WishlistItem>(`/api/wishlist/${id}/aporte`, {
      method: 'POST',
      body: JSON.stringify({ monto }),
    }),
  comprarWishlist: (id: number) =>
    request<{ item: WishlistItem; transaccion_gasto_id: number }>(`/api/wishlist/${id}/comprar`, {
      method: 'POST',
    }),

  agenda: (fecha?: string) =>
    request<AgendaEvento[]>(`/api/agenda${fecha ? `?fecha=${fecha}` : ''}`),
  createAgenda: (payload: Record<string, unknown>) =>
    request<AgendaEvento>('/api/agenda', { method: 'POST', body: JSON.stringify(payload) }),
  updateAgenda: (id: number, payload: Record<string, unknown>) =>
    request<AgendaEvento>(`/api/agenda/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  snooze: (id: number, minutos: number) =>
    request<AgendaEvento>(`/api/agenda/${id}/snooze?minutos=${minutos}`, { method: 'POST' }),

  bitacora: (q?: string) => request<Nota[]>(`/api/bitacora${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  createNota: (payload: Record<string, unknown>) =>
    request<Nota>('/api/bitacora', { method: 'POST', body: JSON.stringify(payload) }),

  cuentas: () => request<Cuenta[]>('/api/cuentas'),
  createCuenta: (payload: Record<string, unknown>) =>
    request<Cuenta>('/api/cuentas', { method: 'POST', body: JSON.stringify(payload) }),
  updateCuenta: (id: number, payload: Record<string, unknown>) =>
    request<Cuenta>(`/api/cuentas/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCuenta: (id: number) => request<void>(`/api/cuentas/${id}`, { method: 'DELETE' }),
  ajustarCuenta: (id: number, saldo: number, nota?: string) =>
    request<Cuenta>(`/api/cuentas/${id}/ajustar`, {
      method: 'POST',
      body: JSON.stringify({ saldo, nota }),
    }),

  recurrentes: () => request<Recurrente[]>('/api/recurrentes'),
  createRecurrente: (payload: Record<string, unknown>) =>
    request<Recurrente>('/api/recurrentes', { method: 'POST', body: JSON.stringify(payload) }),
  pagarRecurrente: (id: number, cuentaId?: number) =>
    request(`/api/recurrentes/${id}/pagar${cuentaId ? `?cuenta_id=${cuentaId}` : ''}`, {
      method: 'POST',
    }),

  ingresosFijos: () => request<IngresoFijo[]>('/api/ingresos-fijos'),
  createIngresoFijo: (payload: Record<string, unknown>) =>
    request<IngresoFijo>('/api/ingresos-fijos', { method: 'POST', body: JSON.stringify(payload) }),
  updateIngresoFijo: (id: number, payload: Record<string, unknown>) =>
    request<IngresoFijo>(`/api/ingresos-fijos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  cobrarIngresoFijo: (id: number) =>
    request(`/api/ingresos-fijos/${id}/cobrar`, { method: 'POST' }),
  deleteIngresoFijo: (id: number) =>
    request<void>(`/api/ingresos-fijos/${id}`, { method: 'DELETE' }),

  reporteMensual: (anio?: number, mes?: number) => {
    const qs = new URLSearchParams()
    if (anio) qs.set('anio', String(anio))
    if (mes) qs.set('mes', String(mes))
    const q = qs.toString()
    return request<ReporteMensual>(`/api/reportes/mensual${q ? `?${q}` : ''}`)
  },

  presupuestos: () => request<Presupuesto[]>('/api/presupuestos'),
  createPresupuesto: (payload: Record<string, unknown>) =>
    request<Presupuesto>('/api/presupuestos', { method: 'POST', body: JSON.stringify(payload) }),

  monedas: () => request<Moneda[]>('/api/monedas'),
  updateTasa: (id: string, tasa_referencia: number) =>
    request<Moneda>(`/api/monedas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ tasa_referencia }),
    }),

  search: (q: string) => request<{ results: SearchHit[] }>(`/api/search?q=${encodeURIComponent(q)}`),
  sync: (mutaciones: SyncMutation[]) =>
    request<{ procesados: number; fallidos: number; conflictos: unknown[] }>('/api/sync', {
      method: 'POST',
      body: JSON.stringify(mutaciones),
    }),
}

export interface IngresoFijo {
  id: number
  nombre: string
  monto: string | number
  moneda_id: string
  categoria_id?: number | null
  dia_cobro: number
  activo: boolean
  proximo_cobro?: string | null
  notas?: string | null
  dias_restantes?: number | null
}

export interface ReporteMensual {
  anio: number
  mes: number
  ingresos_totales: string | number
  gastos_totales: string | number
  balance_neto: string | number
  cobros_proyectos: string | number
  ingresos_fijos_registrados: string | number
  ingresos_variables: string | number
  gastos_fijos_registrados: string | number
  gastos_variables: string | number
  ingresos_fijos_programados: string | number
  gastos_fijos_programados: string | number
  por_cobrar_pendiente: string | number
  liquidez_actual: string | number
  desglose_gastos: { nombre: string; total: number; porcentaje: number }[]
  cobros_detalle: {
    transaccion_id: number
    concepto: string
    proyecto?: string | null
    monto_usd: number
    fecha: string
  }[]
  resumen: string
}

export const fetchVistaHoy = api.hoy
export const createTransaccion = api.createTransaccion
export const syncMutations = api.sync
