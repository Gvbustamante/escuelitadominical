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
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
