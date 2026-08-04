import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import PageHeader from '../../../components/ui/PageHeader'
import Icon from '../../../components/ui/Icon'
import Spinner from '../../../components/Spinner'
import { ROLES } from '../../../lib/roles'
import { estadoPuestaEnMarcha } from '../api'
import { pasosAdministrador, GUIAS, NOTAS_COMUNES } from '../contenido'

const SUBTITULOS = {
  [ROLES.ADMINISTRADOR]: 'Paso a paso para dejar tu instituto configurado y funcionando.',
  [ROLES.LIDER]: 'Cómo administrar tu diplomado, tus docentes y tus estudiantes.',
  [ROLES.DOCENTE]: 'Cómo llevar tus módulos: contenido, tareas, asistencia y calificaciones.',
  [ROLES.ESTUDIANTE]: 'Cómo usar la plataforma durante tu diplomado.',
}

export default function Ayuda() {
  const { profile } = useAuth()

  return (
    <div className="max-w-3xl">
      <PageHeader title="Ayuda" subtitle={SUBTITULOS[profile.role]} />
      {profile.role === ROLES.ADMINISTRADOR ? <ChecklistAdministrador /> : <GuiaDeRol role={profile.role} />}
      <NotasComunes />
    </div>
  )
}

function ChecklistAdministrador() {
  const [estado, setEstado] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    estadoPuestaEnMarcha().then(setEstado).catch((err) => setError(err.message))
  }, [])

  if (error) {
    return <p className="rounded-md bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p>
  }
  if (!estado) return <Spinner />

  const pasos = pasosAdministrador(estado)
  const requeridos = pasos.filter((p) => !p.opcional)
  const completados = requeridos.filter((p) => p.listo).length
  const porcentaje = Math.round((completados / requeridos.length) * 100)
  const siguiente = pasos.find((p) => !p.listo)

  return (
    <section className="mb-8">
      <div className="card mb-5">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">Puesta en marcha</h2>
          <span className="text-sm font-medium text-ink-soft">
            {completados} de {requeridos.length} pasos
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={porcentaje}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso de la puesta en marcha"
        >
          <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${porcentaje}%` }} />
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          {siguiente
            ? <>Lo siguiente: <span className="font-medium text-ink">{siguiente.titulo}</span>.</>
            : 'Tu instituto está completamente configurado.'}
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {pasos.map((paso, i) => (
          <Paso key={paso.id} paso={paso} numero={i + 1} />
        ))}
      </ol>
    </section>
  )
}

function Paso({ paso, numero }) {
  return (
    <li className={`card flex gap-4 ${paso.listo ? 'opacity-70' : ''}`}>
      <div className="shrink-0 pt-0.5">
        {paso.listo ? (
          <Icon name="check-circle" className="h-6 w-6 text-success-500" />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-ink-soft">
            {numero}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`text-sm font-semibold ${paso.listo ? 'text-ink-soft line-through' : 'text-ink'}`}>
            {paso.titulo}
          </h3>
          {paso.opcional && <span className="badge bg-slate-100 text-ink-soft">Opcional</span>}
          {paso.resumen && <span className="text-xs font-medium text-ink-faint">{paso.resumen}</span>}
        </div>

        <p className="mt-1 text-sm text-ink-soft">{paso.descripcion}</p>
        {paso.nota && <p className="mt-1 text-xs text-ink-faint">{paso.nota}</p>}

        {!paso.listo && (
          <Link to={paso.to} className="btn-secondary mt-3 !px-3 !py-1.5 text-xs">
            {paso.cta}
          </Link>
        )}
      </div>
    </li>
  )
}

function GuiaDeRol({ role }) {
  const guia = GUIAS[role]
  if (!guia) return null

  return (
    <section className="mb-8">
      <p className="mb-5 text-sm text-ink-soft">{guia.intro}</p>

      <ol className="flex flex-col gap-3">
        {guia.pasos.map((paso, i) => (
          <li key={paso.titulo} className="card flex gap-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-ink">{paso.titulo}</h3>
              <p className="mt-1 text-sm text-ink-soft">{paso.detalle}</p>
              {paso.to && (
                <Link to={paso.to} className="btn-secondary mt-3 !px-3 !py-1.5 text-xs">
                  {paso.cta}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function NotasComunes() {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-ink">Tu cuenta</h2>
      <dl className="card flex flex-col gap-4">
        {NOTAS_COMUNES.map((nota) => (
          <div key={nota.titulo}>
            <dt className="text-sm font-semibold text-ink">{nota.titulo}</dt>
            <dd className="mt-0.5 text-sm text-ink-soft">{nota.detalle}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
