from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class TransaccionCreate(BaseModel):
    uuid_sync: str | None = None
    tipo: Literal["ingreso", "gasto"]
    categoria_id: int | None = None
    proyecto_id: int | None = None
    hito_id: int | None = None
    monto: Decimal = Field(gt=0)
    moneda_id: str = "USD"
    tasa_cambio: Decimal = Decimal("1.0000")
    metodo_pago: str | None = None
    comprobante_ref: str | None = None
    nota: str | None = None
    fecha_transaccion: date


class TransaccionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid_sync: str | None
    tipo: str
    categoria_id: int | None
    proyecto_id: int | None
    hito_id: int | None
    monto: Decimal
    moneda_id: str
    tasa_cambio: Decimal
    metodo_pago: str | None
    comprobante_ref: str | None
    nota: str | None
    fecha_transaccion: date
    creado_el: datetime | None = None


class FlujoCajaResponse(BaseModel):
    ingresos_totales: Decimal
    gastos_totales: Decimal
    balance_neto: Decimal
    desglose_monedas: dict[str, dict[str, Decimal]]
    moneda_consolidada: str


class SyncMutation(BaseModel):
    entity: Literal["transaccion", "nota"]
    payload: dict[str, Any]


class SyncResponse(BaseModel):
    procesados: int
    fallidos: int
    conflictos: list[dict[str, Any]]
