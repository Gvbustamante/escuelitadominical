# Plataforma académica — Arquitectura del producto

## 1. Qué es esto

Es un ERP académico multi-tenant para programas de formación bíblica. Cada **programa**
(CELM, ELID, Instituto Bíblico, el de otra iglesia…) es un tenant independiente. Administra
diplomados, módulos, docentes, estudiantes, finanzas, comunicación institucional, recursos,
certificados y reportes.

Este proyecto nace reutilizando **únicamente la arquitectura técnica** de Access Kids
(React + Vite + Supabase + Tailwind, autenticación por cédula/usuario interno, sistema de
invitaciones vía función `security definer`, RLS por rol, storage por buckets, layout con
sidebar + rutas protegidas). El dominio de negocio es completamente nuevo: no hay niños,
padres, niveles ni gamificación infantil en ningún punto del sistema.

## 2. Decisiones de arquitectura (registro)

Estas decisiones se toman ahora, de forma autónoma y documentada, para evitar rehacer trabajo:

| # | Decisión | Razón |
|---|----------|-------|
| D1 | **Multi-tenant desde el día uno** (tabla `instituciones`, `institucion_id` en casi toda tabla, RLS aislante por tenant) | El pedido es un "producto SaaS comercial de nivel empresarial" que "se puedan poner los colores del instituto" → implica vender el mismo software a múltiples institutos, cada uno aislado y con su propia marca. Diseñarlo mono-tenant hoy y migrarlo después sería deuda técnica cara (retrofit de RLS en 30+ tablas). |
| D2 | **Roles fijos**: `administrador`, `lider`, `docente`, `estudiante` (enum controlado por `check`, no tabla de roles dinámica) | El pedido especifica exactamente 4 roles con reglas de negocio muy concretas (jerarquía fija). Un sistema de permisos genérico (RBAC configurable) es sobre-ingeniería para el alcance actual; se documenta como evolución futura en el roadmap. |
| D3 | **Branding vía tabla `instituciones`** (`color_primario`, `color_secundario`, `logo_url`) inyectado como CSS variables en runtime, no vía Tailwind config estático | Cada instituto necesita sus colores sin recompilar la app. |
| D4 | **Autenticación**: usuario/contraseña internos (mismo patrón `usuario@dominio.local` de Access Kids), sin depender de correos reales, porque estudiantes y docentes de institutos bíblicos con frecuencia no tienen correo activo. Administradores sí pueden usar correo real. | Reutiliza el patrón de invitación por RPC `security definer` que ya probó funcionar. |
| E1 | **Un líder = un diplomado** (constraint `unique` en `diplomados.lider_id`) | Regla de negocio explícita. |
| E2 | **Un docente puede pertenecer a varios módulos, de distintos diplomados** (tabla puente `modulo_docentes`) | Regla de negocio explícita: el docente nunca administra diplomados completos, solo módulos. |
| E3 | **Estudiante se matricula a nivel de diplomado** (`matriculas`), y automáticamente tiene acceso a todos los módulos de ese diplomado | Un diplomado son 6-7 módulos secuenciales; matricular módulo por módulo sería fricción operativa innecesaria. |
| E4 | **Tareas académicas y tareas de gestión son entidades separadas** (`tareas_academicas` vs `tareas_gestion`) | El pedido describe dos sistemas de "tareas" con dueños distintos (docente→estudiante vs admin/líder→cualquier staff). Fusionarlos generaría acoplamiento incorrecto y RLS confusa. |
| E5 | **Comunicación institucional restringida por pares de rol permitidos** (`administrador↔lider`, `administrador↔docente`, `lider↔docente`), nunca libre ni con estudiantes | Regla de negocio explícita ("no será un chat social"). Se aplica con una función `puede_conversar(role_a, role_b)` reusada en RLS. |
| E6 | **Certificados con verificación pública** vía función `security definer` que expone solo campos mínimos por código, no la tabla completa | Verificación de diplomas debe ser pública (código QR) sin filtrar datos de otros estudiantes. |
| A1 | **Auditoría ligera** (`auditoria`) desde el inicio para acciones sensibles (pagos, certificados, cambios de rol) | Requisito implícito de "nivel empresarial"; trazabilidad es barata de agregar ahora y costosa de reconstruir después. |
| I1 | **Se reutiliza el mismo proyecto Supabase** que ya usaba escuelitadominical (`Emmanuel-accesskids`, ref `pgimdmthbncgpkitnkgi`) en vez de crear uno nuevo, por instrucción explícita del propietario del producto. Existía un segundo proyecto (`Access Kids - v2`) con datos igualmente reales; se dejó intacto — nunca se tocó. | Evita duplicar infraestructura/costos ya pagados; el dominio de datos anterior (niños/padres) se eliminó del proyecto reutilizado (autorizado explícitamente) antes de aplicar el esquema nuevo. |
| T1 | **Un "programa" (CELM, ELID, Instituto Bíblico…) es un tenant**: una fila de `instituciones` con su propio código, usuarios, diplomados, finanzas y colores | Es la estructura real del cliente: una iglesia con varios programas de formación. No hizo falta cambiar el modelo — lo que ya existía como "institución" funciona exactamente así. **Contrapartida conocida**: cada perfil pertenece a un solo programa, así que una persona que participe en dos necesita dos cuentas. Si eso resulta común en la práctica, el modelo correcto sería de dos niveles (iglesia → programa) con un perfil y varios roles; conviene decidirlo antes de cargar usuarios reales. |
| T2 | **`es_administrador()` nunca se usa sola en una política**: siempre acompañada del chequeo de institución de la fila | Fallo real detectado al crear el segundo programa. La función responde "quien llama es administrador", no "es administrador de esta fila". Mientras hubo un solo tenant la diferencia era invisible; con dos, un administrador pasó a leer los perfiles del otro programa (nombre y documento de identidad incluidos) y a poder gestionar su contenido académico, sus matrículas y sus asignaciones de docentes — `puede_gestionar_modulo()` arrastraba el fallo a recursos, tareas, exámenes, asistencia, calificaciones, foro y evidencias. Las ramas de líder y docente nunca estuvieron afectadas porque comparan contra `auth.uid()`. |
| T3 | **La creación de programas vive en una función `security definer` (`crear_programa`)**, no en políticas RLS | Crear un programa significa insertar filas de OTRA institución, algo que ninguna política puede ni debe permitir. La función valida por su cuenta que quien llama sea administrador. Consecuencia explícita: el rol de administrador es de confianza total en la instalación, no solo dentro de su programa. |
| H1 | **El líder ve los choques de horario contra otros diplomados a través de una función acotada**, no ampliando su acceso a `modulos` | El choque más peligroso es el invisible: un docente suyo ya ocupado a esa hora en un diplomado que él no ve. Darle acceso a esos módulos rompería el aislamiento del rol; `ocupacion_docentes_fuera_del_diplomado()` devuelve solo día, hora y nombre del diplomado, lo mínimo para detectar el cruce. |
| E7 | **El alcance del líder en tareas de gestión son los docentes de su propio diplomado**, no todo el instituto | Corrige un fallo real: la RLS original se conformaba con `mi_rol() in ('administrador','lider')`, sin acotar, así que un líder podía asignarle tareas a un docente de otro diplomado, a otro líder o al administrador, y además leía todas las tareas del tenant. Se implementa con `es_docente_de_mi_diplomado()`, coherente con el resto de reglas del rol. El docente sigue sin poder asignar: el trabajo hacia estudiantes ya tiene su sistema (`tareas_academicas`), y duplicarlo daría dos bandejas para lo mismo. |
| C1 | **El calendario no tiene tabla propia: agrega en el cliente lo que ya existe** (eventos, clases derivadas de `modulos.dia_semana`+hora, `fecha_limite` de tareas, cierre de exámenes, tareas de gestión) en una lista uniforme de items | Duplicar esas fechas en una tabla de calendario obligaría a mantenerlas sincronizadas con su origen mediante triggers, y cualquier desincronización se vería como un calendario que miente. Además, al consultar las tablas originales la RLS ya filtra por rol sin código extra: un estudiante recibe las clases de sus módulos y cero tareas administrativas usando exactamente el mismo camino que un administrador. |
| C2 | **Las clases se expanden a ocurrencias en el cliente, no se almacenan fecha por fecha** | `modulos` ya define la clase como día de la semana + hora + rango de vigencia, que es como el instituto la piensa ("Teología I, martes 7pm, de marzo a junio"). Materializar cada ocurrencia obligaría a regenerarlas al editar el horario y a decidir qué hacer con las ya pasadas. El rango que se expande nunca supera ~370 días (vista de año), así que el costo es irrelevante. |
| C3 | **Paleta de categorías fija, no derivada del color de marca del instituto** | El objetivo de los colores del calendario es distinguir categorías de un vistazo, y eso se pierde si todas son tonos del mismo azul corporativo. La marca sigue mandando en el resto de la interfaz. Corolario técnico: las clases de Tailwind se escriben completas y literales (nunca `bg-${x}-500` ni `.replace()`), porque Tailwind analiza el código como texto y una clase construida en runtime no llega al CSS. |
| U1 | **El checklist de puesta en marcha del administrador se deriva del estado real de la base en cada visita**, no se persiste como "paso completado" en una tabla de onboarding | Un checklist persistido miente en cuanto el instituto cambia (si se borra el último diplomado, el paso seguiría marcado como hecho). Derivarlo de `count(*)` sobre las tablas reales lo mantiene siempre verdadero y no agrega esquema ni migraciones. El costo son 11 consultas `head: true` en paralelo al abrir la pantalla, despreciable frente al riesgo de mostrar un estado falso. |
| I2 | **Toda referencia cruzada entre tablas dentro de un `using`/`with check` de RLS pasa por una función `security definer`**, nunca por un `exists (select ... from otra_tabla ...)` literal en el texto de la política | Bug real detectado en producción: las políticas de `modulos` y `diplomados` se citaban en crudo una a la otra (y `profiles` citaba en crudo a `modulos`/`diplomados`/`modulo_docentes`/`matriculas`), formando un ciclo. Postgres expande, al reescribir una consulta, las políticas RLS de cualquier tabla referenciada literalmente dentro de otra política — así que evaluar la política de `profiles` disparaba `infinite recursion detected in policy for relation modulos` (42P17) para **cualquier** usuario autenticado, admin incluido. Como el cliente solo destructura `{ data }` de la respuesta de Supabase (ignora `error`), esto se manifestaba como "perfil no encontrado" / spinner infinito, indistinguible de una fila inexistente. Se corrigió envolviendo cada cruce en una función `security definer` nueva (`institucion_de_diplomado`, `institucion_de_modulo`, `tengo_modulo_como_docente`, `es_docente_relacionado_con`, `es_estudiante_relacionado_con`), que accede a la otra tabla con los privilegios del dueño de la función (evita RLS) en vez de como parte de la consulta reescrita. |

## 3. Stack técnico (heredado y confirmado)

- **Frontend**: React 18 + Vite + React Router (HashRouter) + Tailwind CSS.
- **Backend**: Supabase (Postgres + Auth + Storage + RLS + funciones `security definer`).
- **Sin backend propio**: toda la lógica de negocio vive en RLS + funciones SQL + el cliente.
  Esto es correcto para el tamaño actual del producto; si en el futuro se necesita lógica más
  compleja (facturación recurrente, integraciones de pago), se evaluará una capa de Edge
  Functions (ya soportada por Supabase, sin cambiar de proveedor).

## 4. Organización del proyecto

```
src/
  app/                 → shell de la aplicación (rutas, providers)
  components/
    ui/                → primitivos reutilizables (Button, Card, Table, Modal, Badge, EmptyState…)
    layout/            → AppShell, Sidebar, TopBar, MobileTabBar, BreadcrumbBar
    shared/            → componentes de dominio reutilizados entre módulos (FileUpload, DataTable…)
  contexts/            → AuthContext, TenantContext (branding)
  features/            → un directorio por módulo de negocio (ver §5), cada uno con:
                           pages/  (pantallas ruteadas)
                           components/ (piezas propias del módulo)
                           api.js (llamadas Supabase del módulo)
                           hooks.js (hooks de datos)
  lib/                 → supabaseClient, formatters, constants, roles.js, permisos.js
  pages/               → páginas globales no ligadas a un módulo (Login, CompleteProfile, 403, 404)
supabase/
  schema.sql           → esquema completo (fuente de verdad, idempotente donde es posible)
  seed.sql             → datos de ejemplo para desarrollo
docs/                  → esta carpeta
```

Convenciones:
- Nombres de tablas y columnas en español (consistente con Access Kids y con el idioma del
  producto), snake_case.
- Nombres de componentes y variables JS en inglés/camelCase salvo términos de dominio
  (`Diplomado`, `Modulo`, `Matricula`) que se mantienen en español porque son el vocabulario
  del negocio y de la UI.
- Cada `feature` es dueño de su acceso a datos: nada de queries Supabase sueltas dentro de
  componentes de `components/`.
- Un solo `AuthContext` (sesión + perfil + institución) — no se duplica estado de auth por
  módulo.
- Cada página de `features/*/pages` se importa en `App.jsx` con `React.lazy` (code-splitting
  por ruta): el bundle principal solo trae el shell (auth/layout), y cada módulo de negocio se
  descarga bajo demanda la primera vez que el usuario navega a él.

## 5. Módulos (features) del sistema

1. `auth` — login, completar perfil, cambio de contraseña, invitaciones.
2. `dashboard` — un dashboard por rol.
3. `diplomados` — CRUD de diplomados, asignación de líder, reglamento, plantilla institucional.
4. `modulos` — CRUD de módulos dentro de un diplomado, asignación de docentes, horarios, salón.
5. `matriculas` — matricular/retirar estudiantes de diplomados.
6. `academico` — recursos (video/pdf/presentación), tareas académicas + entregas, exámenes +
   intentos, asistencia, calificaciones.
7. `evidencias` — registro de estado inicial/final de salón por sesión de módulo.
8. `financiero` — conceptos de pago, pagos, ofrendas, comprobantes, estados de cuenta,
   aprobaciones.
9. `comunicacion` — conversaciones institucionales, mensajes, adjuntos, fijados, lecturas.
10. `tareas_gestion` — tareas administrativas asignadas por admin/líder.
11. `biblioteca` — recursos institucionales por categoría.
12. `certificados` — plantillas, emisión, verificación pública por QR.
13. `usuarios` — administración de personas y roles (vista transversal para administrador).
14. `configuracion` — datos del instituto, marca, reglamento general, parámetros del sistema.
15. `reportes` — reportes transversales (académicos, financieros, asistencia).
16. `ayuda` — checklist de puesta en marcha (administrador) y guías de uso por rol.
17. `eventos` — agenda institucional con afiche; el evento destacado se pinta como banner en el inicio.
18. `devocionales` — reflexiones institucionales o por módulo, con imagen opcional.
19. `calendario` — vista agregada (mes/semana/año) de clases, entregas, exámenes, eventos y tareas de gestión.
20. `programas` — alta de nuevos programas (tenants) y de su primer administrador.
21. `horario` — rejilla semanal del diplomado con detección de choques de salón y de docente.

## 6. UX y responsive: tres experiencias, no un solo layout escalado

- **Escritorio (≥1024px)**: sidebar fija expandida + topbar con búsqueda/notificaciones +
  contenido en grid multi-columna. Tablas densas, paneles laterales de detalle.
  Ver `docs/UX_GUIDELINES.md`.
- **Tablet (640–1023px)**: sidebar colapsable a iconos, contenido en una sola columna ancha,
  tablas con scroll horizontal contenido, modales a pantalla completa.
  para trabajo campo el resto del año.
- **Teléfono (<640px)**: navegación inferior tipo tab-bar (4-5 accesos clave por rol),
  pantallas apiladas (drill-down) en vez de tablas, tarjetas en vez de filas, formularios de un
  solo campo visible a la vez cuando son largos.

Estas tres experiencias comparten la misma capa de datos (`features/*/api.js`) y componentes
`ui/`, pero los componentes de `layout/` y las vistas de listado tienen variantes explícitas
por breakpoint (no solo clases responsive de Tailwind) cuando la densidad de información lo
justifica (tablas académicas, financieras).

## 7. Identidad visual

SaaS corporativo, minimalista, con tokens de marca inyectables por instituto:
- Tipografía: `Inter` (UI) — reemplaza a Baloo 2/Nunito.
- Paleta base neutra (grises fríos) + color primario/secundario del instituto vía CSS
  variables (`--brand-primary`, `--brand-secondary`) con fallback a un azul corporativo
  por defecto.
- Sin emojis decorativos en la UI de producción; iconografía lineal consistente (un solo set).
- Bordes y sombras sobrios (radios 8–12px, sombras bajas), no "blob" ni "pop" infantiles.

Ver `docs/UX_GUIDELINES.md` para el detalle de tokens, componentes base y patrones de
navegación por rol.

## 8. Fases de implementación

Ver `docs/ROADMAP.md`. Regla de ejecución: cada fase se diseña, implementa, documenta y
verifica (build) antes de pasar a la siguiente; el roadmap se actualiza con el estado real al
cierre de cada fase.
