import { useEffect, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Badge from '../../../components/ui/Badge'
import Icon from '../../../components/ui/Icon'
import Spinner from '../../../components/Spinner'
import { ROLES, ROLE_LABELS } from '../../../lib/roles'
import { listarPerfiles, actualizarActivo } from '../api'
import InvitarUsuarioModal from '../components/InvitarUsuarioModal'

const FILTROS = [
  { value: '', label: 'Todos' },
  { value: ROLES.ADMINISTRADOR, label: ROLE_LABELS[ROLES.ADMINISTRADOR] },
  { value: ROLES.LIDER, label: ROLE_LABELS[ROLES.LIDER] },
  { value: ROLES.DOCENTE, label: ROLE_LABELS[ROLES.DOCENTE] },
  { value: ROLES.ESTUDIANTE, label: ROLE_LABELS[ROLES.ESTUDIANTE] },
]

export default function UsuariosList() {
  const [filtro, setFiltro] = useState('')
  const [usuarios, setUsuarios] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  async function cargar() {
    const data = await listarPerfiles(filtro ? { role: filtro } : {})
    setUsuarios(data)
  }

  useEffect(() => {
    setUsuarios(null)
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro])

  async function toggleActivo(u) {
    await actualizarActivo(u.id, !u.activo)
    cargar()
  }

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Administra las cuentas de líderes, docentes y estudiantes de tu instituto."
        actions={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Icon name="plus" className="h-4 w-4" /> Invitar usuario
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filtro === f.value ? 'bg-brand text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {usuarios === null ? (
        <Spinner />
      ) : usuarios.length === 0 ? (
        <EmptyState icon="users" title="No hay usuarios en esta categoría" description="Invita al primero con el botón de arriba." />
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Documento</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-ink">{u.nombre_completo}</td>
                  <td>{ROLE_LABELS[u.role]}</td>
                  <td>{u.documento_identidad || '—'}</td>
                  <td>{u.email_contacto || u.telefono || '—'}</td>
                  <td>
                    <Badge tone={u.activo ? 'success' : 'neutral'}>{u.activo ? 'Activo' : 'Desactivado'}</Badge>
                  </td>
                  <td>
                    <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => toggleActivo(u)}>
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InvitarUsuarioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreado={cargar}
        rolesPermitidos={[ROLES.ADMINISTRADOR, ROLES.LIDER, ROLES.DOCENTE, ROLES.ESTUDIANTE]}
      />
    </div>
  )
}
