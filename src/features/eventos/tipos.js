// Los colores se escriben como clases completas y literales (no `bg-${x}-500`) porque Tailwind
// analiza el código como texto: una clase construida en tiempo de ejecución no llega al CSS.
//
// La paleta es fija a propósito, no derivada del color de marca del instituto: el objetivo es
// distinguir categorías de un vistazo en el calendario, y eso se rompe si todas son tonos del
// mismo azul corporativo.
export const TIPOS_EVENTO = [
  { value: 'general', label: 'General', punto: 'bg-slate-500', chip: 'bg-slate-100 text-slate-700', barra: 'bg-slate-500', borde: 'border-slate-500' },
  { value: 'academico', label: 'Académico', punto: 'bg-sky-500', chip: 'bg-sky-100 text-sky-700', barra: 'bg-sky-500', borde: 'border-sky-500' },
  { value: 'espiritual', label: 'Espiritual', punto: 'bg-violet-500', chip: 'bg-violet-100 text-violet-700', barra: 'bg-violet-500', borde: 'border-violet-500' },
  { value: 'administrativo', label: 'Administrativo', punto: 'bg-amber-500', chip: 'bg-amber-100 text-amber-700', barra: 'bg-amber-500', borde: 'border-amber-500' },
  { value: 'social', label: 'Social', punto: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700', barra: 'bg-emerald-500', borde: 'border-emerald-500' },
]

const POR_VALOR = Object.fromEntries(TIPOS_EVENTO.map((t) => [t.value, t]))

export function tipoEvento(value) {
  return POR_VALOR[value] || POR_VALOR.general
}

export const VISIBILIDADES = [
  { value: 'todos', label: 'Todo el instituto' },
  { value: 'staff', label: 'Solo el equipo (sin estudiantes)' },
]
