import { ROLES } from './roles'

// Se amplía fase a fase, junto con las rutas correspondientes en App.jsx.
// icon: nombre de icono en components/ui/Icon.jsx
export const NAV_ITEMS = {
  [ROLES.ADMINISTRADOR]: [
    { to: '/', label: 'Inicio', icon: 'home', end: true },
    { to: '/diplomados', label: 'Diplomados', icon: 'book' },
    { to: '/financiero', label: 'Financiero', icon: 'cash' },
    { to: '/comunicacion', label: 'Comunicación', icon: 'chat' },
    { to: '/tareas-gestion', label: 'Tareas', icon: 'check-square' },
    { to: '/usuarios', label: 'Usuarios', icon: 'users' },
  ],
  [ROLES.LIDER]: [
    { to: '/', label: 'Inicio', icon: 'home', end: true },
    { to: '/diplomados', label: 'Mi diplomado', icon: 'book' },
    { to: '/comunicacion', label: 'Comunicación', icon: 'chat' },
    { to: '/tareas-gestion', label: 'Tareas', icon: 'check-square' },
  ],
  [ROLES.DOCENTE]: [
    { to: '/', label: 'Inicio', icon: 'home', end: true },
    { to: '/comunicacion', label: 'Comunicación', icon: 'chat' },
    { to: '/tareas-gestion', label: 'Tareas', icon: 'check-square' },
  ],
  [ROLES.ESTUDIANTE]: [
    { to: '/', label: 'Inicio', icon: 'home', end: true },
    { to: '/diplomados', label: 'Mis diplomados', icon: 'book' },
    { to: '/mis-pagos', label: 'Mis pagos', icon: 'cash' },
  ],
}

export function navFor(role) {
  return NAV_ITEMS[role] || []
}
