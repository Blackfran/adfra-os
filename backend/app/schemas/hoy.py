from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.ops import InsightOut, RecurrenteOut


class AgendaEventoOut(BaseModel):
    id: int
    titulo: str
    tipo: str
    prioridad: str
    fecha_inicio: datetime
    completado: bool


class HitoPorCobrar(BaseModel):
    id: int
    concepto: str
    monto: Decimal
    moneda_id: str
    fecha_vencimiento: date
    proyecto_titulo: str
    estado: str


class BalanceDia(BaseModel):
    ingresos: Decimal
    gastos: Decimal
    neto: Decimal
    moneda: str


class BalanceMes(BaseModel):
    ingresos: Decimal
    gastos: Decimal
    neto: Decimal
    moneda: str


class Liquidez(BaseModel):
    total_usd: Decimal
    cuentas_activas: int


class VistaHoyResponse(BaseModel):
    fecha: date
    eventos_del_dia: list[AgendaEventoOut]
    tareas_pendientes: list[AgendaEventoOut]
    hitos_por_cobrar_hoy: list[HitoPorCobrar]
    hitos_vencidos: list[HitoPorCobrar]
    balance_dia: BalanceDia
    balance_mes: BalanceMes
    liquidez: Liquidez
    recurrentes_proximos: list[RecurrenteOut]
    insights: list[InsightOut]
    por_cobrar_total: Decimal
