# Roadmap de implementación — CELM · La Cosecha

Ejecución autónoma por fases. Cada fase se cierra con: diseño → implementación → build
verificado → documentación actualizada. Estado real al final de cada sesión de trabajo se
refleja aquí (no es un plan aspiracional, es el estado verdadero del código).

| Fase | Alcance | Estado |
|---|---|---|
| 0 | Arquitectura, modelo de datos, roles/RLS, UX (este `docs/`) | ✅ Completada |
| 1 | Purga del dominio infantil + rebrand base (paquete, index.html, README, tema) | ✅ Completada |
| 2 | `schema.sql` completo: tenancy, académico, financiero, comunicación, tareas de gestión, biblioteca, certificados, auditoría + RLS | ✅ Completada |
| 3 | Núcleo de app: auth multi-rol, layout responsive (3 experiencias), routing por módulo | ✅ Completada |
| 4 | Diplomados y Módulos (admin/líder): CRUD, asignación de líder/docentes, matrícula | ✅ Completada |
| 5 | Portal docente: recursos, tareas, exámenes, asistencia, calificaciones, evidencias | ✅ Completada |
| 6 | Portal estudiante: contenido, entregas, exámenes, asistencia/notas/pagos, certificados | ✅ Completada |
| 7 | Financiero: conceptos de pago, pagos, ofrendas, aprobaciones, estado de cuenta | ✅ Completada |
| 8 | Comunicación institucional | ✅ Completada |
| 9 | Gestor de tareas administrativas | ✅ Completada |
| 10 | Biblioteca institucional | ✅ Completada |
| 11 | Certificados con QR + verificación pública | ✅ Completada |
| 12 | Dashboards por rol | ✅ Completada |
| 13 | Pulido, QA, documentación final | ✅ Completada (ver "Próximos pasos") |
| 14 | Sección de Ayuda por rol: checklist de puesta en marcha (administrador) + guías de uso (líder/docente/estudiante) | ✅ Completada |

## Próximos pasos recomendados (post-MVP, no bloqueantes)

Estos quedan fuera del alcance de esta iteración porque requieren decisiones de negocio o
integraciones externas que no se pueden asumir de forma unilateral:

1. **Pasarela de pago real** (Stripe/PayPal/local). Hoy los pagos se registran con
   comprobante manual + aprobación de administrador — funcional para operación real, pero sin
   cobro en línea automático. Requiere credenciales de un proveedor que el cliente elija.
   *(Blocked: necesita decisión y credenciales del instituto/negocio.)*
2. **Envío de correo/SMS transaccional** (confirmaciones, recordatorios de pago,
   notificaciones de mensajes). Requiere un proveedor (Resend, Twilio, etc.) y su API key.
   *(Blocked: requiere credenciales.)*
3. **Generación de PDF de certificados en servidor** (hoy se genera una vista imprimible en
   el cliente con QR — `qrcode` — y "Guardar como PDF" del navegador; para volumen alto o
   firmas digitales certificadas conviene una Edge Function con una librería de PDF del lado
   servidor).
4. **Modo oscuro** y **panel de super-admin multi-instituto** (para el equipo que vende el
   SaaS, no para los institutos clientes) — evolución natural una vez haya más de un tenant
   real.
5. **Pruebas automatizadas** (unitarias de RLS con `pgTAP` o Vitest + mocks; E2E con
   Playwright). No incluidas en este MVP por foco en alcance funcional; recomendado antes de
   vender el primer contrato comercial.
6. **Internacionalización** si se vende fuera de mercados hispanohablantes.
7. **Code-splitting del bundle** (`vite build` avisa que el chunk principal supera 500 kB).
   Funciona bien para el tamaño actual del equipo de un instituto; conviene dividir por ruta
   (`React.lazy`) antes de que el catálogo de módulos crezca mucho más.
8. **Consolidar políticas RLS permisivas duplicadas** (el linter de rendimiento de Supabase
   marca ~30 casos de "multiple permissive policies": por diseño hay una política por rol
   —administrador/líder/docente— en vez de una sola con todos los `OR`, priorizando
   claridad y auditabilidad sobre el último grado de rendimiento; a considerar si el volumen
   de escrituras concurrentes lo justifica).
9. **Activar "Leaked Password Protection"** en Supabase Auth (Dashboard → Authentication →
   Policies) — es un ajuste de proyecto, no de esquema, así que no se pudo aplicar por SQL.

## QA final (fase 13)

- `npm run build` verificado tras cada fase (sin errores).
- Se corrió el linter de seguridad y de rendimiento de Supabase (`get_advisors`) sobre el
  proyecto real al cierre del proyecto: se agregaron los 72 índices faltantes en columnas de
  llave foránea y se reescribieron las ~40 políticas RLS que reevaluaban `auth.uid()` por fila
  (ahora `(select auth.uid())`, cacheado una vez por consulta). Quedan como aceptados y
  documentados arriba: "multiple permissive policies" (decisión de diseño) e "índices sin uso"
  (esperado: son nuevos y la base todavía no tiene tráfico real).
- Revisión responsive manual del layout (sidebar/tablet/tab-bar móvil) y del overflow de
  navegación en el menú "Más" al crecer a 7 ítems para administrador.

## Cómo se ejecutó este roadmap

Cada fase se implementó en su propio conjunto de commits sobre la rama
`claude/celm-erp-academico-cqc20u`, sin pausas de confirmación intermedias, según las
instrucciones del propietario del producto. Cuando surgió una decisión de arquitectura no
especificada explícitamente, se resolvió con el criterio más profesional disponible y se
registró en `docs/ARCHITECTURE.md §2` (tabla de decisiones) en vez de preguntar.
