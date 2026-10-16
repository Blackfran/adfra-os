export const PROYECTO_ESTADOS = [
  'propuesta',
  'en_proceso',
  'pausado',
  'entregado',
  'finalizado',
] as const

export type ProyectoEstado = (typeof PROYECTO_ESTADOS)[number]

const STYLES: Record<string, { badge: string; chip: string; label: string }> = {
  propuesta: {
    label: 'Propuesta',
    badge: 'bg-accent-soft text-accent border-accent/20',
    chip: 'bg-accent text-ink',
  },
  en_proceso: {
    label: 'En proceso',
    badge: 'bg-income-soft text-income border-income/20',
    chip: 'bg-income text-ink',
  },
  pausado: {
    label: 'Pausado',
    badge: 'bg-warn-soft text-warn border-warn/25',
    chip: 'bg-warn text-ink',
  },
  entregado: {
    label: 'Entregado',
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    chip: 'bg-sky-600 text-ink',
  },
  finalizado: {
    label: 'Finalizado',
    badge: 'bg-ink-soft text-mist border-line',
    chip: 'bg-foam text-ink',
  },
}

const FALLBACK = {
  label: 'Estado',
  badge: 'bg-ink-soft text-mist border-line',
  chip: 'bg-ink-soft text-mist',
}

export function estadoStyle(estado: string) {
  return STYLES[estado] ?? { ...FALLBACK, label: estado.replace('_', ' ') }
}

export function estadoLabel(estado: string) {
  return estadoStyle(estado).label
}
