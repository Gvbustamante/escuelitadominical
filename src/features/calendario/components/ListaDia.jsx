import { Link } from 'react-router-dom'
import { formatoFecha, formatoHora } from '../../../lib/fechas'
import { estiloDeItem } from '../fuentes'

export default function ListaDia({ dia, items }) {
  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-ink">{formatoFecha(dia)}</h3>

      {items.length === 0 ? (
        <p className="text-sm text-ink-faint">Nada programado para este día.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const estilo = estiloDeItem(item)
            const contenido = (
              <>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${estilo.punto}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{item.titulo}</span>
                  <span className="block truncate text-xs text-ink-soft">
                    {item.hora ? `${formatoHora(item.hora)} · ` : ''}
                    {item.detalle}
                  </span>
                </span>
              </>
            )

            return (
              <li key={item.id}>
                {item.enlace ? (
                  <Link to={item.enlace} className="flex gap-2 rounded-md p-2 transition-colors hover:bg-slate-50">
                    {contenido}
                  </Link>
                ) : (
                  <div className="flex gap-2 p-2">{contenido}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
