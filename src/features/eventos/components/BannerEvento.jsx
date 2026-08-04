import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatoFecha, formatoHora } from '../../../lib/fechas'
import { obtenerEventoDestacado } from '../api'

// Banner del evento destacado en la pantalla de inicio. Si no hay evento destacado, o si el
// que hay no es visible para este rol, la consulta devuelve null por RLS y el banner
// simplemente no se pinta — no ocupa espacio ni muestra un hueco.
export default function BannerEvento() {
  const [evento, setEvento] = useState(null)

  useEffect(() => {
    obtenerEventoDestacado()
      .then(setEvento)
      .catch((err) => console.error('No se pudo cargar el evento destacado:', err))
  }, [])

  if (!evento) return null

  return (
    <Link to="/agenda" className="card-link block overflow-hidden !p-0">
      {evento.imagen_url ? (
        <img src={evento.imagen_url} alt={evento.titulo} className="block max-h-80 w-full object-cover" />
      ) : null}

      <div className="p-5">
        <h2 className="text-lg font-semibold text-ink">{evento.titulo}</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {formatoFecha(evento.fecha_inicio)}
          {!evento.todo_el_dia && ` · ${formatoHora(evento.fecha_inicio)}`}
          {evento.lugar && ` · ${evento.lugar}`}
        </p>
        {evento.descripcion && (
          <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-ink-soft">{evento.descripcion}</p>
        )}
      </div>
    </Link>
  )
}
