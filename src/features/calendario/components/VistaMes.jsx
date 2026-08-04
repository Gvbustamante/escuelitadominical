import { claveDia, diasDeRejillaMes, esDelMes, esHoy, DIAS_SEMANA_CORTO_LUNES } from '../../../lib/fechas'
import { estiloDeItem } from '../fuentes'

const MAX_VISIBLES = 3

export default function VistaMes({ cursor, porDia, diaSeleccionado, onSeleccionar }) {
  const dias = diasDeRejillaMes(cursor)

  return (
    <div className="card overflow-hidden !p-0">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {DIAS_SEMANA_CORTO_LUNES.map((d) => (
          <div key={d} className="px-1 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {dias.map((dia) => {
          const clave = claveDia(dia)
          const items = porDia.get(clave) || []
          const delMes = esDelMes(dia, cursor)
          const seleccionado = clave === diaSeleccionado

          return (
            <button
              key={clave}
              onClick={() => onSeleccionar(clave)}
              className={`flex min-h-[4.5rem] flex-col gap-1 border-b border-r border-slate-100 p-1.5 text-left transition-colors sm:min-h-[6rem] ${
                delMes ? 'bg-surface-raised' : 'bg-slate-50/60'
              } ${seleccionado ? 'ring-2 ring-inset ring-brand' : 'hover:bg-slate-50'}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  esHoy(dia) ? 'bg-brand text-white' : delMes ? 'text-ink' : 'text-ink-faint'
                }`}
              >
                {dia.getDate()}
              </span>

              {/* En teléfono no cabe el título: se muestran puntos de color, que ya comunican
                  qué tipo de cosas hay ese día. Desde sm se pintan las barras con texto. */}
              <span className="flex flex-wrap gap-1 sm:hidden">
                {items.slice(0, 4).map((item) => (
                  <span key={item.id} className={`h-1.5 w-1.5 rounded-full ${estiloDeItem(item).punto}`} />
                ))}
              </span>

              <span className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                {items.slice(0, MAX_VISIBLES).map((item) => (
                  <span
                    key={item.id}
                    className={`truncate rounded px-1 py-0.5 text-[11px] font-medium text-white ${estiloDeItem(item).barra}`}
                    title={item.titulo}
                  >
                    {item.titulo}
                  </span>
                ))}
                {items.length > MAX_VISIBLES && (
                  <span className="px-1 text-[11px] font-medium text-ink-soft">
                    +{items.length - MAX_VISIBLES} más
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
