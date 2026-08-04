import { claveDia, diasDeRejillaMes, esDelMes, esHoy, MESES, DIAS_SEMANA_CORTO_LUNES } from '../../../lib/fechas'
import { estiloDeItem } from '../fuentes'

// Doce mini-meses. Cada día con actividad se pinta con el color del primer item de ese día;
// si hay más de uno se agrega un contorno para que se note que hay varias cosas sin llenar la
// celda de puntos ilegibles a este tamaño.
export default function VistaAno({ cursor, porDia, onAbrirMes }) {
  const ano = cursor.getFullYear()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {MESES.map((nombre, indice) => (
        <MiniMes
          key={nombre}
          fecha={new Date(ano, indice, 1)}
          nombre={nombre}
          porDia={porDia}
          onAbrir={() => onAbrirMes(new Date(ano, indice, 1))}
        />
      ))}
    </div>
  )
}

function MiniMes({ fecha, nombre, porDia, onAbrir }) {
  const dias = diasDeRejillaMes(fecha)

  return (
    <button onClick={onAbrir} className="card-link !p-3 text-left">
      <h3 className="mb-2 text-sm font-semibold text-ink">{nombre}</h3>

      <div className="grid grid-cols-7 gap-px">
        {DIAS_SEMANA_CORTO_LUNES.map((d) => (
          <span key={d} className="text-center text-[10px] font-medium text-ink-faint">
            {d.charAt(0)}
          </span>
        ))}

        {dias.map((dia) => {
          const clave = claveDia(dia)
          const items = porDia.get(clave) || []
          const delMes = esDelMes(dia, fecha)

          if (!delMes) return <span key={clave} />

          const estilo = items.length > 0 ? estiloDeItem(items[0]) : null

          return (
            <span
              key={clave}
              title={items.length > 0 ? `${dia.getDate()}: ${items.length} en agenda` : undefined}
              className={`flex aspect-square items-center justify-center rounded-[3px] text-[10px] font-medium ${
                estilo ? `${estilo.barra} text-white` : 'text-ink-soft'
              } ${esHoy(dia) ? 'ring-1 ring-brand ring-offset-1' : ''} ${
                items.length > 1 ? 'outline outline-1 outline-offset-[-2px] outline-white/60' : ''
              }`}
            >
              {dia.getDate()}
            </span>
          )
        })}
      </div>
    </button>
  )
}
