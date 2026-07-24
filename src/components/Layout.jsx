import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV = {
  admin: [
    { to: '/', label: 'Inicio', icon: '🏠', end: true },
    { to: '/ninos', label: 'Niños', icon: '🧒' },
    { to: '/clases', label: 'Clases', icon: '🎒' },
    { to: '/docentes', label: 'Docentes', icon: '🍎' },
    { to: '/asistencia', label: 'Asistencia', icon: '✅' },
  ],
  coordinador: [
    { to: '/', label: 'Inicio', icon: '🏠', end: true },
    { to: '/ninos', label: 'Niños', icon: '🧒' },
    { to: '/clases', label: 'Clases', icon: '🎒' },
    { to: '/docentes', label: 'Docentes', icon: '🍎' },
    { to: '/asistencia', label: 'Asistencia', icon: '✅' },
  ],
  docente: [
    { to: '/', label: 'Mis clases', icon: '🏠', end: true },
    { to: '/asistencia', label: 'Asistencia', icon: '✅' },
    { to: '/actividades', label: 'Actividades', icon: '🎨' },
    { to: '/agenda', label: 'Agenda', icon: '📅' },
  ],
  padre: [
    { to: '/', label: 'Mi hijo/a', icon: '🏠', end: true },
    { to: '/actividades', label: 'Actividades', icon: '🎨' },
    { to: '/agenda', label: 'Agenda', icon: '📅' },
  ],
}

const ROLE_LABEL = {
  admin: 'Administrador',
  coordinador: 'Coordinador',
  docente: 'Docente',
  padre: 'Padre / Madre',
}

export default function Layout() {
  const { profile, signOut } = useAuth()
  const items = NAV[profile?.role] || []

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="flex w-24 flex-col items-center gap-2 border-r-4 border-sky-100 bg-white py-6 md:w-64 md:items-stretch md:px-4">
        <div className="mb-6 flex flex-col items-center gap-1 px-2 text-center">
          <span className="text-4xl">📖</span>
          <span className="hidden font-display text-lg font-bold leading-tight text-sky-600 md:block">
            Escuelita Dominical
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center justify-center gap-3 rounded-2xl px-3 py-3 text-lg font-bold transition-colors md:justify-start ${
                  isActive
                    ? 'bg-sky-400 text-white shadow-pop'
                    : 'text-ink/60 hover:bg-sky-50'
                }`
              }
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="hidden md:block">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 flex flex-col items-center gap-2 border-t-2 border-ink/5 pt-4 md:items-stretch">
          <div className="hidden text-center md:block">
            <p className="truncate text-sm font-bold">{profile?.nombre_completo}</p>
            <p className="text-xs text-ink/50">{ROLE_LABEL[profile?.role]}</p>
          </div>
          <button onClick={signOut} className="btn-secondary w-full !py-2 !text-base">
            <span>🚪</span>
            <span className="hidden md:block">Salir</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
