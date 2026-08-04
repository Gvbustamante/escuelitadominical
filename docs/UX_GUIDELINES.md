# Guía de UX/UI 

## Principios

1. **SaaS empresarial, no app infantil**: densidad de información alta en escritorio, tono
   sobrio, cero gamificación.
2. **Marca del instituto, no la nuestra**: color primario/secundario vienen de
   `instituciones.color_primario/secundario` y se inyectan como variables CSS en runtime
   (`document.documentElement.style.setProperty('--brand-primary', …)`). El diseño nunca
   asume un color fijo salvo el fallback por defecto.
3. **Tres experiencias, no un solo layout escalado** (ver `ARCHITECTURE.md §6`).
4. **Cada rol tiene su propia navegación y su propio dashboard** — no se reutiliza un menú
   genérico con ítems ocultos por permiso; se compone explícitamente por rol
   (`lib/navigation.js`).

## Tokens visuales

- Tipografía: `Inter` para UI y datos; pesos 400/500/600/700.
- Radios: `--radius-sm: 6px`, `--radius-md: 10px`, `--radius-lg: 16px`.
- Sombras: bajas y frías (`0 1px 2px rgba(15,23,42,.06), 0 8px 24px -12px rgba(15,23,42,.12)`).
- Superficie base: gris muy claro (`#f7f8fa` claro / `#0b0f19` oscuro si se agrega modo oscuro
  en una fase posterior — no incluido en el MVP).
- Color de marca: variables CSS, con azul corporativo `#2952e3` como fallback.
- Iconografía: un solo set lineal (inline SVG propios en `components/ui/icons`), sin mezclar
  con emoji en pantallas internas. Los emoji quedan reservados, si acaso, para la landing
  pública (fuera de alcance del MVP de ERP).

## Componentes base (`components/ui`)

`Button` (primary/secondary/ghost/danger, tamaños sm/md), `Card`, `Badge` (estado), `Table`
(con variante de tarjetas en móvil), `Modal`/`Sheet` (Sheet en móvil, Modal centrado en
escritorio), `EmptyState`, `StatTile`, `Tabs`, `FormField`, `FileDropzone`, `Avatar`,
`PageHeader` (título + acciones + breadcrumb).

## Navegación por breakpoint

- **Escritorio**: sidebar izquierda fija (232px), agrupada por sección (Académico,
  Financiero, Comunicación, Recursos, Configuración), topbar con selector de instituto (si el
  usuario tuviera más de uno, futuro), notificaciones y avatar.
- **Tablet**: sidebar colapsada a solo íconos con tooltip; contenido a ancho completo;
  formularios y detalle en panel deslizante desde la derecha en vez de modal centrado.
- **Teléfono**: tab-bar inferior con 4-5 accesos según rol (ver `lib/navigation.js`), resto de
  opciones en un menú "Más"; listados como tarjetas apilables; formularios largos paginados
  por sección.

## Dashboards por rol (indicadores)

- **Administrador**: diplomados activos, estudiantes totales, ingresos del mes vs. meta,
  pagos pendientes de aprobar, tareas de gestión vencidas, certificados emitidos este mes,
  asistencia promedio institucional.
- **Líder**: estado de sus módulos (a tiempo / atrasados), tareas/exámenes por calificar,
  asistencia del diplomado, estudiantes en riesgo (baja asistencia o notas), solicitudes de
  aprobación pendientes.
- **Docente**: próximas clases (horario), tareas/exámenes por calificar, asistencia pendiente
  de registrar, mensajes sin leer.
  **Estudiante**: progreso del diplomado (módulos completados), próximas entregas/exámenes,
  notas recientes, estado de cuenta, certificados disponibles.

## Estados vacíos y errores

Todo listado tiene un `EmptyState` con acción primaria clara ("Crear el primer diplomado"),
nunca una tabla en blanco sin contexto. Los errores de Supabase se traducen a mensajes en
español orientados a la acción, nunca se muestra el error técnico crudo al usuario final
(se registra en consola/`auditoria` para soporte).
