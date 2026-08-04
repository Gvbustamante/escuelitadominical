import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Spinner from './Spinner'

export default function ProtectedRoute({ roles, children }) {
  const { session, profile, loading, passwordRecovery, debeCambiarPassword, signOut } = useAuth()

  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (passwordRecovery || debeCambiarPassword) return <Navigate to="/primer-acceso" replace />
  if (!profile) {
    // loading ya es false: la consulta del perfil terminó y no encontró fila. No es un estado
    // transitorio — antes esto quedaba en <Spinner /> para siempre, sin salida, cuando una
    // cuenta de auth.users no tenía perfil asociado (ej. cuentas huérfanas de pruebas viejas).
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h2 className="text-2xl font-semibold">No encontramos tu perfil</h2>
        <p className="max-w-sm text-ink-soft">
          Tu cuenta inició sesión correctamente, pero no tiene un perfil asociado en este
          instituto. Pide al administrador que verifique tu cuenta, o intenta con otra.
        </p>
        <button onClick={signOut} className="btn-secondary">Cerrar sesión</button>
      </div>
    )
  }
  if (profile.activo === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h2 className="text-2xl font-semibold">Tu cuenta está desactivada</h2>
        <p className="text-ink-soft">Contacta al administrador de tu instituto.</p>
        <button onClick={signOut} className="btn-secondary">Cerrar sesión</button>
      </div>
    )
  }
  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/403" replace />
  }

  return children
}
