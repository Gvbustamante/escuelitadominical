import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { inviteUser } from '../../lib/invite'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import { BADGE_CLASSES } from '../../lib/colors'

function calcularEdad(fecha) {
  if (!fecha) return '—'
  const nacimiento = new Date(fecha)
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const m = hoy.getMonth() - nacimiento.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--
  return edad
}

export default function Ninos() {
  const [ninos, setNinos] = useState(null)
  const [niveles, setNiveles] = useState([])
  const [padresPorNino, setPadresPorNino] = useState({})
  const [filtro, setFiltro] = useState('activos')
  const [busqueda, setBusqueda] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ nombre_completo: '', fecha_nacimiento: '', nivel_id: '', alergias: '', notas: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [inviteModal, setInviteModal] = useState(null)
  const [inviteForm, setInviteForm] = useState({ email: '', nombre_completo: '', parentesco: '' })
  const [inviteMsg, setInviteMsg] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)

  const load = useCallback(async () => {
    const [{ data: n }, { data: niv }, { data: np }] = await Promise.all([
      supabase.from('ninos').select('*').order('nombre_completo'),
      supabase.from('niveles').select('*').eq('activo', true),
      supabase.from('ninos_padres').select('nino_id, parentesco, padre:profiles(nombre_completo)'),
    ])
    setNinos(n || [])
    setNiveles(niv || [])
    const grouped = {}
    ;(np || []).forEach((row) => {
      grouped[row.nino_id] = grouped[row.nino_id] || []
      grouped[row.nino_id].push(row)
    })
    setPadresPorNino(grouped)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const nivelesById = useMemo(() => Object.fromEntries(niveles.map((n) => [n.id, n])), [niveles])

  const filtrados = useMemo(() => {
    if (!ninos) return []
    return ninos
      .filter((n) => (filtro === 'activos' ? n.activo : filtro === 'inactivos' ? !n.activo : true))
      .filter((n) => n.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()))
  }, [ninos, filtro, busqueda])

  function openNew() {
    setEditing(null)
    setForm({ nombre_completo: '', fecha_nacimiento: '', nivel_id: '', alergias: '', notas: '' })
    setError('')
    setModalOpen(true)
  }

  function openEdit(nino) {
    setEditing(nino)
    setForm({
      nombre_completo: nino.nombre_completo,
      fecha_nacimiento: nino.fecha_nacimiento || '',
      nivel_id: nino.nivel_id || '',
      alergias: nino.alergias || '',
      notas: nino.notas || '',
    })
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const payload = {
      nombre_completo: form.nombre_completo,
      fecha_nacimiento: form.fecha_nacimiento || null,
      nivel_id: form.nivel_id || null,
      alergias: form.alergias || null,
      notas: form.notas || null,
    }
    const { error } = editing
      ? await supabase.from('ninos').update(payload).eq('id', editing.id)
      : await supabase.from('ninos').insert(payload)

    setBusy(false)
    if (error) return setError(error.message)
    setModalOpen(false)
    load()
  }

  async function toggleActivo(nino) {
    await supabase.from('ninos').update({ activo: !nino.activo }).eq('id', nino.id)
    load()
  }

  function openInvite(nino) {
    setInviteModal(nino)
    setInviteForm({ email: '', nombre_completo: '', parentesco: '' })
    setInviteMsg('')
  }

  async function handleInvite(e) {
    e.preventDefault()
    setInviteBusy(true)
    setInviteMsg('')
    try {
      await inviteUser({
        email: inviteForm.email,
        nombre_completo: inviteForm.nombre_completo,
        role: 'padre',
        nino_id: inviteModal.id,
        parentesco: inviteForm.parentesco,
      })
      setInviteMsg('✅ Invitación enviada por correo.')
      load()
    } catch (err) {
      setInviteMsg('❌ ' + err.message)
    }
    setInviteBusy(false)
  }

  if (!ninos) return <Spinner />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Niños 🧒</h1>
          <p className="text-ink/50">{filtrados.length} de {ninos.length} en total</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          + Nuevo niño/a
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="flex gap-2">
          {[
            ['activos', 'Activos'],
            ['inactivos', 'Inactivos'],
            ['todos', 'Todos'],
          ].map(([v, label]) => (
            <button
              key={v}
              onClick={() => setFiltro(v)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${filtro === v ? 'bg-sky-400 text-white' : 'bg-white text-ink/50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((nino) => {
          const nivel = nivelesById[nino.nivel_id]
          const padres = padresPorNino[nino.id] || []
          return (
            <div key={nino.id} className={`card ${!nino.activo ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold">{nino.nombre_completo}</h3>
                  <p className="text-sm text-ink/50">{calcularEdad(nino.fecha_nacimiento)} años</p>
                </div>
                {nivel && <span className={`badge ${BADGE_CLASSES[nivel.color] || BADGE_CLASSES.sky}`}>{nivel.nombre}</span>}
              </div>
              {nino.alergias && (
                <p className="mt-2 rounded-xl bg-coral-50 px-3 py-1 text-xs font-bold text-coral-600">
                  ⚠️ Alergias: {nino.alergias}
                </p>
              )}
              <p className="mt-2 text-xs font-bold uppercase text-ink/40">Padres/encargados</p>
              {padres.length === 0 ? (
                <p className="text-sm text-ink/40">Sin vincular</p>
              ) : (
                <ul className="text-sm">
                  {padres.map((p, i) => (
                    <li key={i}>
                      {p.padre?.nombre_completo} {p.parentesco && `(${p.parentesco})`}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-secondary flex-1 !py-2 !text-sm" onClick={() => openEdit(nino)}>
                  Editar
                </button>
                <button className="btn-secondary flex-1 !py-2 !text-sm" onClick={() => openInvite(nino)}>
                  + Padre
                </button>
                <button className="btn-secondary flex-1 !py-2 !text-sm" onClick={() => toggleActivo(nino)}>
                  {nino.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          )
        })}
        {filtrados.length === 0 && <p className="text-ink/40">No hay niños que coincidan.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar niño/a' : 'Nuevo niño/a'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Nombre completo</label>
            <input
              required
              className="input"
              value={form.nombre_completo}
              onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha de nacimiento</label>
              <input
                type="date"
                className="input"
                value={form.fecha_nacimiento}
                onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Clase</label>
              <select
                className="input"
                value={form.nivel_id}
                onChange={(e) => setForm({ ...form, nivel_id: e.target.value })}
              >
                <option value="">Sin asignar</option>
                {niveles.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Alergias / condiciones</label>
            <input
              className="input"
              value={form.alergias}
              onChange={(e) => setForm({ ...form, alergias: e.target.value })}
              placeholder="Ej. Alergia al maní"
            />
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea
              className="input"
              rows={3}
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
            />
          </div>
          {error && <p className="rounded-xl bg-coral-50 px-3 py-2 text-sm font-bold text-coral-600">{error}</p>}
          <button disabled={busy} className="btn-primary justify-center">
            {busy ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </Modal>

      <Modal open={!!inviteModal} onClose={() => setInviteModal(null)} title={`Invitar padre/madre de ${inviteModal?.nombre_completo || ''}`}>
        <form onSubmit={handleInvite} className="flex flex-col gap-4">
          <div>
            <label className="label">Nombre del padre/madre</label>
            <input
              required
              className="input"
              value={inviteForm.nombre_completo}
              onChange={(e) => setInviteForm({ ...inviteForm, nombre_completo: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Correo electrónico</label>
            <input
              type="email"
              required
              className="input"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Parentesco</label>
            <input
              className="input"
              placeholder="Mamá, papá, abuela..."
              value={inviteForm.parentesco}
              onChange={(e) => setInviteForm({ ...inviteForm, parentesco: e.target.value })}
            />
          </div>
          {inviteMsg && <p className="text-sm font-bold">{inviteMsg}</p>}
          <button disabled={inviteBusy} className="btn-primary justify-center">
            {inviteBusy ? 'Enviando...' : 'Enviar invitación'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
