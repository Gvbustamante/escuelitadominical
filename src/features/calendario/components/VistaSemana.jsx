import { Link } from 'react-router-dom'
import { claveDia, diasDeSemana, esHoy, formatoHora, DIAS_SEMANA_CORTO } from '../../../lib/fechas'
import { estiloDeItem } from '../fuentes'

// Columnas por día con la lista de lo que ocurre, en vez de una rejilla de horas: los items
// del calendario vienen de fuentes que en su mayoría son hitos (una entrega vence, un examen
// cierra), no bloques con duración, así que una rejilla horaria mostraría mucho vacío.
export default function VistaSemana({ cursor, porDia }) {
  const dias = diasDeSemana(cursor)

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {dias.map((dia) => {
        const clave = claveDia(dia)
        const items = porDia.get(clave) || []
        const hoy = esHoy(dia)

        return (
          <div key={clave} className={`card !p-3 ${hoy ? 'ring-2 ring-inset ring-brand' : ''}`}>
            <div className="mb-2 flex items-baseline gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {DIAS_SEMANA_CORTO[dia.getDay()]}
              </span>
              <span className={`text-lg font-semibold ${hoy ? 'text-brand' : 'text-ink'}`}>{dia.getDate()}</span>
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-ink-faint">—</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {items.map((item) => {
                  const estilo = estiloDeItem(item)
                  const cuerpo = (
                    <span className={`block rounded-md border-l-4 bg-slate-50 px-2 py-1.5 ${estilo.borde}`}>
                      <span className="block truncate text-xs font-medium text-ink">{item.titulo}</span>
                      <span className="block truncate text-[11px] text-ink-soft">
                        {item.hora ? `${formatoHora(item.hora)} · ` : ''}
                        {item.detalle}
                      </span>
                    </span>
                  )
                  return (
                    <li key={item.id}>
                      {item.enlace ? <Link to={item.enlace}>{cuerpo}</Link> : cuerpo}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
