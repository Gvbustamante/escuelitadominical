import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROLES, ROLE_LABELS } from '../lib/roles'
import Spinner from '../components/Spinner'
import StatTile from '../components/ui/StatTile'
import { statsAdministrador, statsLider, statsDocente, statsEstudiante } from '../features/dashboard/api'
import BannerEvento from '../features/eventos/components/BannerEvento'

export default function Home() {
  const { profile, institucion } = useAuth()
  const primerNombre = profile?.nombre_completo?.split(' ')[0]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Hola, {primerNombre}</h1>
        <p className="text-sm text-ink-soft">{ROLE_LABELS[profile?.role]} en {institucion?.nombre || 'tu instituto'}.</p>
      </div>

      <BannerEvento />

      {profile?.role === ROLES.ADMINISTRADOR && <DashboardAdministrador />}
      {profile?.role === ROLES.LIDER && <DashboardLider />}
      {profile?.role === ROLES.DOCENTE && <DashboardDocente />}
      {profile?.role === ROLES.ESTUDIANTE && <DashboardEstudiante />}
    </div>
  )
}

function DashboardAdministrador() {
  const [stats, setStats] = useState(null)
  useEffect(() => { statsAdministrador().then(setStats) }, [])
  if (!stats) return <Spinner />
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatTile icon="book" label="Diplomados activos" value={stats.diplomadosActivos} />
      <StatTile icon="users" label="Estudiantes" value={stats.estudiantes} />
      <StatTile icon="cash" label="Pagos por aprobar" value={stats.pagosPendientes} tone={stats.pagosPendientes > 0 ? 'warning' : 'success'} />
      <StatTile icon="check-square" label="Tareas de gestión vencidas" value={stats.tareasVencidas} tone={stats.tareasVencidas > 0 ? 'danger' : 'success'} />
      <StatTile icon="award" label="Certificados este mes" value={stats.certificadosMes} />
    </div>
  )
}

function DashboardLider() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  useEffect(() => { statsLider(profile.id).then(setStats) }, [profile.id])
  if (!stats) return <Spinner />
  if (!stats.diplomado) {
    return <p className="text-sm text-ink-soft">Todavía no tienes un diplomado asignado.</p>
  }
  return (
    <div>
      <p className="mb-3 text-sm text-ink-soft">Diplomado: <Link to={`/diplomados/${stats.diplomado.id}`} className="font-medium text-brand hover:underline">{stats.diplomado.nombre}</Link></p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon="folder" label="Módulos" value={stats.modulos} />
        <StatTile icon="users" label="Estudiantes matriculados" value={stats.estudiantesMatriculados} />
        <StatTile icon="check-square" label="Entregas por calificar" value={stats.entregas} tone={stats.entregas > 0 ? 'warning' : 'success'} />
        <StatTile icon="award" label="Exámenes por revisar" value={stats.examenes} tone={stats.examenes > 0 ? 'warning' : 'success'} />
      </div>
    </div>
  )
}

function DashboardDocente() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  useEffect(() => { statsDocente(profile.id).then(setStats) }, [profile.id])
  if (!stats) return <Spinner />
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatTile icon="folder" label="Mis módulos" value={stats.modulos} />
      <StatTile icon="check-square" label="Entregas por calificar" value={stats.entregas} tone={stats.entregas > 0 ? 'warning' : 'success'} />
      <StatTile icon="award" label="Exámenes por revisar" value={stats.examenes} tone={stats.examenes > 0 ? 'warning' : 'success'} />
    </div>
  )
}

function DashboardEstudiante() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  useEffect(() => { statsEstudiante(profile.id).then(setStats) }, [profile.id])
  if (!stats) return <Spinner />
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatTile icon="book" label="Diplomados activos" value={stats.diplomados} />
      <StatTile icon="cash" label="Pagos pendientes" value={stats.pagosPendientes} tone={stats.pagosPendientes > 0 ? 'warning' : 'success'} />
      <StatTile icon="award" label="Certificados" value={stats.certificados} />
    </div>
  )
}
