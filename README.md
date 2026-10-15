# AdFra OS

Personal ERP & Operating System — PWA modular para finanzas multi-moneda, proyectos freelance, wishlist y productividad diaria.

**Stack (fase 1):** React + Vite + Tailwind + Workbox PWA · FastAPI · PostgreSQL (SQLite local por defecto)

## Estructura

```
frontend/     PWA (App Shell, Vista Hoy, FAB, cola offline IndexedDB)
backend/      FastAPI + SQLAlchemy + schema SQL PostgreSQL
```

## Arranque rápido

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

Por defecto usa `sqlite:///./adfra.db`. Para PostgreSQL:

```bash
# .env
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/adfra_os
```

Aplica el DDL de referencia en `backend/sql/001_schema.sql`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173 (proxy `/api` → `:8000`)

## Endpoints fase 1

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/hoy` | `obtener_vista_hoy` |
| POST | `/api/transacciones` | `registrar_transaccion` |
| GET | `/api/flujo-caja` | `calcular_flujo_caja` |
| POST | `/api/sync` | `sincronizar_cola_offline` |

## PWA

- Manifest generado por `vite-plugin-pwa` (nombre AdFra OS, shortcuts gasto/ingreso/nota)
- Cache-First assets estáticos · Stale-While-Revalidate para `/api/*`
- Cola IndexedDB `pending_sync_queue` + flush en evento `online` / Background Sync tag `sync-mutations-queue`
