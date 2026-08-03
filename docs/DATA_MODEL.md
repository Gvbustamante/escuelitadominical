# Modelo de datos — CELM · La Cosecha

Fuente de verdad ejecutable: `supabase/schema.sql`. Este documento es el mapa de lectura.
Todas las tablas de negocio llevan `institucion_id` (aislamiento multi-tenant) salvo donde se
indique lo contrario.

## 1. Tenancy e identidad

- **instituciones** — un registro por instituto bíblico cliente. `slug`, `nombre`, `logo_url`,
  `color_primario`, `color_secundario`, `plan`, `activo`.
- **profiles** (1:1 con `auth.users`) — `institucion_id`, `role` (`administrador|lider|docente|estudiante`),
  `nombre_completo`, `documento_identidad`, `email`, `telefono`, `avatar_url`, `activo`.

## 2. Estructura académica

- **diplomados** — `institucion_id`, `nombre`, `descripcion`, `lider_id` (único → un líder
  lidera a lo más un diplomado), `estado` (`planificacion|activo|finalizado|archivado`),
  `fecha_inicio`, `fecha_fin`, `reglamento_url`, `plantilla_institucional_url`.
- **modulos** — pertenece a un `diplomado_id`. `nombre`, `salon`, `dia_semana`, `hora_inicio`,
  `hora_fin`, `fecha_inicio`, `fecha_fin`, `fecha_limite_tareas`, `fecha_limite_notas`,
  `reglamento_url`, `foro_habilitado`, `devocionales_habilitado`, `peticiones_habilitado`,
  `orden`.
- **modulo_docentes** — puente N:M módulo↔docente (`rol_docente`: `titular|apoyo`). Permite que
  un docente enseñe varios módulos de distintos diplomados sin administrar el diplomado.
- **matriculas** — puente estudiante↔diplomado (`estado`: `activa|retirada|completada`). Da
  acceso implícito a todos los módulos del diplomado.

## 3. Actividad académica (por módulo)

- **recursos_modulo** — video/pdf/presentación/otro, `storage_path` o `url_externa`, `orden`.
- **tareas_academicas** — asignación del docente. `fecha_limite`, `puntos_max`.
- **tareas_academicas_entregas** — entrega del estudiante (`storage_path`, `comentario`,
  `calificacion`, `retroalimentacion`, `estado`: `pendiente|entregada|calificada|tarde`).
- **examenes** — `fecha_disponible_desde/hasta`, `duracion_minutos`, `puntos_max`.
- **examen_preguntas** / **examen_opciones** — banco de preguntas (opción múltiple, V/F, abierta).
- **examen_intentos** / **examen_respuestas** — intento del estudiante y sus respuestas,
  calificación automática para opción múltiple/V-F, manual para abiertas.
- **asistencia_sesiones** — una fila por (módulo, fecha). **asistencia_registros** — estado por
  estudiante (`presente|ausente|tarde|justificado`).
- **calificaciones_modulo** — nota final consolidada por (módulo, estudiante), `aprobado`,
  `publicada` (el docente/líder decide cuándo el estudiante la ve).

## 4. Vida de módulo (opcional por módulo)

- **foro_temas** / **foro_mensajes** — foro académico del módulo (si `foro_habilitado`).
- **devocionales** — opcional por módulo o institucional (`modulo_id` nullable).
- **peticiones_oracion** — opcional por módulo, con bandera `privado`.

## 5. Evidencias de clase

- **evidencias_clase** — por (módulo, docente, fecha): estado/foto inicial y final del salón,
  observaciones.

## 6. Financiero (módulo independiente)

- **conceptos_pago** — catálogo de cobros: `matricula|modulo|recurso|ofrenda|otro`, `monto`,
  vínculo opcional a `diplomado_id`/`modulo_id`.
- **pagos** — `estudiante_id`, `concepto_id`, `monto`, `metodo_pago`, `referencia`,
  `comprobante_url`, `estado` (`pendiente|aprobado|rechazado`), `aprobado_por`.
- **ofrendas** — donaciones, opcionalmente anónimas, no atadas a matrícula.
- Estados de cuenta y reportes se resuelven con vistas (`vista_estado_cuenta`), no tablas
  nuevas, para no duplicar la fuente de verdad de `pagos`.

## 7. Comunicación institucional

- **conversaciones** — `tipo` (`directa|grupo`), `titulo` opcional.
- **conversacion_participantes** — puente conversación↔perfil. La creación de una conversación
  valida con `puede_conversar(role_a, role_b)` que el par de roles esté permitido
  (administrador↔líder, administrador↔docente, líder↔docente).
- **mensajes** — `contenido`, `fijado`, `editado`. **mensaje_adjuntos** — archivos/PDF/imágenes/
  enlaces. **mensaje_lecturas** — estado leído por participante.

## 8. Gestor de tareas administrativas

- **tareas_gestion** — asignada por administrador/líder a cualquier miembro del staff.
  `responsable_id`, `asignado_por`, `prioridad` (`baja|media|alta|urgente`), `fecha_limite`,
  `estado` (`pendiente|en_progreso|completada|cancelada`).
- **tareas_gestion_archivos**, **tareas_gestion_comentarios**, **tareas_gestion_historial**
  (auditoría de cambios de estado/responsable).

## 9. Biblioteca institucional

- **biblioteca_categorias** — plantillas PPT/Canva, logos, manuales, reglamentos, formatos.
- **biblioteca_recursos** — archivo con categoría, `tipo`, `storage_path`.

## 10. Certificados

- **plantillas_certificado** — fondo, logo, hasta 2 firmas (`nombre` + `cargo` + imagen),
  `institucion_id`.
- **certificados** — `estudiante_id`, `diplomado_id`, `plantilla_id`, `codigo_verificacion`
  (único, usado en el QR), `pdf_url`, `emitido_por`. Verificación pública vía función
  `verificar_certificado(codigo)` que expone solo los campos necesarios.

## 11. Auditoría

- **auditoria** — `institucion_id`, `actor_id`, `accion`, `entidad`, `entidad_id`, `metadata`
  (jsonb), `created_at`. Se escribe desde triggers/funciones en operaciones sensibles (pagos,
  certificados, cambios de rol/estado de cuenta activa).

## 12. Diagrama de relaciones (alto nivel)

```
instituciones 1─* profiles
profiles(role=lider) 1─1 diplomados
diplomados 1─* modulos
modulos *─* profiles(role=docente)   [modulo_docentes]
diplomados *─* profiles(role=estudiante)  [matriculas]
modulos 1─* recursos_modulo / tareas_academicas / examenes / asistencia_sesiones
tareas_academicas 1─* tareas_academicas_entregas (por estudiante matriculado)
examenes 1─* examen_preguntas 1─* examen_opciones
examenes 1─* examen_intentos 1─* examen_respuestas (por estudiante)
asistencia_sesiones 1─* asistencia_registros (por estudiante)
modulos 1─1..* calificaciones_modulo (por estudiante)
diplomados 1─* certificados *─1 estudiante
profiles *─* profiles  [conversacion_participantes ⇢ conversaciones ⇢ mensajes]
profiles 1─* tareas_gestion (como responsable o asignador)
instituciones 1─* conceptos_pago / pagos / ofrendas / biblioteca_* / plantillas_certificado
```
