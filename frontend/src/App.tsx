import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { registerOnlineSync } from './lib/offlineQueue'
import { HoyPage } from './pages/HoyPage'
import { NuevaNotaPage } from './pages/NuevaNotaPage'
import { NuevaTransaccionPage } from './pages/NuevaTransaccionPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  useEffect(() => registerOnlineSync(), [])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HoyPage />} />
          <Route
            path="finanzas"
            element={
              <PlaceholderPage
                title="Finanzas"
                blurb="Libro diario, multi-moneda y flujo de caja."
              />
            }
          />
          <Route
            path="proyectos"
            element={
              <PlaceholderPage
                title="Proyectos"
                blurb="Pipeline freelance, clientes e hitos de cobro."
              />
            }
          />
          <Route
            path="agenda"
            element={
              <PlaceholderPage
                title="Agenda"
                blurb="Eventos, tareas y alarmas del día a día."
              />
            }
          />
          <Route path="transacciones/nuevo" element={<NuevaTransaccionPage />} />
          <Route path="bitacora/nuevo" element={<NuevaNotaPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
