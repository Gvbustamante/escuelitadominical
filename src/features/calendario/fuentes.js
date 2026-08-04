// Cada fuente del calendario tiene su color fijo, igual que TIPOS_EVENTO: el punto de tener
// colores es distinguir de un vistazo qué es cada cosa en la rejilla del mes. Las clases se
// escriben completas y literales (nunca construidas con plantillas ni con .replace()) porque
// Tailwind analiza el código como texto y una clase armada en tiempo de ejecución no llega
// nunca al CSS generado.
export const FUENTES = {
  evento: { label: 'Eventos', barra: 'bg-slate-500', punto: 'bg-slate-500', borde: 'border-slate-500', chip: 'bg-slate-100 text-slate-700' },
  clase: { label: 'Clases', barra: 'bg-sky-500', punto: 'bg-sky-500', borde: 'border-sky-500', chip: 'bg-sky-100 text-sky-700' },
  tarea: { label: 'Entregas de tarea', barra: 'bg-amber-500', punto: 'bg-amber-500', borde: 'border-amber-500', chip: 'bg-amber-100 text-amber-700' },
  examen: { label: 'Exámenes', barra: 'bg-rose-500', punto: 'bg-rose-500', borde: 'border-rose-500', chip: 'bg-rose-100 text-rose-700' },
  gestion: { label: 'Tareas administrativas', barra: 'bg-violet-500', punto: 'bg-violet-500', borde: 'border-violet-500', chip: 'bg-violet-100 text-violet-700' },
}

// Los eventos usan el color de su tipo (no el gris genérico de la fuente), porque dentro de
// "eventos" ya hay categorías propias que el usuario configuró.
export function estiloDeItem(item) {
  return item.fuente === 'evento' && item.estiloTipo ? item.estiloTipo : FUENTES[item.fuente]
}
