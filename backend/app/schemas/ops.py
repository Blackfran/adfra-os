from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CuentaCreate(BaseModel):
    nombre: str
    tipo: Literal["efectivo", "banco", "billetera", "crypto"] = "efectivo"
    moneda_id: str = "USD"
    saldo: Decimal = Decimal("0")
    banco: str | None = None
    numero_cuenta: str | None = None
    tipo_cuenta: str | None = None
    titular: str | None = None
    documento_id: str | None = None
    telefono_pago: str | None = None
    email_pago: str | None = None
    notas: str | None = None


class CuentaUpdate(BaseModel):
    nombre: str | None = None
    tipo: Literal["efectivo", "banco", "billetera", "crypto"] | None = None
    moneda_id: str | None = None
    saldo: Decimal | None = None
    activa: bool | None = None
    banco: str | None = None
    numero_cuenta: str | None = None
    tipo_cuenta: str | None = None
    titular: str | None = None
    documento_id: str | None = None
    telefono_pago: str | None = None
    email_pago: str | None = None
    notas: str | None = None


class CuentaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    tipo: str
    moneda_id: str
    saldo: Decimal
    activa: bool
    banco: str | None = None
    numero_cuenta: str | None = None
    tipo_cuenta: str | None = None
    titular: str | None = None
    documento_id: str | None = None
    telefono_pago: str | None = None
    email_pago: str | None = None
    notas: str | None
    saldo_usd: Decimal = Decimal("0")



class AjusteSaldo(BaseModel):
    saldo: Decimal
    nota: str | None = None


class RecurrenteCreate(BaseModel):
    nombre: str
    monto: Decimal = Field(gt=0)
    moneda_id: str = "USD"
    categoria_id: int | None = None
    dia_cobro: int = Field(default=1, ge=1, le=28)
    notas: str | None = None


class RecurrenteUpdate(BaseModel):
    nombre: str | None = None
    monto: Decimal | None = None
    moneda_id: str | None = None
    categoria_id: int | None = None
    dia_cobro: int | None = Field(default=None, ge=1, le=28)
    activo: bool | None = None
    notas: str | None = None


class RecurrenteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    monto: Decimal
    moneda_id: str
    categoria_id: int | None
    dia_cobro: int
    activo: bool
    proximo_pago: date | None
    notas: str | None
    dias_restantes: int | None = None


class PresupuestoCreate(BaseModel):
    anio: int
    mes: int = Field(ge=1, le=12)
    categoria_id: int | None = None
    limite: Decimal = Field(gt=0)
    moneda_id: str = "USD"


class PresupuestoOut(BaseModel):
    id: int
    anio: int
    mes: int
    categoria_id: int | None
    categoria_nombre: str
    limite: Decimal
    gastado: Decimal
    restante: Decimal
    porcentaje: float
    moneda_id: str


class MonedaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    simbolo: str
    tasa_referencia: Decimal
    actualizado_el: datetime | None = None


class MonedaUpdate(BaseModel):
    tasa_referencia: Decimal = Field(gt=0)


class InsightOut(BaseModel):
    codigo: str
    severidad: Literal["info", "aviso", "critico"]
    titulo: str
    detalle: str
    accion_url: str | None = None


class IngresoFijoCreate(BaseModel):
    nombre: str
    monto: Decimal = Field(gt=0)
    moneda_id: str = "USD"
    categoria_id: int | None = None
    dia_cobro: int = Field(default=1, ge=1, le=28)
    notas: str | None = None


class IngresoFijoUpdate(BaseModel):
    nombre: str | None = None
    monto: Decimal | None = None
    moneda_id: str | None = None
    categoria_id: int | None = None
    dia_cobro: int | None = Field(default=None, ge=1, le=28)
    activo: bool | None = None
    notas: str | None = None


class IngresoFijoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    monto: Decimal
    moneda_id: str
    categoria_id: int | None
    dia_cobro: int
    activo: bool
    proximo_cobro: date | None
    notas: str | None
    dias_restantes: int | None = None


class ReporteMensual(BaseModel):
    anio: int
    mes: int
    ingresos_totales: Decimal
    gastos_totales: Decimal
    balance_neto: Decimal
    cobros_proyectos: Decimal
    ingresos_fijos_registrados: Decimal
    ingresos_variables: Decimal
    gastos_fijos_registrados: Decimal
    gastos_variables: Decimal
    ingresos_fijos_programados: Decimal
    gastos_fijos_programados: Decimal
    por_cobrar_pendiente: Decimal
    liquidez_actual: Decimal
    desglose_gastos: list[dict]
    cobros_detalle: list[dict]
    resumen: str

