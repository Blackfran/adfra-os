"""Borra datos de usuario/prueba. Conserva monedas y categorías."""

from sqlalchemy import text

from app.database import SessionLocal, engine


TABLES = [
    "transacciones",
    "cobros_hitos",
    "agenda_eventos",
    "bitacora_notas",
    "borradores_whatsapp",
    "wishlist",
    "presupuestos_mensuales",
    "gastos_recurrentes",
    "ingresos_recurrentes",
    "cuentas",
    "proyectos",
    "clientes",
    "dispositivos_push",
]


def main() -> None:
    dialect = engine.dialect.name
    with SessionLocal() as db:
        if dialect == "postgresql":
            joined = ", ".join(TABLES)
            db.execute(text(f"TRUNCATE TABLE {joined} RESTART IDENTITY CASCADE"))
        else:
            for table in TABLES:
                db.execute(text(f"DELETE FROM {table}"))
        db.commit()

        counts = {}
        for table in TABLES:
            n = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            counts[table] = n
        monedas = db.execute(text("SELECT COUNT(*) FROM monedas")).scalar()
        cats = db.execute(text("SELECT COUNT(*) FROM categorias_financieras")).scalar()

    print("WIPED")
    for k, v in counts.items():
        print(f"  {k}: {v}")
    print(f"  monedas: {monedas}")
    print(f"  categorias: {cats}")


if __name__ == "__main__":
    main()
