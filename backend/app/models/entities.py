from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

# Integer PKs keep SQLite autoincrement reliable; PostgreSQL maps these fine for kickoff scale.
PK = Integer


class Moneda(Base):
    __tablename__ = "monedas"

    id: Mapped[str] = mapped_column(String(3), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    simbolo: Mapped[str] = mapped_column(String(5), nullable=False)
    tasa_referencia: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=Decimal("1.0000"))
    actualizado_el: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(PK, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    empresa: Mapped[str | None] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(100))
    telefono: Mapped[str | None] = mapped_column(String(30))
    notas: Mapped[str | None] = mapped_column(Text)
    creado_el: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Proyecto(Base):
    __tablename__ = "proyectos"

    id: Mapped[int] = mapped_column(PK, primary_key=True, autoincrement=True)
    cliente_id: Mapped[int | None] = mapped_column(PK, ForeignKey("clientes.id"))
    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text)
    estado: Mapped[str] = mapped_column(String(20), default="propuesta")
    moneda_id: Mapped[str] = mapped_column(String(3), ForeignKey("monedas.id"), nullable=False)
    presupuesto_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    fecha_inicio: Mapped[date | None] = mapped_column(Date)
    fecha_limite: Mapped[date | None] = mapped_column(Date)
    creado_el: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class CobroHito(Base):
    __tablename__ = "cobros_hitos"

    id: Mapped[int] = mapped_column(PK, primary_key=True, autoincrement=True)
    proyecto_id: Mapped[int] = mapped_column(PK, ForeignKey("proyectos.id"), nullable=False)
    concepto: Mapped[str] = mapped_column(String(150), nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    fecha_vencimiento: Mapped[date] = mapped_column(Date, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="pendiente")
    fecha_pago: Mapped[date | None] = mapped_column(Date)


class CategoriaFinanciera(Base):
    __tablename__ = "categorias_financieras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(60), nullable=False)
    tipo: Mapped[str] = mapped_column(String(10), nullable=False)
    icono: Mapped[str | None] = mapped_column(String(30))


class Transaccion(Base):
    __tablename__ = "transacciones"
    __table_args__ = (UniqueConstraint("uuid_sync", name="uq_transacciones_uuid_sync"),)

    id: Mapped[int] = mapped_column(PK, primary_key=True, autoincrement=True)
    uuid_sync: Mapped[str | None] = mapped_column(String(36), unique=True)
    tipo: Mapped[str] = mapped_column(String(10), nullable=False)
    categoria_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categorias_financieras.id"))
    proyecto_id: Mapped[int | None] = mapped_column(PK, ForeignKey("proyectos.id"))
    hito_id: Mapped[int | None] = mapped_column(PK, ForeignKey("cobros_hitos.id"))
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    moneda_id: Mapped[str] = mapped_column(String(3), ForeignKey("monedas.id"), nullable=False)
    tasa_cambio: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=Decimal("1.0000"))
    metodo_pago: Mapped[str | None] = mapped_column(String(50))
    comprobante_ref: Mapped[str | None] = mapped_column(String(100))
    nota: Mapped[str | None] = mapped_column(Text)
    fecha_transaccion: Mapped[date] = mapped_column(Date, nullable=False)
    creado_el: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class WishlistItem(Base):
    __tablename__ = "wishlist"

    id: Mapped[int] = mapped_column(PK, primary_key=True, autoincrement=True)
    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    precio_estimado: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    moneda_id: Mapped[str] = mapped_column(String(3), ForeignKey("monedas.id"), nullable=False)
    monto_ahorrado: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    prioridad: Mapped[str] = mapped_column(String(10), default="media")
    enlace_compra: Mapped[str | None] = mapped_column(String(255))
    estado: Mapped[str] = mapped_column(String(20), default="deseado")
    fecha_objetivo: Mapped[date | None] = mapped_column(Date)


class AgendaEvento(Base):
    __tablename__ = "agenda_eventos"

    id: Mapped[int] = mapped_column(PK, primary_key=True, autoincrement=True)
    proyecto_id: Mapped[int | None] = mapped_column(PK, ForeignKey("proyectos.id"))
    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text)
    tipo: Mapped[str] = mapped_column(String(30), default="tarea")
    prioridad: Mapped[str] = mapped_column(String(10), default="media")
    fecha_inicio: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    fecha_fin: Mapped[datetime | None] = mapped_column(DateTime)
    alarma_anticipacion_min: Mapped[int] = mapped_column(Integer, default=15)
    completado: Mapped[bool] = mapped_column(Boolean, default=False)
    creado_el: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class BitacoraNota(Base):
    __tablename__ = "bitacora_notas"
    __table_args__ = (UniqueConstraint("uuid_sync", name="uq_bitacora_uuid_sync"),)

    id: Mapped[int] = mapped_column(PK, primary_key=True, autoincrement=True)
    uuid_sync: Mapped[str | None] = mapped_column(String(36), unique=True)
    titulo: Mapped[str | None] = mapped_column(String(150))
    contenido: Mapped[str] = mapped_column(Text, nullable=False)
    etiquetas: Mapped[str | None] = mapped_column(String(150))
    fijado: Mapped[bool] = mapped_column(Boolean, default=False)
    creado_el: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class DispositivoPush(Base):
    __tablename__ = "dispositivos_push"

    id: Mapped[int] = mapped_column(PK, primary_key=True, autoincrement=True)
    endpoint: Mapped[str] = mapped_column(Text, nullable=False)
    p256dh_key: Mapped[str] = mapped_column(Text, nullable=False)
    auth_key: Mapped[str] = mapped_column(Text, nullable=False)
    dispositivo_info: Mapped[str | None] = mapped_column(String(100))
    creado_el: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Cuenta(Base):
    __tablename__ = "cuentas"

    id: Mapped[int] = mapped_column(PK, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False)
    tipo: Mapped[str] = mapped_column(String(30), default="efectivo")  # efectivo, banco, billetera, crypto
    moneda_id: Mapped[str] = mapped_column(String(3), ForeignKey("monedas.id"), nullable=False)
    saldo: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.00"))
    activa: Mapped[bool] = mapped_column(Boolean, default=True)
    banco: Mapped[str | None] = mapped_column(String(120))
    numero_cuenta: Mapped[str | None] = mapped_column(String(64))
    tipo_cuenta: Mapped[str | None] = mapped_column(String(40))  # ahorro, corriente, etc.
    titular: Mapped[str | None] = mapped_column(String(150))
    documento_id: Mapped[str | None] = mapped_column(String(40))  # cédula / RIF
    telefono_pago: Mapped[str | None] = mapped_column(String(30))  # pago móvil
    email_pago: Mapped[str | None] = mapped_column(String(120))
    notas: Mapped[str | None] = mapped_column(Text)
    creado_el: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class GastoRecurrente(Base):
    __tablename__ = "gastos_recurrentes"

    id: Mapped[int] = mapped_column(PK, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    moneda_id: Mapped[str] = mapped_column(String(3), ForeignKey("monedas.id"), nullable=False)
    categoria_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categorias_financieras.id"))
    dia_cobro: Mapped[int] = mapped_column(Integer, default=1)  # 1-28
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    proximo_pago: Mapped[date | None] = mapped_column(Date)
    notas: Mapped[str | None] = mapped_column(Text)


class PresupuestoMensual(Base):
    __tablename__ = "presupuestos_mensuales"
    __table_args__ = (UniqueConstraint("anio", "mes", "categoria_id", name="uq_presupuesto_mes_cat"),)

    id: Mapped[int] = mapped_column(PK, primary_key=True, autoincrement=True)
    anio: Mapped[int] = mapped_column(Integer, nullable=False)
    mes: Mapped[int] = mapped_column(Integer, nullable=False)
    categoria_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categorias_financieras.id"))
    limite: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    moneda_id: Mapped[str] = mapped_column(String(3), ForeignKey("monedas.id"), default="USD")


class IngresoRecurrente(Base):
    __tablename__ = "ingresos_recurrentes"

    id: Mapped[int] = mapped_column(PK, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    moneda_id: Mapped[str] = mapped_column(String(3), ForeignKey("monedas.id"), nullable=False)
    categoria_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categorias_financieras.id"))
    dia_cobro: Mapped[int] = mapped_column(Integer, default=1)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    proximo_cobro: Mapped[date | None] = mapped_column(Date)
    notas: Mapped[str | None] = mapped_column(Text)


class BorradorWhatsApp(Base):
    """Borradores de mensajes listos para WhatsApp (formato *negrita* _cursiva_ etc.)."""

    __tablename__ = "borradores_whatsapp"

    id: Mapped[int] = mapped_column(PK, primary_key=True, autoincrement=True)
    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    subtitulo: Mapped[str | None] = mapped_column(String(200))
    cuerpo: Mapped[str] = mapped_column(Text, nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(30))
    creado_el: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    actualizado_el: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )


