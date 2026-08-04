import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Icon from '../../../components/ui/Icon'
import Spinner from '../../../components/Spinner'
import {
  claveDia, diasDeRejillaMes, diasDeSemana, sumarDias, sumarMeses,
  etiquetaMes, etiquetaRangoSemana, finDeDia,
} from '../../../lib/fechas'
import { itemsDelCalendario } from '../api'
import { FUENTES } from '../fuentes'
import VistaMes from '../components/VistaMes'
import VistaSemana from '../components/VistaSemana'
import VistaAno from '../components/VistaAno'
import ListaDia from '../components/ListaDia'

const VISTAS = [
  { key: 'mes', label: 'Mes' },
  { key: 'semana', label: 'Semana' },
  { key: 'ano', label: 'Año' },
]

// El rango que hay que pedir a la base depende de la vista. Se calcula aparte de la pantalla
// para que sea evidente que la consulta cubre exactamente lo que se va a pintar (la vista de
// mes incluye los días de relleno de las semanas de los extremos, no solo el mes natural).
function rangoDeVista(vista, cursor) {
  if (vista === 'semana') {
    const dias = diasDeSemana(cursor)
    return [dias[0], finDeDia(dias[6])]
  }
  if (vista === 'ano') {
    const ano = cursor.getFullYear()
    return [new Date(ano, 0, 1), finDeDia(new Date(ano, 11, 31))]
  }
  const dias = diasDeRejillaMes(cursor)
  return [dias[0], finDeDia(dias[dias.length - 1])]
}

export default function Calendario() {
  const [vista, setVista] = useState('mes')
  const [cursor, setCursor] = useState(() => new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => claveDia(new Date()))
  const [items, setItems] = useState(null)

  const [desde, hasta] = useMemo(() => rangoDeVista(vista, cursor), [vista, cursor])

  const cargar = useCallback(async () => {
    setItems(null)
    setItems(await itemsDelCalendario(desde, hasta))
  }, [desde, hasta])

  useEffect(() => { cargar() }, [cargar])

  const porDia = useMemo(() => {
    const mapa = new Map()
    for (const item of items || []) {
      if (!mapa.has(item.dia)) mapa.set(item.dia, [])
      mapa.get(item.dia).push(item)
    }
    return mapa
  }, [items])

  function navegar(direccion) {
    if (vista === 'semana') setCursor((c) => sumarDias(c, 7 * direccion))
    else if (vista === 'ano') setCursor((c) => new Date(c.getFullYear() + direccion, 0, 1))
    else setCursor((c) => sumarMeses(c, direccion))
  }

  function irAHoy() {
    const hoy = new Date()
    setCursor(hoy)
    setDiaSeleccionado(claveDia(hoy))
  }

  const etiqueta =
    vista === 'semana' ? etiquetaRangoSemana(cursor)
      : vista === 'ano' ? String(cursor.getFullYear())
        : etiquetaMes(cursor)

  return (
    <div>
      <PageHeader
        title="Calendario"
        subtitle="Clases, entregas, exámenes, eventos y tareas administrativas en un solo lugar."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => navegar(-1)} className="btn-ghost !px-2" aria-label="Anterior">
            <Icon name="chevron-left" className="h-5 w-5" />
          </button>
          <button onClick={() => navegar(1)} className="btn-ghost !px-2" aria-label="Siguiente">
            <Icon name="chevron-right" className="h-5 w-5" />
          </button>
          <button onClick={irAHoy} className="btn-secondary !px-3 !py-1.5 text-xs">Hoy</button>
          <span className="ml-2 text-base font-semibold capitalize text-ink">{etiqueta}</span>
        </div>

        <div className="flex gap-1 rounded-md bg-slate-100 p-1">
          {VISTAS.map((v) => (
            <button
              key={v.key}
              onClick={() => setVista(v.key)}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                vista === v.key ? 'bg-surface-raised text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <Leyenda />

      {items === null ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-4">
          {vista === 'mes' && (
            <>
              <VistaMes
                cursor={cursor}
                porDia={porDia}
                diaSeleccionado={diaSeleccionado}
                onSeleccionar={setDiaSeleccionado}
              />
              <ListaDia dia={diaSeleccionado} items={porDia.get(diaSeleccionado) || []} />
            </>
          )}

          {vista === 'semana' && <VistaSemana cursor={cursor} porDia={porDia} />}

          {vista === 'ano' && (
            <VistaAno
              cursor={cursor}
              porDia={porDia}
              onAbrirMes={(fecha) => { setCursor(fecha); setVista('mes') }}
            />
          )}
        </div>
      )}
    </div>
  )
}

function Leyenda() {
  return (
    <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
      {Object.entries(FUENTES).map(([clave, fuente]) => (
        <span key={clave} className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
          <span className={`h-2.5 w-2.5 rounded-full ${fuente.punto}`} />
          {fuente.label}
        </span>
      ))}
      <span className="text-xs text-ink-faint">
        Los eventos se pintan con el color de su tipo.
      </span>
    </div>
  )
}
