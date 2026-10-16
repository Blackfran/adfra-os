import type { Moneda } from './api'

export type TasasBs = {
  VES: number | null
  USD_BCV: number | null
  EUR: number | null
  USDT: number | null
}

export function bsDesdeMonedas(monedas: Moneda[]) {
  const byId = Object.fromEntries(monedas.map((m) => [m.id, Number(m.tasa_referencia)]))
  const usdBcv = byId.VES
  const eurPerUsd = byId.EUR
  const usdt = byId.BIN
  return {
    USD_BCV: usdBcv && Number.isFinite(usdBcv) ? usdBcv : null,
    EUR: usdBcv && eurPerUsd && eurPerUsd > 0 ? usdBcv / eurPerUsd : null,
    USDT: usdt && usdt > 10 ? usdt : null,
  }
}

export function mergeTasas(
  monedas: Moneda[],
  liveBs: Record<string, number> | null,
): TasasBs {
  const derived = bsDesdeMonedas(monedas)
  return {
    VES: 1,
    USD_BCV: liveBs?.USD ?? derived.USD_BCV,
    EUR: liveBs?.EUR ?? derived.EUR,
    USDT: liveBs?.USDT ?? liveBs?.BINANCE ?? derived.USDT,
  }
}
