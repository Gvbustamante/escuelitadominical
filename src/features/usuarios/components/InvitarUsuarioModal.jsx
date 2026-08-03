import { useState } from 'react'
import Modal from '../../../components/Modal'
import Icon from '../../../components/ui/Icon'
import { crearUsuarioInvitado } from '../../../lib/invite'
import { ROLE_LABELS } from '../../../lib/roles'

export default function InvitarUsuarioModal({ open, onClose, onCreado, rolesPermitidos }) {
  const [documento, setDocumento] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [role, setRole] = useState(rolesPermitidos[0])
  const [emailContacto, setEmailContacto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [creado, setCreado] = useState(null)

  function reset() {
    setDocumento('')
    setNombreCompleto('')
    setRole(rolesPermitidos[0])
    setEmailContacto('')
    setTelefono('')
    setError('')
    setCreado(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { id, password } = await crearUsuarioInvitado({
        documento,
        role,
        nombreCompleto,
        emailContacto: emailContacto || null,
        telefono: telefono || null,
      })
      setCreado({ id, password })
      onCreado?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Invitar usuario">
      {creado ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <Icon name="check-circle" className="h-10 w-10 text-success-500" />
          <p className="font-medium text-ink">Cuenta creada correctamente.</p>
          <div className="w-full rounded-md bg-slate-50 p-3 text-left text-sm">
            <p className="text-ink-soft">Contraseña temporal (compártela por un canal seguro):</p>
            <p className="mt-1 select-all font-mono text-base font-semibold text-ink">{creado.password}</p>
          </div>
          <p className="text-xs text-ink-faint">Se le pedirá cambiarla en su primer ingreso.</p>
          <button className="btn-primary" onClick={handleClose}>Cerrar</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Rol</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              {rolesPermitidos.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Nombre completo</label>
            <input required className="input" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
          </div>
          <div>
            <label className="label">Documento de identidad</label>
            <input required className="input" value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Cédula / carnet" />
          </div>
          <div>
            <label className="label">Correo de contacto (opcional)</label>
            <input type="email" className="input" value={emailContacto} onChange={(e) => setEmailContacto(e.target.value)} />
          </div>
          <div>
            <label className="label">Teléfono (opcional)</label>
            <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
          {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p>}
          <button disabled={busy} className="btn-primary justify-center">{busy ? 'Creando…' : 'Crear cuenta'}</button>
        </form>
      )}
    </Modal>
  )
}
