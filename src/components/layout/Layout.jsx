import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { navFor } from '../../lib/navigation'
import { ROLE_LABELS } from '../../lib/roles'
import Icon from '../ui/Icon'
import AppLogo from '../AppLogo'
import CambiarPasswordModal from '../CambiarPasswordModal'

export default function Layout() {
  const { profile, institucion, signOut } = useAuth()
  const [pwOpen, setPwOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const items = navFor(profile?.role)
  const mobileItems = items.slice(0, 4)
  const overflowItems = items.slice(4)

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Escritorio: sidebar fija expandida. Tablet: sidebar colapsada a íconos. */}
      <aside className="hidden shrink-0 flex-col border-r border-slate-200 bg-surface-raised md:flex md:w-16 lg:w-60">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-4 lg:px-5">
          <AppLogo className="h-8 w-8 shrink-0 object-contain rounded-md" />
          <span className="hidden truncate text-sm font-semibold text-ink lg:block">{institucion?.nombre || 'Plataforma académica'}</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors lg:justify-start justify-center ${
                  isActive ? 'bg-brand-50 text-brand' : 'text-ink-soft hover:bg-slate-100'
                }`
              }
              title={item.label}
            >
              <Icon name={item.icon} className="h-5 w-5 shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="hidden px-1 pb-2 lg:block">
            <p className="truncate text-sm font-medium text-ink">{profile?.nombre_completo}</p>
            <p className="text-xs text-ink-faint">{ROLE_LABELS[profile?.role]}</p>
          </div>
          <button onClick={() => setPwOpen(true)} className="btn-ghost mb-1 w-full justify-center lg:justify-start">
            <Icon name="key" className="h-4 w-4" />
            <span className="hidden lg:block">Contraseña</span>
          </button>
          <button onClick={signOut} className="btn-ghost w-full justify-center lg:justify-start">
            <Icon name="log-out" className="h-4 w-4" />
            <span className="hidden lg:block">Salir</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar (escritorio/tablet) y encabezado simple (móvil) */}
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-surface-raised px-4 md:h-16 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <AppLogo className="h-7 w-7 object-contain rounded-md" />
            <span className="truncate text-sm font-semibold text-ink">{institucion?.nombre || 'CELM'}</span>
          </div>
          <div className="hidden text-sm font-medium text-ink-soft md:block" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-ink md:block">{profile?.nombre_completo}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Móvil: navegación inferior tipo tab-bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-slate-200 bg-surface-raised md:hidden">
        {mobileItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium ${
                isActive ? 'text-brand' : 'text-ink-faint'
              }`
            }
          >
            <Icon name={item.icon} className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-ink-faint"
        >
          <Icon name="more" className="h-5 w-5" />
          Más
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/40 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="w-full rounded-t-lg bg-surface-raised p-4" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 truncate text-sm font-medium text-ink">{profile?.nombre_completo} · {ROLE_LABELS[profile?.role]}</p>
            {overflowItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMoreOpen(false)}
                className="btn-secondary mb-2 w-full justify-start"
              >
                <Icon name={item.icon} className="h-4 w-4" /> {item.label}
              </NavLink>
            ))}
            {overflowItems.length > 0 && <div className="my-2 border-t border-slate-100" />}
            <button onClick={() => { setMoreOpen(false); setPwOpen(true) }} className="btn-secondary mb-2 w-full justify-start">
              <Icon name="key" className="h-4 w-4" /> Cambiar contraseña
            </button>
            <button onClick={signOut} className="btn-secondary w-full justify-start">
              <Icon name="log-out" className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
      )}

      <CambiarPasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  )
}
