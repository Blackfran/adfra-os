import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AuthProvider, useAuth } from './lib/auth'
import { registerOnlineSync } from './lib/offlineQueue'
import { AgendaPage } from './pages/AgendaPage'
import { AjustesPage } from './pages/AjustesPage'
import { BitacoraPage } from './pages/BitacoraPage'
import { ClientesPage } from './pages/ClientesPage'
import { CuentasPage } from './pages/CuentasPage'
import { FinanzasPage } from './pages/FinanzasPage'
import { HoyPage } from './pages/HoyPage'
import { IngresosFijosPage } from './pages/IngresosFijosPage'
import { LoginPage } from './pages/LoginPage'
import { NuevaNotaPage } from './pages/NuevaNotaPage'
import { NuevaTransaccionPage } from './pages/NuevaTransaccionPage'
import { ProyectoDetailPage } from './pages/ProyectoDetailPage'
import { ProyectosPage } from './pages/ProyectosPage'
import { RecurrentesPage } from './pages/RecurrentesPage'
import { ReportePage } from './pages/ReportePage'
import { WhatsAppPage } from './pages/WhatsAppPage'
import { WishlistPage } from './pages/WishlistPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const { token, ready } = useAuth()
  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center text-sm text-mist">Cargando…</div>
    )
  }
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  useEffect(() => registerOnlineSync(), [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<HoyPage />} />
            <Route path="finanzas" element={<FinanzasPage />} />
            <Route path="cuentas" element={<CuentasPage />} />
            <Route path="recurrentes" element={<RecurrentesPage />} />
            <Route path="ingresos-fijos" element={<IngresosFijosPage />} />
            <Route path="reporte" element={<ReportePage />} />
            <Route path="proyectos" element={<ProyectosPage />} />
            <Route path="proyectos/:id" element={<ProyectoDetailPage />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="whatsapp" element={<WhatsAppPage />} />
            <Route path="bitacora" element={<BitacoraPage />} />
            <Route path="ajustes" element={<AjustesPage />} />
            <Route path="transacciones/nuevo" element={<NuevaTransaccionPage />} />
            <Route path="bitacora/nuevo" element={<NuevaNotaPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
