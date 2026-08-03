import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import AppLogo from '../components/AppLogo'

export default function PrimerAcceso() {
  const { loading, passwordRecovery, debeCambiarPassword, clearPasswordRecovery, refreshProfile, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && !passwordRecovery && !debeCambiarPassword) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
    if (password !== confirm) return setError('Las contraseñas no coinciden.')

    setBusy(true)
    const { error: pwError } = await supabase.auth.updateUser({ password })
    if (pwError) {
      setError(pwError.message)
      setBusy(false)
      return
    }

    if (debeCambiarPassword) {
      await supabase.from('profiles').update({ debe_cambiar_password: false }).eq('id', (await supabase.auth.getUser()).data.user.id)
    }

    clearPasswordRecovery()
    await refreshProfile()
    setBusy(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="card w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <AppLogo className="h-12 w-12 object-contain rounded-lg" />
          <h1 className="text-xl font-semibold text-ink">Crea tu contraseña</h1>
          <p className="text-sm text-ink-soft">Es tu primer ingreso: define una contraseña personal para continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Nueva contraseña</label>
            <input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="label">Confirma tu contraseña</label>
            <input type="password" required className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary mt-1 justify-center">
            {busy ? 'Guardando…' : 'Continuar'}
          </button>
          <button type="button" onClick={signOut} className="text-center text-sm text-ink-faint underline">
            Cancelar y salir
          </button>
        </form>
      </div>
    </div>
  )
}
