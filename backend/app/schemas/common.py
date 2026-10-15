from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ClienteCreate(BaseModel):
    nombre: str
    empresa: str | None = None
    email: str | None = None
    telefono: str | None = None
    notas: str | None = None


class ClienteUpdate(BaseModel):
    nombre: str | None = None
    empresa: str | None = None
    email: str | None = None
    telefono: str | None = None
    notas: str | None = None


class ClienteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    empresa: str | None
    email: str | None
    telefono: str | None
    notas: str | None
    creado_el: datetime | None = None


class ProyectoCreate(BaseModel):
    titulo: str
    descripcion: str | None = None
    cliente_id: int | None = None
    estado: Literal["propuesta", "en_proceso", "pausado", "entregado", "finalizado"] = "propuesta"
    moneda_id: str = "USD"
    presupuesto_total: Decimal = Field(gt=0)
    fecha_inicio: date | None = None
    fecha_limite: date | None = None


class ProyectoUpdate(BaseModel):
    titulo: str | None = None
    descripcion: str | None = None
    cliente_id: int | None = None
    estado: Literal["propuesta", "en_proceso", "pausado", "entregado", "finalizado"] | None = None
    moneda_id: str | None = None
    presupuesto_total: Decimal | None = None
    fecha_inicio: date | None = None
    fecha_limite: date | None = None


class ProyectoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cliente_id: int | None
    titulo: str
    descripcion: str | None
    estado: str
    moneda_id: str
    presupuesto_total: Decimal
    fecha_inicio: date | None
    fecha_limite: date | None
    creado_el: datetime | None = None
    cobrado: Decimal = Decimal("0")
    pendiente: Decimal = Decimal("0")
    cliente_nombre: str | None = None


class HitoCreate(BaseModel):
    concepto: str
    monto: Decimal = Field(gt=0)
    fecha_vencimiento: date
    estado: Literal["pendiente", "cobrado", "vencido"] = "pendiente"


class HitoUpdate(BaseModel):
    concepto: str | None = None
    monto: Decimal | None = Field(default=None, gt=0)
    fecha_vencimiento: date | None = None
    estado: Literal["pendiente", "cobrado", "vencido"] | None = None


class HitoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    proyecto_id: int
    concepto: str
    monto: Decimal
    fecha_vencimiento: date
    estado: str
    fecha_pago: date | None



class LiquidarHitoRequest(BaseModel):
    metodo_pago: str | None = None
    comprobante_ref: str | None = None
    fecha_pago: date | None = None
    tasa_cambio: Decimal = Decimal("1.0000")


class LiquidarHitoResponse(BaseModel):
    hito_actualizado: HitoOut
    transaccion_ingreso_id: int


class CategoriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    tipo: str
    icono: str | None


class WishlistCreate(BaseModel):
    titulo: str
    precio_estimado: Decimal = Field(gt=0)
    moneda_id: str = "USD"
    monto_ahorrado: Decimal = Decimal("0")
    prioridad: Literal["baja", "media", "alta", "critica"] = "media"
    enlace_compra: str | None = None
    estado: Literal["deseado", "en_ahorro", "comprado", "descartado"] = "deseado"
    fecha_objetivo: date | None = None


class WishlistUpdate(BaseModel):
    titulo: str | None = None
    precio_estimado: Decimal | None = None
    moneda_id: str | None = None
    monto_ahorrado: Decimal | None = None
    prioridad: Literal["baja", "media", "alta", "critica"] | None = None
    enlace_compra: str | None = None
    estado: Literal["deseado", "en_ahorro", "comprado", "descartado"] | None = None
    fecha_objetivo: date | None = None


class WishlistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    precio_estimado: Decimal
    moneda_id: str
    monto_ahorrado: Decimal
    prioridad: str
    enlace_compra: str | None
    estado: str
    fecha_objetivo: date | None
    progreso_pct: float = 0
    meses_estimados: float | None = None


class AporteWishlist(BaseModel):
    monto: Decimal = Field(gt=0)


class AgendaCreate(BaseModel):
    titulo: str
    descripcion: str | None = None
    proyecto_id: int | None = None
    tipo: Literal["tarea", "reunion", "recordatorio_pago", "evento_personal"] = "tarea"
    prioridad: Literal["baja", "media", "alta"] = "media"
    fecha_inicio: datetime
    fecha_fin: datetime | None = None
    alarma_anticipacion_min: int = 15


class AgendaUpdate(BaseModel):
    titulo: str | None = None
    descripcion: str | None = None
    proyecto_id: int | None = None
    tipo: Literal["tarea", "reunion", "recordatorio_pago", "evento_personal"] | None = None
    prioridad: Literal["baja", "media", "alta"] | None = None
    fecha_inicio: datetime | None = None
    fecha_fin: datetime | None = None
    alarma_anticipacion_min: int | None = None
    completado: bool | None = None


class AgendaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    proyecto_id: int | None
    titulo: str
    descripcion: str | None
    tipo: str
    prioridad: str
    fecha_inicio: datetime
    fecha_fin: datetime | None
    alarma_anticipacion_min: int
    completado: bool
    creado_el: datetime | None = None


class NotaCreate(BaseModel):
    uuid_sync: str | None = None
    titulo: str | None = None
    contenido: str
    etiquetas: str | None = None
    fijado: bool = False


class NotaUpdate(BaseModel):
    titulo: str | None = None
    contenido: str | None = None
    etiquetas: str | None = None
    fijado: bool | None = None


class NotaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid_sync: str | None
    titulo: str | None
    contenido: str
    etiquetas: str | None
    fijado: bool
    creado_el: datetime | None = None


class DesgloseCategoria(BaseModel):
    categoria_id: int | None
    nombre: str
    total: Decimal
    porcentaje: float


class SearchHit(BaseModel):
    entity: str
    id: int
    titulo: str
    detalle: str | None = None


class SearchResponse(BaseModel):
    results: list[SearchHit]
