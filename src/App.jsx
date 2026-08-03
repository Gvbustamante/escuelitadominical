import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Spinner from './components/Spinner'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import PrimerAcceso from './pages/PrimerAcceso'
import VerificarCertificado from './pages/VerificarCertificado'
import NotFound from './pages/NotFound'
import Forbidden from './pages/Forbidden'
import Home from './pages/Home'

import { ROLES } from './lib/roles'
import UsuariosList from './features/usuarios/pages/UsuariosList'
import DiplomadosList from './features/diplomados/pages/DiplomadosList'
import DiplomadoForm from './features/diplomados/pages/DiplomadoForm'
import DiplomadoDetalle from './features/diplomados/pages/DiplomadoDetalle'
import ModuloForm from './features/modulos/pages/ModuloForm'
import ModuloDetalle from './features/modulos/pages/ModuloDetalle'
import FinancieroAdmin from './features/financiero/pages/FinancieroAdmin'
import MisPagos from './features/financiero/pages/MisPagos'
import Comunicacion from './features/comunicacion/pages/Comunicacion'
import TareasGestionList from './features/tareas_gestion/pages/TareasGestionList'
import Biblioteca from './features/biblioteca/pages/Biblioteca'

const STAFF = [ROLES.ADMINISTRADOR, ROLES.LIDER, ROLES.DOCENTE]
const TODOS = [ROLES.ADMINISTRADOR, ROLES.LIDER, ROLES.DOCENTE, ROLES.ESTUDIANTE]

export default function App() {
  const { loading } = useAuth()
  if (loading) return <Spinner />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/login/:slug" element={<Login />} />
      <Route path="/primer-acceso" element={<PrimerAcceso />} />
      <Route path="/verificar/:codigo" element={<VerificarCertificado />} />
      <Route path="/403" element={<Forbidden />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
              <UsuariosList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/financiero"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
              <FinancieroAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-pagos"
          element={
            <ProtectedRoute roles={[ROLES.ESTUDIANTE]}>
              <MisPagos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/comunicacion"
          element={
            <ProtectedRoute roles={STAFF}>
              <Comunicacion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tareas-gestion"
          element={
            <ProtectedRoute roles={STAFF}>
              <TareasGestionList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/biblioteca"
          element={
            <ProtectedRoute roles={TODOS}>
              <Biblioteca />
            </ProtectedRoute>
          }
        />

        <Route
          path="/diplomados"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.LIDER, ROLES.ESTUDIANTE]}>
              <DiplomadosList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diplomados/nuevo"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
              <DiplomadoForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diplomados/:id/editar"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
              <DiplomadoForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diplomados/:id"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.LIDER, ROLES.ESTUDIANTE]}>
              <DiplomadoDetalle />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diplomados/:diplomadoId/modulos/nuevo"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.LIDER]}>
              <ModuloForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/modulos/:id/editar"
          element={
            <ProtectedRoute roles={[ROLES.ADMINISTRADOR, ROLES.LIDER]}>
              <ModuloForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/modulos/:id"
          element={
            <ProtectedRoute roles={TODOS}>
              <ModuloDetalle />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
