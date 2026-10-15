# AdFra Ges

Sistema de gestión personal — PWA para finanzas multi-moneda, proyectos freelance, wishlist, agenda y bitácora.

**Stack:** React + Vite + Tailwind + Workbox · FastAPI · Supabase (PostgreSQL)

## Arranque

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
# Configura DATABASE_URL en backend/.env (ver .env.example)
uvicorn app.main:app --reload --port 8000
```

Docs: http://127.0.0.1:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Módulos

| Ruta | Función |
|------|---------|
| `/` | Vista Hoy — agenda, cobros, saldo del día |
| `/finanzas` | Libro diario, flujo de caja, desglose |
| `/proyectos` | Pipeline + hitos + liquidación → ingreso |
| `/agenda` | Eventos, completar, snooze 15/30/60 |
| `/wishlist` | Metas de ahorro, aportes, comprar |
| `/bitacora` | Notas + hashtags + búsqueda |

## API principal

- `GET /api/hoy` · `POST /api/transacciones` · `GET /api/flujo-caja`
- `GET/POST /api/proyectos` · `POST /api/hitos/{id}/liquidar`
- `GET/POST /api/wishlist` · `POST /api/wishlist/{id}/aporte|comprar`
- `GET/POST /api/agenda` · `POST /api/agenda/{id}/snooze`
- `GET/POST /api/bitacora` · `GET /api/search` · `POST /api/sync`
