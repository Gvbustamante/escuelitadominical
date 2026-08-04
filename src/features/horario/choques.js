import { minutosDeHora, horaLegible, DIAS_SEMANA } from '../../lib/fechas'

// Dos franjas se solapan si cada una empieza antes de que termine la otra. El caso de tocarse
// justo en el borde (una acaba 9:00 y la otra empieza 9:00) NO es choque: es una clase seguida.
function seSolapan(aIni, aFin, bIni, bFin) {
  return aIni < bFin && bIni < aFin
}

// Sin hora de fin no se puede medir el solape. En vez de ignorar el módulo —que dejaría
// choques sin detectar— se le supone una hora de duración, y se avisa aparte de que le falta
// el dato.
const DURACION_SUPUESTA = 60

function franja(modulo) {
  const inicio = minutosDeHora(modulo.hora_inicio)
  if (inicio == null) return null
  const fin = minutosDeHora(modulo.hora_fin)
  return { inicio, fin: fin != null && fin > inicio ? fin : inicio + DURACION_SUPUESTA }
}

// Dos módulos que existen en semanas distintas del año no chocan aunque coincidan en día y
// hora. Si a alguno le falta el rango, se asume que sí coinciden (es lo prudente: mejor un
// aviso de más que un choque real sin detectar).
function vigenciasSeCruzan(a, b) {
  if (!a.fecha_inicio || !a.fecha_fin || !b.fecha_inicio || !b.fecha_fin) return true
  return a.fecha_inicio <= b.fecha_fin && b.fecha_inicio <= a.fecha_fin
}

function mismoDiaYHora(a, b) {
  if (a.dia_semana == null || b.dia_semana == null) return false
  if (a.dia_semana !== b.dia_semana) return false
  const fa = franja(a)
  const fb = franja(b)
  if (!fa || !fb) return false
  return seSolapan(fa.inicio, fa.fin, fb.inicio, fb.fin) && vigenciasSeCruzan(a, b)
}

function cuando(modulo) {
  return `${DIAS_SEMANA[modulo.dia_semana]} ${horaLegible(modulo.hora_inicio)}${
    modulo.hora_fin ? `–${horaLegible(modulo.hora_fin)}` : ''
  }`
}

function docentesDe(modulo) {
  return (modulo.modulo_docentes || []).map((md) => md.docente).filter(Boolean)
}

// Devuelve la lista de problemas del horario, de más grave a menos.
export function detectarChoques(modulos, ocupacionExterna = []) {
  const problemas = []
  const conHorario = modulos.filter((m) => m.dia_semana != null && m.hora_inicio)

  for (let i = 0; i < conHorario.length; i++) {
    for (let j = i + 1; j < conHorario.length; j++) {
      const a = conHorario[i]
      const b = conHorario[j]
      if (!mismoDiaYHora(a, b)) continue

      if (a.salon && b.salon && a.salon.trim().toLowerCase() === b.salon.trim().toLowerCase()) {
        problemas.push({
          tipo: 'salon',
          gravedad: 'alta',
          titulo: `Salón ${a.salon} ocupado dos veces`,
          detalle: `«${a.nombre}» y «${b.nombre}» coinciden el ${cuando(a)}.`,
        })
      }

      const docentesA = docentesDe(a)
      const docentesB = docentesDe(b)
      for (const da of docentesA) {
        if (docentesB.some((db) => db.id === da.id)) {
          problemas.push({
            tipo: 'docente',
            gravedad: 'alta',
            titulo: `${da.nombre_completo} en dos módulos a la vez`,
            detalle: `«${a.nombre}» y «${b.nombre}», ambos el ${cuando(a)}.`,
          })
        }
      }
    }
  }

  // Choques contra otros diplomados: el líder no ve esos módulos, así que sin este aviso el
  // problema aparecería recién el día de la clase.
  for (const modulo of conHorario) {
    for (const docente of docentesDe(modulo)) {
      for (const externo of ocupacionExterna) {
        if (externo.docente_id !== docente.id) continue
        const otro = {
          dia_semana: externo.dia_semana,
          hora_inicio: externo.hora_inicio,
          hora_fin: externo.hora_fin,
          fecha_inicio: externo.fecha_inicio,
          fecha_fin: externo.fecha_fin,
        }
        if (!mismoDiaYHora(modulo, otro)) continue
        problemas.push({
          tipo: 'docente-externo',
          gravedad: 'alta',
          titulo: `${docente.nombre_completo} ya da clase a esa hora en otro diplomado`,
          detalle: `«${modulo.nombre}» choca con «${externo.modulo_nombre}» de ${externo.diplomado_nombre}, el ${cuando(modulo)}.`,
        })
      }
    }
  }

  for (const modulo of modulos) {
    if (modulo.dia_semana == null || !modulo.hora_inicio) {
      problemas.push({
        tipo: 'incompleto',
        gravedad: 'media',
        titulo: `«${modulo.nombre}» no tiene horario`,
        detalle: 'Sin día y hora no aparece en el calendario ni se puede comprobar si choca.',
      })
    } else if (!modulo.hora_fin) {
      problemas.push({
        tipo: 'incompleto',
        gravedad: 'baja',
        titulo: `«${modulo.nombre}» no tiene hora de fin`,
        detalle: 'Para revisar choques se le supone una hora de duración.',
      })
    }
    if (docentesDe(modulo).length === 0) {
      problemas.push({
        tipo: 'incompleto',
        gravedad: 'media',
        titulo: `«${modulo.nombre}» no tiene docente`,
        detalle: 'Asígnale al menos uno para que pueda subir contenido y calificar.',
      })
    }
  }

  const orden = { alta: 0, media: 1, baja: 2 }
  return problemas.sort((a, b) => orden[a.gravedad] - orden[b.gravedad])
}
