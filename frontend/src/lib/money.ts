export function money(value: string | number, currency = 'USD') {
  const n = typeof value === 'string' ? Number(value) : value
  try {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0)
  } catch {
    return `${currency} ${Number(n || 0).toFixed(2)}`
  }
}

export function monthRange(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  const iso = (x: Date) => x.toISOString().slice(0, 10)
  return { inicio: iso(start), fin: iso(end) }
}
