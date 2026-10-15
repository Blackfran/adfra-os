"""Lightweight additive migrations for managed Postgres (Supabase)."""

from sqlalchemy import text

from app.database import engine


def ensure_schema_patches() -> None:
    stmts = [
        "ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS banco VARCHAR(120)",
        "ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS numero_cuenta VARCHAR(64)",
        "ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS tipo_cuenta VARCHAR(40)",
        "ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS titular VARCHAR(150)",
        "ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS documento_id VARCHAR(40)",
        "ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS telefono_pago VARCHAR(30)",
        "ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS email_pago VARCHAR(120)",
    ]
    # SQLite doesn't support IF NOT EXISTS on ADD COLUMN the same way in older versions;
    # ignore failures for already-existing columns.
    with engine.begin() as conn:
        dialect = engine.dialect.name
        for stmt in stmts:
            try:
                if dialect == "sqlite":
                    col = stmt.split("ADD COLUMN IF NOT EXISTS ")[1].split()[0]
                    rows = conn.execute(text(f"PRAGMA table_info(cuentas)")).fetchall()
                    existing = {r[1] for r in rows}
                    if col not in existing:
                        conn.execute(text(stmt.replace(" IF NOT EXISTS", "")))
                else:
                    conn.execute(text(stmt))
            except Exception:  # noqa: BLE001
                continue
