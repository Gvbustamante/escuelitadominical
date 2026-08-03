# CELM · La Cosecha

ERP académico multi-tenant para institutos bíblicos: diplomados, módulos, docentes,
estudiantes, finanzas, comunicación institucional, recursos, certificados y reportes.

Ver la documentación de producto en [`docs/`](./docs):

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — arquitectura, decisiones de diseño, organización del código.
- [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) — modelo de datos completo.
- [`docs/ROLES_PERMISOS.md`](./docs/ROLES_PERMISOS.md) — roles, jerarquía y matriz de permisos.
- [`docs/UX_GUIDELINES.md`](./docs/UX_GUIDELINES.md) — guía visual y de navegación.
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — fases de implementación y estado real del proyecto.

## Stack

- React + Vite + Tailwind CSS
- Supabase (base de datos Postgres, autenticación, storage, RLS)

## Roles

**Administrador** (control total del instituto) → **Líder** (dueño de un diplomado) →
**Docente** (dueño del contenido de sus módulos) → **Estudiante** (consume y entrega).
Detalle completo en `docs/ROLES_PERMISOS.md`.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completa con tu URL y anon key de Supabase
npm run dev
```

### Base de datos

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta todo el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
3. Crea la primera institución y el primer administrador con
   [`supabase/primer_admin.sql`](./supabase/primer_admin.sql) (edítalo con los datos reales antes de ejecutarlo).

Este proyecto es **multi-tenant**: un solo proyecto de Supabase puede alojar muchos institutos,
aislados por `institucion_id` y RLS (ver `docs/DATA_MODEL.md`).

## Despliegue

Cada push a `main` despliega automáticamente a GitHub Pages vía GitHub Actions
(`.github/workflows/deploy.yml`). Requiere los secrets `VITE_SUPABASE_URL` y
`VITE_SUPABASE_ANON_KEY` configurados en **Settings → Secrets and variables → Actions**, y
**Settings → Pages → Source: GitHub Actions**.
