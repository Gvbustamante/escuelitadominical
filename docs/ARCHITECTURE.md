# CELM · La Cosecha — Arquitectura del producto

## 1. Qué es esto

**CELM (La Cosecha)** es un ERP académico multi-tenant para institutos bíblicos. Administra
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
