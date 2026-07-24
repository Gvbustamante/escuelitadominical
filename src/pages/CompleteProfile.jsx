import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'

const ROLE_LABEL = {
  admin: 'Administrador',
  coordinador: 'Coordinador',
  docente: 'Docente',
  padre: 'Padre / Madre',
}

export default function CompleteProfile() {
  const { user, needsProfile, loading, refreshProfile, signOut } = useAuth()
  const meta = user?.app_metadata || {}
  const [nombre, setNombre] = useState(meta.nombre_completo || '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && !needsProfile) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setBusy(true)
    const { error: pwError } = await supabase.auth.updateUser({ password })
    if (pwError) {
      setError(pwError.message)
      setBusy(false)
      return
    }

    const role = meta.role || 'padre'
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      role,
      nombre_completo: nombre,
      telefono: meta.telefono || null,
    })
    if (profileError) {
      setError('No se pudo crear tu perfil: ' + profileError.message)
      setBusy(false)
      return
    }

    if (role === 'padre' && meta.nino_id) {
      await supabase.from('ninos_padres').insert({
        nino_id: meta.nino_id,
        padre_id: user.id,
        parentesco: meta.parentesco || null,
      })
    }

    await refreshProfile()
    setBusy(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-grape-100 via-cream to-sky-100 p-4">
      <div className="card w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="text-6xl">🎉</span>
          <h1 className="text-2xl font-bold text-grape-600">¡Bienvenido/a!</h1>
          <p className="text-ink/50">
            Completa tu cuenta como <strong>{ROLE_LABEL[meta.role] || 'usuario'}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Tu nombre completo</label>
            <input required className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="label">Crea una contraseña</label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="label">Confirma tu contraseña</label>
            <input
              type="password"
              required
              className="input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="rounded-xl bg-coral-50 px-3 py-2 text-sm font-bold text-coral-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary mt-2 justify-center">
            {busy ? 'Guardando...' : 'Empezar a usar la app'}
          </button>
          <button type="button" onClick={signOut} className="text-sm text-ink/40 underline">
            Cancelar y salir
          </button>
        </form>
      </div>
    </div>
  )
}
