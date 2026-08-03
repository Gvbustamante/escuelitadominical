# Roles y permisos — CELM · La Cosecha

Cuatro roles fijos, jerarquía estricta, aislados por `institucion_id`. Esta tabla es el
contrato que implementan las políticas RLS en `supabase/schema.sql`; cualquier cambio de
regla de negocio debe actualizar ambos documentos a la vez.

## Jerarquía

```
administrador  (≈4 por instituto)
   └── lidera vía asignación → lider (≈6 por instituto, 1 diplomado cada uno)
          └── administra          → docente (varios por módulo)
                 └── enseña a     → estudiante (muchos)
```

Un perfil tiene **un solo rol**. El alcance de cada rol siempre está acotado por
`institucion_id` (RLS lo aplica de forma transversal): nadie ve datos de otro instituto, ni
siquiera el administrador.

## Administrador

Acceso total dentro de su instituto:
- CRUD de diplomados, líderes, docentes, estudiantes (usuarios en general).
- Asignar líderes a diplomados y docentes a módulos.
- Administrar biblioteca institucional, pagos, certificados, configuración, permisos y
  reportes/estadísticas globales del instituto.
- Puede ver y participar en comunicación con líderes y docentes.
- Puede crear tareas de gestión para cualquier miembro del staff.

## Líder

Acotado **exclusivamente a su propio diplomado** (`diplomados.lider_id = auth.uid()`):
- Administra todos los módulos, docentes y contenido de ese diplomado (y solo ese).
- Crea docentes — pero el docente creado queda disponible para ser asignado a módulos de
  *cualquier* diplomado por un administrador; el líder solo puede asignarlo a módulos de su
  propio diplomado.
- Asigna módulos, horarios, revisa tareas/asistencia/calificaciones, aprueba procesos
  académicos (publicar calificación final, aprobar retiro de estudiante, etc.).
- Comunicación con administrador y con los docentes de su diplomado.
- Nunca ve ni administra otro diplomado.

## Docente

Acotado a los módulos donde aparece en `modulo_docentes`:
- Crea clases (contenido de módulo): videos, PDF, diapositivas, recursos.
- Crea tareas y exámenes, califica, registra asistencia, sube evidencias de salón.
- Consulta mensajes (con administrador y con el líder del diplomado del módulo que enseña).
- No administra diplomados ni módulos que no le fueron asignados.

## Estudiante

Acotado a los diplomados donde tiene `matriculas.estado = 'activa'` (o `completada`, para
histórico de solo-lectura):
- Ve diplomados/módulos matriculados, descarga recursos.
- Sube tareas, presenta exámenes dentro de la ventana de disponibilidad.
- Consulta su propia asistencia, notas **publicadas**, pagos y estado de cuenta.
- Descarga sus certificados emitidos.
- No tiene acceso a comunicación institucional (no es un rol de staff) ni a datos de otros
  estudiantes.

## Comunicación institucional: pares permitidos

| Iniciador | Puede conversar con |
|---|---|
| administrador | líder, docente |
| líder | administrador, docente (solo docentes de su diplomado) |
| docente | administrador, líder (del diplomado del módulo que enseña) |
| estudiante | — (sin acceso al centro de comunicación) |

Implementado como función `public.puede_conversar(uid_a, uid_b)` reutilizada tanto en la
política RLS de `conversacion_participantes`/`mensajes` como en la validación de creación de
conversación en la UI.

## Matriz resumida de acciones por módulo

| Módulo | Administrador | Líder | Docente | Estudiante |
|---|---|---|---|---|
| Diplomados | CRUD (todos) | Editar el propio | Ver el propio | Ver los matriculados |
| Módulos | CRUD (todos) | CRUD (del propio diplomado) | Ver los asignados, editar contenido | Ver los matriculados |
| Usuarios | CRUD (todos) | Crear docentes; ver estudiantes de su diplomado | Ver su propio perfil | Ver su propio perfil |
| Matrícula | CRUD | Aprobar retiro/ingreso en su diplomado | — | Ver la propia |
| Recursos/Tareas/Exámenes | Ver todo | Ver/aprobar del propio diplomado | CRUD en sus módulos | Consumir/entregar |
| Asistencia | Ver todo | Ver/revisar del propio diplomado | Tomar en sus módulos | Ver la propia |
| Calificaciones | Ver todo | Aprobar publicación | Calificar y proponer | Ver publicadas propias |
| Evidencias | Ver todo | Ver del propio diplomado | Crear en sus módulos | — |
| Financiero | CRUD, aprobar | Ver del propio diplomado (solo lectura) | — | Ver propio estado de cuenta, subir comprobante |
| Comunicación | admin↔líder, admin↔docente | líder↔admin, líder↔docente(propio) | docente↔admin, docente↔líder(propio) | — |
| Tareas de gestión | Asignar/ver todas | Asignar/ver del propio diplomado | Ver/actualizar las propias | — |
| Biblioteca institucional | CRUD | Ver/descargar | Ver/descargar | Ver/descargar (si aplica) |
| Certificados | CRUD, emitir | Solicitar emisión de su diplomado | — | Ver/descargar los propios |
| Configuración/Permisos | CRUD | — | — | — |
| Reportes | Todos | Del propio diplomado | De sus módulos | Los propios |

## Principio de aplicación

Toda regla de esta tabla se implementa como política RLS en Postgres (nunca solo como
restricción de UI): el cliente puede ocultar botones, pero la base de datos es la que
garantiza el aislamiento. Las políticas usan funciones auxiliares `security definer` para
evitar recursión y para mantener la lógica de "pertenece a mi diplomado / mi módulo" en un
solo lugar (`es_lider_de_diplomado(diplomado_id)`, `es_docente_de_modulo(modulo_id)`,
`esta_matriculado(diplomado_id)`).
