import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Spinner from './Spinner'

export default function ProtectedRoute({ roles, children }) {
  const { session, profile, loading, passwordRecovery, debeCambiarPassword } = useAuth()

  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (passwordRecovery || debeCambiarPassword) return <Navigate to="/primer-acceso" replace />
  if (!profile) return <Spinner />
  if (profile.activo === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h2 className="text-2xl font-semibold">Tu cuenta está desactivada</h2>
        <p className="text-ink-soft">Contacta al administrador de tu instituto.</p>
      </div>
    )
  }
  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/403" replace />
  }

  return children
}
