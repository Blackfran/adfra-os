"""Solo datos estructurales (monedas + categorías). Sin datos de prueba."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CategoriaFinanciera, Moneda


def seed_if_empty(db: Session) -> None:
    if not db.scalar(select(Moneda).limit(1)):
        db.add_all(
            [
                Moneda(id="USD", nombre="Dólar estadounidense", simbolo="$", tasa_referencia=Decimal("1")),
                Moneda(id="VES", nombre="Bolívar digital", simbolo="Bs", tasa_referencia=Decimal("36.5")),
                Moneda(id="EUR", nombre="Euro", simbolo="€", tasa_referencia=Decimal("0.92")),
            ]
        )

    if not db.scalar(select(CategoriaFinanciera).limit(1)):
        db.add_all(
            [
                CategoriaFinanciera(nombre="Freelance", tipo="ingreso", icono="briefcase"),
                CategoriaFinanciera(nombre="Salario", tipo="ingreso", icono="wallet"),
                CategoriaFinanciera(nombre="Alimentación", tipo="gasto", icono="utensils"),
                CategoriaFinanciera(nombre="Servicios", tipo="gasto", icono="bolt"),
                CategoriaFinanciera(nombre="Hardware", tipo="gasto", icono="cpu"),
                CategoriaFinanciera(nombre="Transporte", tipo="gasto", icono="car"),
                CategoriaFinanciera(nombre="Software", tipo="gasto", icono="code"),
            ]
        )

    db.commit()


def seed_extras_if_missing(db: Session) -> None:
    """Ya no crea cuentas/fijos de demostración."""
    return
