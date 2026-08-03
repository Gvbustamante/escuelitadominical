import { ROLES } from './roles'

// Se amplía fase a fase, junto con las rutas correspondientes en App.jsx.
// icon: nombre de icono en components/ui/Icon.jsx
export const NAV_ITEMS = {
  [ROLES.ADMINISTRADOR]: [{ to: '/', label: 'Inicio', icon: 'home', end: true }],
  [ROLES.LIDER]: [{ to: '/', label: 'Inicio', icon: 'home', end: true }],
  [ROLES.DOCENTE]: [{ to: '/', label: 'Inicio', icon: 'home', end: true }],
  [ROLES.ESTUDIANTE]: [{ to: '/', label: 'Inicio', icon: 'home', end: true }],
}

export function navFor(role) {
  return NAV_ITEMS[role] || []
}
