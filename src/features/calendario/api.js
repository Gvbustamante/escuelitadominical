import { supabase } from '../../lib/supabaseClient'
import { claveDia, inicioDeDia, minutosDeHora, horaLegible } from '../../lib/fechas'
import { tipoEvento } from '../eventos/tipos'

// El calendario no tiene tabla propia: agrega lo que ya existe (eventos, clases, entregas,
// exámenes, tareas administrativas) en una lista uniforme de items. No hace falta filtrar por
// rol en el cliente — la RLS ya devuelve solo lo que cada quien puede ver, así que un
// estudiante recibe las clases de sus módulos y cero tareas administrativas con este mismo
// código. Las consultas fallidas de una fuente no deben tumbar el calendario entero, así que
// se resuelven en paralelo y cada una degrada a lista vacía.
export async function itemsDelCalendario(desde, hasta) {
  const desdeISO = inicioDeDia(desde).toISOString()
  const hastaISO = new Date(hasta).toISOString()
  const desdeDia = claveDia(desde)
  const hastaDia = claveDia(hasta)

  const [eventos, clases, tareas, examenes, gestion] = await Promise.all([
    cargarEventos(desdeISO, hastaISO),
    cargarClases(desdeDia, hastaDia),
    cargarTareas(desdeISO, hastaISO),
    cargarExamenes(desdeISO, hastaISO),
    cargarTareasGestion(desdeDia, hastaDia),
  ])

  return [...eventos, ...clases, ...tareas, ...examenes, ...gestion].sort(comparar)
}

// Orden dentro de un día: primero lo que tiene hora, por hora; los de todo el día al final.
function comparar(a, b) {
  if (a.dia !== b.dia) return a.dia < b.dia ? -1 : 1
  const ma = a.minutos ?? 24 * 60
  const mb = b.minutos ?? 24 * 60
  return ma - mb
}

async function seguro(promesa, etiqueta) {
  try {
    const { data, error } = await promesa
    if (error) throw error
    return data || []
  } catch (err) {
    console.error(`Calendario: no se pudo cargar ${etiqueta}`, err)
    return []
  }
}

async function cargarEventos(desdeISO, hastaISO) {
  const data = await seguro(
    supabase
      .from('eventos')
      .select('id, titulo, tipo, fecha_inicio, fecha_fin, todo_el_dia, lugar')
      .gte('fecha_inicio', desdeISO)
      .lte('fecha_inicio', hastaISO),
    'los eventos',
  )
  return data.map((e) => {
    const fecha = new Date(e.fecha_inicio)
    return {
      id: `evento-${e.id}`,
      fuente: 'evento',
      estiloTipo: tipoEvento(e.tipo),
      titulo: e.titulo,
      detalle: e.lugar || tipoEvento(e.tipo).label,
      dia: claveDia(fecha),
      minutos: e.todo_el_dia ? null : fecha.getHours() * 60 + fecha.getMinutes(),
      hora: e.todo_el_dia ? null : fecha,
      enlace: '/agenda',
    }
  })
}

// Las clases no están almacenadas fecha por fecha: el módulo guarda un día de la semana y una
// hora, vigentes entre fecha_inicio y fecha_fin. Se expanden aquí a las ocurrencias que caen
// dentro del rango que se está mirando.
async function cargarClases(desdeDia, hastaDia) {
  const data = await seguro(
    supabase
      .from('modulos')
      .select('id, nombre, salon, dia_semana, hora_inicio, hora_fin, fecha_inicio, fecha_fin')
      .not('dia_semana', 'is', null),
    'las clases',
  )

  const items = []
  for (const modulo of data) {
    const desde = maxClave(desdeDia, modulo.fecha_inicio)
    const hasta = minClave(hastaDia, modulo.fecha_fin)
    if (desde > hasta) continue

    for (const dia of diasConDiaSemana(desde, hasta, modulo.dia_semana)) {
      items.push({
        id: `clase-${modulo.id}-${dia}`,
        fuente: 'clase',
        titulo: modulo.nombre,
        detalle: [horaLegible(modulo.hora_inicio), modulo.salon].filter(Boolean).join(' · ') || 'Clase',
        dia,
        minutos: minutosDeHora(modulo.hora_inicio),
        enlace: `/modulos/${modulo.id}`,
      })
    }
  }
  return items
}

// Recorre día a día en vez de saltar de 7 en 7: el rango de una vista nunca pasa de ~370 días,
// así que la simplicidad gana sobre el ahorro de iteraciones.
function diasConDiaSemana(desdeDia, hastaDia, diaSemana) {
  const dias = []
  const fin = new Date(`${hastaDia}T00:00:00`)
  let cursor = new Date(`${desdeDia}T00:00:00`)
  while (cursor <= fin) {
    if (cursor.getDay() === diaSemana) dias.push(claveDia(cursor))
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
  }
  return dias
}

function maxClave(a, b) {
  if (!b) return a
  return a > b ? a : b
}

function minClave(a, b) {
  if (!b) return a
  return a < b ? a : b
}

async function cargarTareas(desdeISO, hastaISO) {
  const data = await seguro(
    supabase
      .from('tareas_academicas')
      .select('id, titulo, fecha_limite, modulo:modulos (id, nombre)')
      .not('fecha_limite', 'is', null)
      .gte('fecha_limite', desdeISO)
      .lte('fecha_limite', hastaISO),
    'las entregas de tarea',
  )
  return data.map((t) => {
    const fecha = new Date(t.fecha_limite)
    return {
      id: `tarea-${t.id}`,
      fuente: 'tarea',
      titulo: t.titulo,
      detalle: `Entrega · ${t.modulo?.nombre || ''}`.trim(),
      dia: claveDia(fecha),
      minutos: fecha.getHours() * 60 + fecha.getMinutes(),
      hora: fecha,
      enlace: t.modulo ? `/modulos/${t.modulo.id}` : null,
    }
  })
}

async function cargarExamenes(desdeISO, hastaISO) {
  const data = await seguro(
    supabase
      .from('examenes')
      .select('id, titulo, fecha_disponible_hasta, modulo:modulos (id, nombre)')
      .not('fecha_disponible_hasta', 'is', null)
      .gte('fecha_disponible_hasta', desdeISO)
      .lte('fecha_disponible_hasta', hastaISO),
    'los exámenes',
  )
  return data.map((e) => {
    const fecha = new Date(e.fecha_disponible_hasta)
    return {
      id: `examen-${e.id}`,
      fuente: 'examen',
      titulo: e.titulo,
      detalle: `Cierra · ${e.modulo?.nombre || ''}`.trim(),
      dia: claveDia(fecha),
      minutos: fecha.getHours() * 60 + fecha.getMinutes(),
      hora: fecha,
      enlace: e.modulo ? `/modulos/${e.modulo.id}` : null,
    }
  })
}

async function cargarTareasGestion(desdeDia, hastaDia) {
  const data = await seguro(
    supabase
      .from('tareas_gestion')
      .select('id, titulo, fecha_limite, estado')
      .not('fecha_limite', 'is', null)
      .gte('fecha_limite', desdeDia)
      .lte('fecha_limite', hastaDia),
    'las tareas administrativas',
  )
  return data.map((t) => ({
    id: `gestion-${t.id}`,
    fuente: 'gestion',
    titulo: t.titulo,
    detalle: 'Tarea administrativa',
    dia: t.fecha_limite,
    minutos: null,
    enlace: '/tareas-gestion',
  }))
}
