import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Spinner from './components/Spinner'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import CompleteProfile from './pages/CompleteProfile'
import Tutorial from './pages/Tutorial'

import AdminHome from './pages/admin/AdminHome'
import Ninos from './pages/admin/Ninos'
import Clases from './pages/admin/Clases'
import Docentes from './pages/admin/Docentes'
import AsistenciaAdmin from './pages/admin/AsistenciaAdmin'

import DocenteHome from './pages/docente/DocenteHome'
import Asistencia from './pages/docente/Asistencia'
import Actividades from './pages/docente/Actividades'
import Agenda from './pages/docente/Agenda'

import PadreHome from './pages/padre/PadreHome'
import PadreActividades from './pages/padre/PadreActividades'
import PadreAgenda from './pages/padre/PadreAgenda'

const STAFF = ['admin', 'coordinador']

export default function App() {
  const { loading } = useAuth()
  if (loading) return <Spinner />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/completar-perfil" element={<CompleteProfile />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<RoleSwitchHome />} />
        <Route path="/ayuda" element={<Tutorial />} />

        {/* Admin / coordinador */}
        <Route
          path="/ninos"
          element={
            <ProtectedRoute roles={STAFF}>
              <Ninos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clases"
          element={
            <ProtectedRoute roles={STAFF}>
              <Clases />
            </ProtectedRoute>
          }
        />
        <Route
          path="/docentes"
          element={
            <ProtectedRoute roles={STAFF}>
              <Docentes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/asistencia"
          element={
            <ProtectedRoute roles={[...STAFF, 'docente']}>
              <RoleSwitchAsistencia />
            </ProtectedRoute>
          }
        />

        {/* Docente */}
        <Route
          path="/actividades"
          element={
            <ProtectedRoute roles={['docente', 'padre']}>
              <RoleSwitchActividades />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agenda"
          element={
            <ProtectedRoute roles={['docente', 'padre']}>
              <RoleSwitchAgenda />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}

function RoleSwitchHome() {
  const { profile } = useAuth()
  if (profile.role === 'docente') return <DocenteHome />
  if (profile.role === 'padre') return <PadreHome />
  return <AdminHome />
}

function RoleSwitchAsistencia() {
  const { profile } = useAuth()
  return profile.role === 'docente' ? <Asistencia /> : <AsistenciaAdmin />
}

function RoleSwitchActividades() {
  const { profile } = useAuth()
  return profile.role === 'docente' ? <Actividades /> : <PadreActividades />
}

function RoleSwitchAgenda() {
  const { profile } = useAuth()
  return profile.role === 'docente' ? <Agenda /> : <PadreAgenda />
}
