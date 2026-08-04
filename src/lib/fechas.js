// Utilidades de fecha para el calendario y la agenda. Se resuelven con Date nativo en vez de
// agregar una librería: lo que necesita el producto (rejilla de mes, semana, año y formateo en
// español) son unas pocas funciones puras, y el navegador ya trae Intl para los nombres.

// Convención de dia_semana en la base (columna modulos.dia_semana): igual que Date#getDay(),
// 0 = domingo. Vive aquí para que no se redefina en cada pantalla que la necesite.
export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const DIAS_SEMANA_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// Las semanas del calendario empiezan en lunes (uso hispanohablante), aunque getDay() empiece
// en domingo. Este desplazamiento es el único lugar donde se traduce entre ambas convenciones.
const INICIO_SEMANA = 1 // lunes
export const DIAS_SEMANA_CORTO_LUNES = [1, 2, 3, 4, 5, 6, 0].map((d) => DIAS_SEMANA_CORTO[d])

export function aFecha(valor) {
  return valor instanceof Date ? valor : new Date(valor)
}

// Clave YYYY-MM-DD en hora LOCAL. No se usa toISOString(): eso convierte a UTC y en zonas con
// offset negativo devuelve el día anterior, que es exactamente el bug clásico de calendarios.
export function claveDia(valor) {
  const d = aFecha(valor)
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function mismoDia(a, b) {
  return claveDia(a) === claveDia(b)
}

export function esHoy(valor) {
  return mismoDia(valor, new Date())
}

export function sumarDias(valor, n) {
  const d = aFecha(valor)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

export function sumarMeses(valor, n) {
  const d = aFecha(valor)
  // Día 1 evita el desbordamiento de "31 de enero + 1 mes" (que daría 2 o 3 de marzo).
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

export function inicioDeDia(valor) {
  const d = aFecha(valor)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function finDeDia(valor) {
  const d = aFecha(valor)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

export function inicioDeMes(valor) {
  const d = aFecha(valor)
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function finDeMes(valor) {
  const d = aFecha(valor)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function inicioDeSemana(valor) {
  const d = inicioDeDia(valor)
  const desplazamiento = (d.getDay() - INICIO_SEMANA + 7) % 7
  return sumarDias(d, -desplazamiento)
}

export function diasDeSemana(valor) {
  const inicio = inicioDeSemana(valor)
  return Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i))
}

// Rejilla del mes: siempre semanas completas de lunes a domingo, incluyendo los días de
// relleno del mes anterior y siguiente para que la cuadrícula no quede dentada.
export function diasDeRejillaMes(valor) {
  const inicio = inicioDeSemana(inicioDeMes(valor))
  const finMes = finDeMes(valor)
  const dias = []
  let cursor = inicio
  while (cursor <= finMes || dias.length % 7 !== 0) {
    dias.push(cursor)
    cursor = sumarDias(cursor, 1)
  }
  return dias
}

export function esDelMes(valor, referencia) {
  const d = aFecha(valor)
  const r = aFecha(referencia)
  return d.getMonth() === r.getMonth() && d.getFullYear() === r.getFullYear()
}

export function formatoHora(valor) {
  return aFecha(valor).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

export function formatoFecha(valor) {
  return aFecha(valor).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatoFechaCorta(valor) {
  return aFecha(valor).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export function formatoFechaHora(valor) {
  return `${formatoFecha(valor)}, ${formatoHora(valor)}`
}

export function etiquetaMes(valor) {
  const d = aFecha(valor)
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function etiquetaRangoSemana(valor) {
  const dias = diasDeSemana(valor)
  const primero = dias[0]
  const ultimo = dias[6]
  if (primero.getMonth() === ultimo.getMonth()) {
    return `${primero.getDate()} – ${ultimo.getDate()} de ${MESES[primero.getMonth()]} ${primero.getFullYear()}`
  }
  return `${formatoFechaCorta(primero)} – ${formatoFechaCorta(ultimo)} ${ultimo.getFullYear()}`
}

// Valor para un <input type="datetime-local">, que espera hora local sin zona.
export function paraInputDateTime(valor) {
  if (!valor) return ''
  const d = aFecha(valor)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${claveDia(d)}T${hh}:${mm}`
}

// "14:30:00" (columna time de Postgres) → minutos desde medianoche, para ordenar y posicionar.
export function minutosDeHora(hora) {
  if (!hora) return null
  const [h, m] = hora.split(':')
  return Number(h) * 60 + Number(m)
}

export function horaLegible(hora) {
  if (!hora) return null
  return hora.slice(0, 5)
}
