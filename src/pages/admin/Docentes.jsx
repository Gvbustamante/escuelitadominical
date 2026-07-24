import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { inviteUser } from '../../lib/invite'
import { useAuth } from '../../contexts/AuthContext'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'

const ROLE_LABEL = { admin: 'Administrador', coordinador: 'Coordinador', docente: 'Docente' }
const ROLE_BADGE = {
  admin: 'bg-grape-100 text-grape-700',
  coordinador: 'bg-sunshine-100 text-sunshine-700',
  docente: 'bg-sky-100 text-sky-700',
}

export default function Docentes() {
  const { profile } = useAuth()
  const [staff, setStaff] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ email: '', nombre_completo: '', role: 'docente' })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'coordinador', 'docente'])
      .order('role')
    setStaff(data || [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const rolesInvitables = profile.role === 'admin' ? ['docente', 'coordinador', 'admin'] : ['docente']

  function openInvite() {
    setForm({ email: '', nombre_completo: '', role: 'docente' })
    setMsg('')
    setModalOpen(true)
  }

  async function handleInvite(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    try {
      await inviteUser(form)
      setMsg('✅ Invitación enviada por correo.')
      load()
    } catch (err) {
      setMsg('❌ ' + err.message)
    }
    setBusy(false)
  }

  async function toggleActivo(person) {
    await supabase.from('profiles').update({ activo: !person.activo }).eq('id', person.id)
    load()
  }

  if (!staff) return <Spinner />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Equipo 🍎</h1>
          <p className="text-ink/50">Docentes, coordinadores y administradores</p>
        </div>
        <button className="btn-primary" onClick={openInvite}>
          + Invitar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((p) => (
          <div key={p.id} className={`card ${!p.activo ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold">{p.nombre_completo}</h3>
              <span className={`badge ${ROLE_BADGE[p.role]}`}>{ROLE_LABEL[p.role]}</span>
            </div>
            {p.telefono && <p className="text-sm text-ink/50">{p.telefono}</p>}
            {profile.role === 'admin' && p.id !== profile.id && (
              <button className="btn-secondary mt-4 w-full !py-2 !text-sm" onClick={() => toggleActivo(p)}>
                {p.activo ? 'Desactivar' : 'Activar'}
              </button>
            )}
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Invitar al equipo">
        <form onSubmit={handleInvite} className="flex flex-col gap-4">
          <div>
            <label className="label">Nombre completo</label>
            <input
              required
              className="input"
              value={form.nombre_completo}
              onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Correo electrónico</label>
            <input
              type="email"
              required
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Rol</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {rolesInvitables.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          {msg && <p className="text-sm font-bold">{msg}</p>}
          <button disabled={busy} className="btn-primary justify-center">
            {busy ? 'Enviando...' : 'Enviar invitación'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
