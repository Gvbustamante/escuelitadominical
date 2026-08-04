import { ROLES } from '../../lib/roles'

// El contenido de la ayuda vive aquí como datos, separado de la pantalla que lo pinta, para
// que actualizar un texto o agregar un paso no obligue a tocar JSX.

// Checklist de puesta en marcha del administrador. El orden importa: hay dependencias reales
// (no se puede asignar un docente a un módulo inexistente, ni matricular en un diplomado sin
// crear), así que los pasos van en el orden en que hay que ejecutarlos.
export function pasosAdministrador(e) {
  return [
    {
      id: 'diplomado',
      titulo: 'Crea tu primer diplomado',
      descripcion:
        'El diplomado es el contenedor de todo lo demás: módulos, docentes, estudiantes y certificados cuelgan de él.',
      listo: e.diplomados > 0,
      resumen: e.diplomados > 0 ? `${e.diplomados} creado(s)` : null,
      to: '/diplomados/nuevo',
      cta: 'Crear diplomado',
    },
    {
      id: 'modulos',
      titulo: 'Agrega los módulos del diplomado',
      descripcion:
        'Un diplomado normalmente son 6 o 7 módulos secuenciales. Entra al diplomado y créalos desde la pestaña "Módulos".',
      listo: e.modulos > 0,
      resumen: e.modulos > 0 ? `${e.modulos} módulo(s)` : null,
      to: '/diplomados',
      cta: 'Ir a diplomados',
    },
    {
      id: 'lideres',
      titulo: 'Invita a los líderes',
      descripcion:
        'Cada líder dirige un solo diplomado. Al crearlo recibes una contraseña temporal que debes entregarle por un canal seguro.',
      listo: e.lideres > 0,
      resumen: e.lideres > 0 ? `${e.lideres} líder(es)` : null,
      to: '/usuarios',
      cta: 'Invitar usuario',
    },
    {
      id: 'asignar-lider',
      titulo: 'Asigna un líder a cada diplomado',
      descripcion:
        'Sin líder asignado, el diplomado no le aparece a nadie más que a ti. Se asigna editando el diplomado.',
      listo: e.diplomados > 0 && e.diplomadosSinLider === 0,
      resumen:
        e.diplomadosSinLider > 0 ? `${e.diplomadosSinLider} diplomado(s) sin líder` : null,
      to: '/diplomados',
      cta: 'Ir a diplomados',
    },
    {
      id: 'docentes',
      titulo: 'Invita a los docentes',
      descripcion:
        'Los docentes entran con su documento de identidad y el código del instituto, no necesitan correo electrónico.',
      listo: e.docentes > 0,
      resumen: e.docentes > 0 ? `${e.docentes} docente(s)` : null,
      to: '/usuarios',
      cta: 'Invitar usuario',
    },
    {
      id: 'asignar-docentes',
      titulo: 'Asigna los docentes a sus módulos',
      descripcion:
        'Un docente solo ve los módulos donde está asignado. La asignación se hace dentro de cada módulo.',
      listo: e.asignacionesDocente > 0,
      resumen: e.asignacionesDocente > 0 ? `${e.asignacionesDocente} asignación(es)` : null,
      to: '/diplomados',
      cta: 'Ir a diplomados',
    },
    {
      id: 'estudiantes',
      titulo: 'Invita a los estudiantes',
      descripcion: 'Igual que los docentes: entran con documento de identidad y código del instituto.',
      listo: e.estudiantes > 0,
      resumen: e.estudiantes > 0 ? `${e.estudiantes} estudiante(s)` : null,
      to: '/usuarios',
      cta: 'Invitar usuario',
    },
    {
      id: 'matriculas',
      titulo: 'Matricula a los estudiantes',
      descripcion:
        'La matrícula es por diplomado completo: el estudiante queda con acceso a todos sus módulos automáticamente.',
      listo: e.matriculas > 0,
      resumen: e.matriculas > 0 ? `${e.matriculas} matrícula(s)` : null,
      to: '/diplomados',
      cta: 'Ir a diplomados',
    },
    {
      id: 'conceptos',
      titulo: 'Define los conceptos de pago',
      descripcion:
        'Matrícula, mensualidad, derechos de grado. Sin conceptos definidos, los estudiantes no pueden reportar pagos.',
      listo: e.conceptosPago > 0,
      resumen: e.conceptosPago > 0 ? `${e.conceptosPago} concepto(s)` : null,
      to: '/financiero',
      cta: 'Ir a Financiero',
      nota: 'Pestaña "Conceptos".',
    },
    {
      id: 'plantilla',
      titulo: 'Crea una plantilla de certificado',
      descripcion:
        'Define una vez el texto del diploma y se reutiliza en cada emisión, con código QR de verificación pública.',
      listo: e.plantillasCertificado > 0,
      resumen: e.plantillasCertificado > 0 ? `${e.plantillasCertificado} plantilla(s)` : null,
      to: '/certificados',
      cta: 'Ir a Certificados',
      nota: 'Pestaña "Plantillas".',
    },
    {
      id: 'biblioteca',
      titulo: 'Carga los documentos institucionales',
      descripcion:
        'Reglamentos, formatos, logos y manuales, organizados por categoría y visibles para todo el instituto.',
      listo: e.recursosBiblioteca > 0,
      resumen: e.recursosBiblioteca > 0 ? `${e.recursosBiblioteca} recurso(s)` : null,
      opcional: true,
      to: '/biblioteca',
      cta: 'Ir a Biblioteca',
    },
  ]
}

// Guías de uso para los roles que no configuran el instituto: lo usan. No llevan checklist
// porque no hay un "terminado" — son referencia de qué se hace y dónde.
export const GUIAS = {
  [ROLES.LIDER]: {
    intro:
      'Diriges un diplomado completo: sus módulos, sus docentes y el seguimiento académico de sus estudiantes. No ves ni administras otros diplomados.',
    pasos: [
      {
        titulo: 'Revisa tu diplomado',
        detalle:
          'En "Mi diplomado" está todo lo tuyo: módulos, estudiantes matriculados y el estado general.',
        to: '/diplomados',
        cta: 'Mi diplomado',
      },
      {
        titulo: 'Crea y organiza los módulos',
        detalle:
          'Desde el diplomado, pestaña "Módulos". Cada módulo lleva su horario, salón y fechas límite.',
      },
      {
        titulo: 'Crea las cuentas de tus docentes',
        detalle:
          'Puedes crear docentes directamente. Al crearlos recibes una contraseña temporal para entregarles.',
      },
      {
        titulo: 'Asigna cada docente a sus módulos',
        detalle:
          'Un docente solo ve los módulos donde lo asignaste. Puedes asignar varios docentes al mismo módulo (titular y de apoyo).',
      },
      {
        titulo: 'Haz seguimiento del avance',
        detalle:
          'Tu pantalla de Inicio muestra entregas por calificar y exámenes por revisar de todo tu diplomado.',
        to: '/',
        cta: 'Ir a Inicio',
      },
      {
        titulo: 'Comunícate con administración y tus docentes',
        detalle:
          'El centro de comunicación es solo para el equipo: administrador y los docentes de tu diplomado. No incluye estudiantes.',
        to: '/comunicacion',
        cta: 'Abrir comunicación',
      },
      {
        titulo: 'Solicita los certificados al terminar',
        detalle:
          'Cuando un estudiante completa el diplomado, desde "Certificados" pides su emisión al administrador.',
        to: '/certificados',
        cta: 'Ver certificados',
      },
    ],
  },

  [ROLES.DOCENTE]: {
    intro:
      'Tu trabajo pasa por los módulos que te asignaron. Puedes tener módulos de distintos diplomados, pero nunca administras un diplomado completo.',
    pasos: [
      {
        titulo: 'Entra a tus módulos desde Inicio',
        detalle:
          'Tus módulos no están en el menú lateral: se llega a ellos desde la pantalla de Inicio. Ahí está todo lo que enseñas.',
        to: '/',
        cta: 'Ir a Inicio',
      },
      {
        titulo: 'Sube el contenido de tus clases',
        detalle:
          'Dentro del módulo, en "Recursos": PDF, diapositivas, videos y enlaces para tus estudiantes.',
      },
      {
        titulo: 'Crea tareas y exámenes',
        detalle:
          'Las tareas llevan fecha límite; los exámenes tienen ventana de disponibilidad y se califican solos, salvo las preguntas abiertas.',
      },
      {
        titulo: 'Registra la asistencia de cada sesión',
        detalle: 'Se toma por sesión dentro del módulo y queda disponible para el líder y administración.',
      },
      {
        titulo: 'Califica entregas y exámenes',
        detalle:
          'Las notas quedan como propuesta hasta que se publican, así puedes revisarlas antes de que el estudiante las vea.',
      },
      {
        titulo: 'Sube las evidencias del salón',
        detalle:
          'Registra el estado del aula antes y después de la clase con fotos. Es tu respaldo del uso del espacio.',
      },
      {
        titulo: 'Revisa tus mensajes y tareas administrativas',
        detalle:
          '"Comunicación" es para hablar con administración y con el líder de tu diplomado. "Tareas" son encargos administrativos que te asignan, distintos de las tareas académicas.',
        to: '/tareas-gestion',
        cta: 'Ver mis tareas',
      },
    ],
  },

  [ROLES.ESTUDIANTE]: {
    intro:
      'Aquí encuentras tus diplomados, tus entregas, tus notas, tu estado de cuenta y tus certificados.',
    pasos: [
      {
        titulo: 'Entra a tus diplomados',
        detalle:
          'En "Mis diplomados" están los módulos en los que estás matriculado, con su contenido y su docente.',
        to: '/diplomados',
        cta: 'Mis diplomados',
      },
      {
        titulo: 'Descarga el material de estudio',
        detalle: 'Cada módulo tiene sus recursos: PDF, diapositivas, videos y enlaces que sube el docente.',
      },
      {
        titulo: 'Entrega tus tareas a tiempo',
        detalle:
          'Puedes subir tu archivo y reemplazarlo cuantas veces quieras mientras no esté calificada y no haya pasado la fecha límite.',
      },
      {
        titulo: 'Presenta los exámenes en su ventana',
        detalle:
          'Cada examen se abre y se cierra en una fecha. Fuera de esa ventana ya no se puede presentar.',
      },
      {
        titulo: 'Consulta tus notas y tu asistencia',
        detalle:
          'Ves tus notas cuando el docente las publica, y tu asistencia registrada módulo por módulo.',
      },
      {
        titulo: 'Reporta tus pagos',
        detalle:
          'En "Mis pagos" registras el pago y subes el comprobante. Administración lo revisa y lo aprueba.',
        to: '/mis-pagos',
        cta: 'Ir a mis pagos',
      },
      {
        titulo: 'Descarga tus certificados',
        detalle:
          'Al terminar un diplomado y emitirse el certificado, aparece en "Certificados" con su código QR de verificación.',
        to: '/certificados',
        cta: 'Ver certificados',
      },
    ],
  },
}

// Aplica a los cuatro roles.
export const NOTAS_COMUNES = [
  {
    titulo: '¿Cómo inicio sesión?',
    detalle:
      'Con el código de tu instituto, tu documento de identidad (o tu correo, si eres administrador) y tu contraseña.',
  },
  {
    titulo: '¿Cómo cambio mi contraseña?',
    detalle:
      'Con el botón "Contraseña" al final del menú lateral. En el teléfono está dentro de "Más".',
  },
  {
    titulo: 'Olvidé mi contraseña',
    detalle:
      'Pide al administrador de tu instituto que te genere una nueva. Por seguridad nadie puede ver la contraseña actual, solo reemplazarla.',
  },
]
