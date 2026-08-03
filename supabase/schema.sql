-- ============================================================
-- CELM · La Cosecha — esquema completo de base de datos
-- ERP académico multi-tenant para institutos bíblicos.
-- Copia y pega TODO este archivo en Supabase → SQL Editor → Run.
-- Se ejecuta UNA sola vez, en un proyecto de Supabase nuevo/vacío.
-- Ver docs/DATA_MODEL.md y docs/ROLES_PERMISOS.md para el diseño.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. TENANCY E IDENTIDAD
-- ============================================================

create table public.instituciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  logo_url text,
  color_primario text not null default '#2952e3',
  color_secundario text not null default '#0ea5a4',
  plan text not null default 'estandar' check (plan in ('prueba','estandar','premium')),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.instituciones is 'Un registro por instituto bíblico cliente (tenant). Todo el resto de tablas de negocio aísla por institucion_id.';

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  institucion_id uuid not null references public.instituciones(id) on delete cascade,
  role text not null check (role in ('administrador','lider','docente','estudiante')),
  nombre_completo text not null,
  documento_identidad text,
  email_contacto text,
  telefono text,
  avatar_url text,
  activo boolean not null default true,
  debe_cambiar_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institucion_id, documento_identidad)
);
comment on column public.profiles.debe_cambiar_password is 'true tras ser creado por invitación; fuerza el flujo de cambio de contraseña en el primer inicio de sesión.';

-- ============================================================
-- 2. ESTRUCTURA ACADÉMICA
-- ============================================================

create table public.diplomados (
  id uuid primary key default gen_random_uuid(),
  institucion_id uuid not null references public.instituciones(id) on delete cascade,
  nombre text not null,
  descripcion text,
  lider_id uuid unique references public.profiles(id) on delete set null,
  estado text not null default 'planificacion' check (estado in ('planificacion','activo','finalizado','archivado')),
  fecha_inicio date,
  fecha_fin date,
  reglamento_url text,
  plantilla_institucional_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.diplomados.lider_id is 'unique: un líder administra a lo más un diplomado (regla de negocio).';

create table public.modulos (
  id uuid primary key default gen_random_uuid(),
  diplomado_id uuid not null references public.diplomados(id) on delete cascade,
  nombre text not null,
  descripcion text,
  salon text,
  dia_semana int check (dia_semana between 0 and 6),
  hora_inicio time,
  hora_fin time,
  fecha_inicio date,
  fecha_fin date,
  fecha_limite_tareas date,
  fecha_limite_notas date,
  reglamento_url text,
  foro_habilitado boolean not null default false,
  devocionales_habilitado boolean not null default false,
  peticiones_habilitado boolean not null default false,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.modulo_docentes (
  modulo_id uuid references public.modulos(id) on delete cascade,
  docente_id uuid references public.profiles(id) on delete cascade,
  rol_docente text not null default 'titular' check (rol_docente in ('titular','apoyo')),
  created_at timestamptz not null default now(),
  primary key (modulo_id, docente_id)
);

create table public.matriculas (
  id uuid primary key default gen_random_uuid(),
  diplomado_id uuid not null references public.diplomados(id) on delete cascade,
  estudiante_id uuid not null references public.profiles(id) on delete cascade,
  estado text not null default 'activa' check (estado in ('activa','retirada','completada')),
  fecha_matricula date not null default current_date,
  created_at timestamptz not null default now(),
  unique (diplomado_id, estudiante_id)
);

-- ============================================================
-- 3. ACTIVIDAD ACADÉMICA POR MÓDULO
-- ============================================================

create table public.recursos_modulo (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos(id) on delete cascade,
  tipo text not null check (tipo in ('video','pdf','presentacion','otro')),
  titulo text not null,
  storage_path text,
  url_externa text,
  orden int not null default 0,
  subido_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint recursos_modulo_origen check (storage_path is not null or url_externa is not null)
);

create table public.tareas_academicas (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos(id) on delete cascade,
  titulo text not null,
  descripcion text,
  fecha_limite timestamptz,
  puntos_max numeric not null default 100,
  creado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.tareas_academicas_entregas (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas_academicas(id) on delete cascade,
  estudiante_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text,
  comentario text,
  calificacion numeric,
  retroalimentacion text,
  estado text not null default 'pendiente' check (estado in ('pendiente','entregada','calificada','tarde')),
  entregado_at timestamptz,
  calificado_at timestamptz,
  calificado_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (tarea_id, estudiante_id)
);

create table public.examenes (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos(id) on delete cascade,
  titulo text not null,
  descripcion text,
  fecha_disponible_desde timestamptz,
  fecha_disponible_hasta timestamptz,
  duracion_minutos int,
  puntos_max numeric not null default 100,
  creado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.examen_preguntas (
  id uuid primary key default gen_random_uuid(),
  examen_id uuid not null references public.examenes(id) on delete cascade,
  orden int not null default 0,
  enunciado text not null,
  tipo text not null check (tipo in ('opcion_multiple','verdadero_falso','abierta')),
  puntos numeric not null default 1
);

create table public.examen_opciones (
  id uuid primary key default gen_random_uuid(),
  pregunta_id uuid not null references public.examen_preguntas(id) on delete cascade,
  texto text not null,
  es_correcta boolean not null default false,
  orden int not null default 0
);

create table public.examen_intentos (
  id uuid primary key default gen_random_uuid(),
  examen_id uuid not null references public.examenes(id) on delete cascade,
  estudiante_id uuid not null references public.profiles(id) on delete cascade,
  iniciado_at timestamptz not null default now(),
  entregado_at timestamptz,
  calificacion numeric,
  requiere_revision_manual boolean not null default false,
  estado text not null default 'en_progreso' check (estado in ('en_progreso','entregado','calificado')),
  unique (examen_id, estudiante_id)
);

create table public.examen_respuestas (
  id uuid primary key default gen_random_uuid(),
  intento_id uuid not null references public.examen_intentos(id) on delete cascade,
  pregunta_id uuid not null references public.examen_preguntas(id) on delete cascade,
  opcion_id uuid references public.examen_opciones(id),
  respuesta_texto text,
  puntos_obtenidos numeric,
  unique (intento_id, pregunta_id)
);

create table public.asistencia_sesiones (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos(id) on delete cascade,
  fecha date not null default current_date,
  tomada_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (modulo_id, fecha)
);

create table public.asistencia_registros (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.asistencia_sesiones(id) on delete cascade,
  estudiante_id uuid not null references public.profiles(id) on delete cascade,
  estado text not null default 'presente' check (estado in ('presente','ausente','tarde','justificado')),
  created_at timestamptz not null default now(),
  unique (sesion_id, estudiante_id)
);

create table public.calificaciones_modulo (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos(id) on delete cascade,
  estudiante_id uuid not null references public.profiles(id) on delete cascade,
  nota_final numeric,
  aprobado boolean,
  publicada boolean not null default false,
  calculada_por uuid references public.profiles(id),
  calculada_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (modulo_id, estudiante_id)
);

-- ============================================================
-- 4. VIDA DE MÓDULO (OPCIONAL)
-- ============================================================

create table public.foro_temas (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos(id) on delete cascade,
  titulo text not null,
  creado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.foro_mensajes (
  id uuid primary key default gen_random_uuid(),
  tema_id uuid not null references public.foro_temas(id) on delete cascade,
  autor_id uuid references public.profiles(id),
  mensaje text not null,
  created_at timestamptz not null default now()
);

create table public.devocionales (
  id uuid primary key default gen_random_uuid(),
  institucion_id uuid not null references public.instituciones(id) on delete cascade,
  modulo_id uuid references public.modulos(id) on delete cascade,
  titulo text not null,
  referencia_biblica text,
  contenido text not null,
  fecha date not null default current_date,
  creado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.peticiones_oracion (
  id uuid primary key default gen_random_uuid(),
  institucion_id uuid not null references public.instituciones(id) on delete cascade,
  modulo_id uuid references public.modulos(id) on delete cascade,
  autor_id uuid references public.profiles(id),
  texto text not null,
  privado boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5. EVIDENCIAS DE CLASE
-- ============================================================

create table public.evidencias_clase (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos(id) on delete cascade,
  docente_id uuid references public.profiles(id),
  fecha date not null default current_date,
  estado_inicial_texto text,
  foto_inicial_url text,
  estado_final_texto text,
  foto_final_url text,
  observaciones text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. FINANCIERO
-- ============================================================

create table public.conceptos_pago (
  id uuid primary key default gen_random_uuid(),
  institucion_id uuid not null references public.instituciones(id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('matricula','modulo','recurso','ofrenda','otro')),
  monto numeric not null default 0,
  diplomado_id uuid references public.diplomados(id) on delete set null,
  modulo_id uuid references public.modulos(id) on delete set null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  institucion_id uuid not null references public.instituciones(id) on delete cascade,
  estudiante_id uuid not null references public.profiles(id) on delete cascade,
  concepto_id uuid references public.conceptos_pago(id),
  monto numeric not null,
  metodo_pago text,
  referencia text,
  comprobante_url text,
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobado','rechazado')),
  fecha_pago date not null default current_date,
  aprobado_por uuid references public.profiles(id),
  aprobado_at timestamptz,
  notas_aprobacion text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.ofrendas (
  id uuid primary key default gen_random_uuid(),
  institucion_id uuid not null references public.instituciones(id) on delete cascade,
  donante_id uuid references public.profiles(id),
  anonimo boolean not null default false,
  monto numeric not null,
  fecha date not null default current_date,
  comprobante_url text,
  registrado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create view public.vista_estado_cuenta with (security_invoker = true) as
select
  p.estado as estado_pago,
  p.institucion_id,
  p.estudiante_id,
  p.id as pago_id,
  cp.nombre as concepto,
  cp.tipo as concepto_tipo,
  p.monto,
  p.fecha_pago,
  p.aprobado_at
from public.pagos p
join public.conceptos_pago cp on cp.id = p.concepto_id;
comment on view public.vista_estado_cuenta is 'Vista de lectura para estado de cuenta por estudiante; no duplica pagos, solo lo enriquece con el concepto.';

-- ============================================================
-- 7. COMUNICACIÓN INSTITUCIONAL
-- ============================================================

create table public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  institucion_id uuid not null references public.instituciones(id) on delete cascade,
  tipo text not null default 'directa' check (tipo in ('directa','grupo')),
  titulo text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.conversacion_participantes (
  conversacion_id uuid references public.conversaciones(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversacion_id, profile_id)
);

create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references public.conversaciones(id) on delete cascade,
  autor_id uuid references public.profiles(id),
  contenido text not null,
  fijado boolean not null default false,
  editado boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.mensaje_adjuntos (
  id uuid primary key default gen_random_uuid(),
  mensaje_id uuid not null references public.mensajes(id) on delete cascade,
  storage_path text,
  url_externa text,
  nombre_archivo text,
  tipo_archivo text,
  created_at timestamptz not null default now()
);

create table public.mensaje_lecturas (
  mensaje_id uuid references public.mensajes(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  leido_at timestamptz not null default now(),
  primary key (mensaje_id, profile_id)
);

-- ============================================================
-- 8. GESTOR DE TAREAS ADMINISTRATIVAS
-- ============================================================

create table public.tareas_gestion (
  id uuid primary key default gen_random_uuid(),
  institucion_id uuid not null references public.instituciones(id) on delete cascade,
  titulo text not null,
  descripcion text,
  responsable_id uuid references public.profiles(id),
  asignado_por uuid references public.profiles(id),
  prioridad text not null default 'media' check (prioridad in ('baja','media','alta','urgente')),
  fecha_limite date,
  estado text not null default 'pendiente' check (estado in ('pendiente','en_progreso','completada','cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tareas_gestion_archivos (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas_gestion(id) on delete cascade,
  storage_path text not null,
  nombre_archivo text,
  subido_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.tareas_gestion_comentarios (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas_gestion(id) on delete cascade,
  autor_id uuid references public.profiles(id),
  comentario text not null,
  created_at timestamptz not null default now()
);

create table public.tareas_gestion_historial (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas_gestion(id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  cambiado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 9. BIBLIOTECA INSTITUCIONAL
-- ============================================================

create table public.biblioteca_categorias (
  id uuid primary key default gen_random_uuid(),
  institucion_id uuid not null references public.instituciones(id) on delete cascade,
  nombre text not null,
  orden int not null default 0
);

create table public.biblioteca_recursos (
  id uuid primary key default gen_random_uuid(),
  institucion_id uuid not null references public.instituciones(id) on delete cascade,
  categoria_id uuid references public.biblioteca_categorias(id) on delete set null,
  titulo text not null,
  descripcion text,
  tipo text not null default 'archivo' check (tipo in ('archivo','enlace')),
  storage_path text,
  url_externa text,
  subido_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint biblioteca_recursos_origen check (storage_path is not null or url_externa is not null)
);

-- ============================================================
-- 10. CERTIFICADOS
-- ============================================================

create table public.plantillas_certificado (
  id uuid primary key default gen_random_uuid(),
  institucion_id uuid not null references public.instituciones(id) on delete cascade,
  nombre text not null,
  fondo_url text,
  logo_url text,
  firma1_url text,
  firma1_nombre text,
  firma1_cargo text,
  firma2_url text,
  firma2_nombre text,
  firma2_cargo text,
  texto_plantilla text not null default 'Otorga el presente certificado a {{nombre_estudiante}} por haber completado satisfactoriamente el diplomado de {{nombre_diplomado}}.',
  created_at timestamptz not null default now()
);

create table public.certificados (
  id uuid primary key default gen_random_uuid(),
  institucion_id uuid not null references public.instituciones(id) on delete cascade,
  estudiante_id uuid not null references public.profiles(id) on delete cascade,
  diplomado_id uuid not null references public.diplomados(id) on delete cascade,
  plantilla_id uuid references public.plantillas_certificado(id),
  codigo_verificacion text not null unique default replace(gen_random_uuid()::text, '-', ''),
  fecha_emision date not null default current_date,
  pdf_url text,
  emitido_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (estudiante_id, diplomado_id)
);

-- ============================================================
-- 11. AUDITORÍA
-- ============================================================

create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  institucion_id uuid references public.instituciones(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  accion text not null,
  entidad text not null,
  entidad_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
comment on table public.auditoria is 'Bitácora de acciones sensibles (pagos, certificados, cambios de rol/estado). Se escribe desde las funciones RPC, no desde triggers genéricos, para mantener explícito qué se audita.';

-- ============================================================
-- 12. FUNCIONES AUXILIARES (security definer, evitan recursión en RLS)
-- ============================================================

create or replace function public.mi_institucion()
returns uuid
language sql stable security definer set search_path = public
as $$
  select institucion_id from public.profiles where id = auth.uid();
$$;

create or replace function public.mi_rol()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.es_administrador()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'administrador');
$$;

create or replace function public.es_lider_de_diplomado(p_diplomado_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.diplomados d where d.id = p_diplomado_id and d.lider_id = auth.uid());
$$;

create or replace function public.es_lider_de_modulo(p_modulo_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.modulos m
    join public.diplomados d on d.id = m.diplomado_id
    where m.id = p_modulo_id and d.lider_id = auth.uid()
  );
$$;

create or replace function public.es_docente_de_modulo(p_modulo_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.modulo_docentes md where md.modulo_id = p_modulo_id and md.docente_id = auth.uid()
  );
$$;

create or replace function public.esta_matriculado(p_diplomado_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.matriculas mt
    where mt.diplomado_id = p_diplomado_id and mt.estudiante_id = auth.uid() and mt.estado in ('activa','completada')
  );
$$;

create or replace function public.esta_matriculado_modulo(p_modulo_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.modulos m
    join public.matriculas mt on mt.diplomado_id = m.diplomado_id
    where m.id = p_modulo_id and mt.estudiante_id = auth.uid() and mt.estado in ('activa','completada')
  );
$$;

create or replace function public.puede_gestionar_modulo(p_modulo_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.es_administrador()
    or public.es_lider_de_modulo(p_modulo_id)
    or public.es_docente_de_modulo(p_modulo_id);
$$;

create or replace function public.puede_conversar(p_a uuid, p_b uuid)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare
  rol_a text; rol_b text; inst_a uuid; inst_b uuid;
begin
  select role, institucion_id into rol_a, inst_a from public.profiles where id = p_a;
  select role, institucion_id into rol_b, inst_b from public.profiles where id = p_b;

  if rol_a is null or rol_b is null or inst_a is distinct from inst_b then
    return false;
  end if;

  if rol_a = 'estudiante' or rol_b = 'estudiante' then
    return false;
  end if;

  if (rol_a = 'administrador' and rol_b in ('lider','docente'))
     or (rol_b = 'administrador' and rol_a in ('lider','docente')) then
    return true;
  end if;

  if (rol_a = 'lider' and rol_b = 'docente') then
    return exists (
      select 1 from public.modulo_docentes md
      join public.modulos m on m.id = md.modulo_id
      join public.diplomados d on d.id = m.diplomado_id
      where d.lider_id = p_a and md.docente_id = p_b
    );
  end if;

  if (rol_b = 'lider' and rol_a = 'docente') then
    return exists (
      select 1 from public.modulo_docentes md
      join public.modulos m on m.id = md.modulo_id
      join public.diplomados d on d.id = m.diplomado_id
      where d.lider_id = p_b and md.docente_id = p_a
    );
  end if;

  return false;
end;
$$;

create or replace function public.puede_ver_tarea_gestion(p_tarea_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.tareas_gestion t
    where t.id = p_tarea_id
      and (t.responsable_id = auth.uid() or t.asignado_por = auth.uid() or public.mi_rol() in ('administrador','lider'))
      and t.institucion_id = public.mi_institucion()
  );
$$;

create or replace function public.es_participante(p_conversacion_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.conversacion_participantes cp
    where cp.conversacion_id = p_conversacion_id and cp.profile_id = auth.uid()
  );
$$;

-- ============================================================
-- 13. TRIGGERS GENÉRICOS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_instituciones_updated_at before update on public.instituciones
  for each row execute function public.set_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_diplomados_updated_at before update on public.diplomados
  for each row execute function public.set_updated_at();
create trigger trg_modulos_updated_at before update on public.modulos
  for each row execute function public.set_updated_at();
create trigger trg_calificaciones_modulo_updated_at before update on public.calificaciones_modulo
  for each row execute function public.set_updated_at();
create trigger trg_tareas_gestion_updated_at before update on public.tareas_gestion
  for each row execute function public.set_updated_at();

-- Autocalifica intentos de examen al entregarse (opción múltiple / verdadero-falso).
create or replace function public.calificar_intento_examen()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_total numeric := 0;
  v_pendiente boolean := false;
begin
  if new.estado = 'entregado' and (old.estado is distinct from 'entregado') then
    update public.examen_respuestas er
    set puntos_obtenidos = case
      when eq.tipo in ('opcion_multiple','verdadero_falso') then
        case when eo.es_correcta then eq.puntos else 0 end
      else er.puntos_obtenidos
    end
    from public.examen_preguntas eq
    left join public.examen_opciones eo on eo.id = er.opcion_id
    where er.pregunta_id = eq.id and er.intento_id = new.id;

    select coalesce(sum(puntos_obtenidos), 0),
           bool_or(eq.tipo = 'abierta' and er.puntos_obtenidos is null)
      into v_total, v_pendiente
    from public.examen_respuestas er
    join public.examen_preguntas eq on eq.id = er.pregunta_id
    where er.intento_id = new.id;

    new.calificacion := v_total;
    new.requiere_revision_manual := coalesce(v_pendiente, false);
    if not v_pendiente then
      new.estado := 'calificado';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_calificar_intento before update on public.examen_intentos
  for each row execute function public.calificar_intento_examen();

-- ============================================================
-- 14. ROW LEVEL SECURITY
-- ============================================================

alter table public.instituciones enable row level security;
alter table public.profiles enable row level security;
alter table public.diplomados enable row level security;
alter table public.modulos enable row level security;
alter table public.modulo_docentes enable row level security;
alter table public.matriculas enable row level security;
alter table public.recursos_modulo enable row level security;
alter table public.tareas_academicas enable row level security;
alter table public.tareas_academicas_entregas enable row level security;
alter table public.examenes enable row level security;
alter table public.examen_preguntas enable row level security;
alter table public.examen_opciones enable row level security;
alter table public.examen_intentos enable row level security;
alter table public.examen_respuestas enable row level security;
alter table public.asistencia_sesiones enable row level security;
alter table public.asistencia_registros enable row level security;
alter table public.calificaciones_modulo enable row level security;
alter table public.foro_temas enable row level security;
alter table public.foro_mensajes enable row level security;
alter table public.devocionales enable row level security;
alter table public.peticiones_oracion enable row level security;
alter table public.evidencias_clase enable row level security;
alter table public.conceptos_pago enable row level security;
alter table public.pagos enable row level security;
alter table public.ofrendas enable row level security;
alter table public.conversaciones enable row level security;
alter table public.conversacion_participantes enable row level security;
alter table public.mensajes enable row level security;
alter table public.mensaje_adjuntos enable row level security;
alter table public.mensaje_lecturas enable row level security;
alter table public.tareas_gestion enable row level security;
alter table public.tareas_gestion_archivos enable row level security;
alter table public.tareas_gestion_comentarios enable row level security;
alter table public.tareas_gestion_historial enable row level security;
alter table public.biblioteca_categorias enable row level security;
alter table public.biblioteca_recursos enable row level security;
alter table public.plantillas_certificado enable row level security;
alter table public.certificados enable row level security;
alter table public.auditoria enable row level security;

-- INSTITUCIONES: lectura pública de datos de marca (necesarios antes de iniciar sesión, ej. login); gestión solo administrador del propio tenant.
create policy "lectura publica de instituciones" on public.instituciones for select to anon, authenticated using (true);
create policy "administrador edita su institucion" on public.instituciones for update to authenticated
  using (id = public.mi_institucion() and public.es_administrador())
  with check (id = public.mi_institucion() and public.es_administrador());

-- PROFILES
-- No existe política de INSERT para el rol authenticated: toda creación de perfil pasa por
-- public.crear_usuario_invitado (security definer) o por supabase/primer_admin.sql (superusuario),
-- nunca por una inserción directa del cliente — evita que un usuario se autoasigne rol/institución.
--
-- La visibilidad de perfiles NO es "todo el tenant": documento_identidad es un dato personal
-- sensible, así que cada rol solo ve su propio perfil, a los administradores (contacto
-- institucional) y sus relaciones académicas reales (líder↔docentes/estudiantes de su
-- diplomado, docente↔líder/estudiantes de sus módulos, estudiante↔líder/docentes de sus
-- diplomados matriculados).
create policy "leer perfiles relacionados" on public.profiles for select to authenticated
  using (
    (select auth.uid()) = id
    or public.es_administrador()
    or (institucion_id = public.mi_institucion() and role = 'administrador')
    or (
      -- El líder necesita poder buscar docentes/estudiantes de su institución para
      -- asignarlos a módulos o matricularlos, no solo ver a los ya asignados (si no, el
      -- flujo "crear docente -> asignarlo" sería un problema de huevo-y-gallina). La capa
      -- de aplicación solo debe pedir id/nombre_completo/role en pantallas de selección,
      -- nunca documento_identidad, para un líder.
      public.mi_rol() = 'lider' and institucion_id = public.mi_institucion() and role in ('docente','estudiante')
    )
    or (
      public.mi_rol() = 'docente' and institucion_id = public.mi_institucion() and (
        exists (
          select 1 from public.modulos m
          join public.diplomados d on d.id = m.diplomado_id
          join public.modulo_docentes md on md.modulo_id = m.id
          where md.docente_id = (select auth.uid()) and d.lider_id = profiles.id
        )
        or exists (
          select 1 from public.modulo_docentes md
          join public.modulos m on m.id = md.modulo_id
          join public.matriculas mt on mt.diplomado_id = m.diplomado_id
          where md.docente_id = (select auth.uid()) and mt.estudiante_id = profiles.id
        )
      )
    )
    or (
      public.mi_rol() = 'estudiante' and institucion_id = public.mi_institucion() and (
        exists (
          select 1 from public.matriculas mt
          join public.diplomados d on d.id = mt.diplomado_id
          where mt.estudiante_id = (select auth.uid()) and d.lider_id = profiles.id
        )
        or exists (
          select 1 from public.matriculas mt
          join public.modulos m on m.diplomado_id = mt.diplomado_id
          join public.modulo_docentes md on md.modulo_id = m.id
          where mt.estudiante_id = (select auth.uid()) and md.docente_id = profiles.id
        )
      )
    )
  );
create policy "actualizar perfiles" on public.profiles for update to authenticated
  using ((select auth.uid()) = id or (institucion_id = public.mi_institucion() and public.es_administrador()))
  with check ((select auth.uid()) = id or (institucion_id = public.mi_institucion() and public.es_administrador()));

-- DIPLOMADOS
create policy "leer diplomados de mi institucion" on public.diplomados for select to authenticated
  using (
    institucion_id = public.mi_institucion()
    and (
      public.mi_rol() in ('administrador','lider')
      or exists (select 1 from public.modulos m where m.diplomado_id = diplomados.id and public.es_docente_de_modulo(m.id))
      or public.esta_matriculado(id)
    )
  );
create policy "administrador gestiona diplomados" on public.diplomados for all to authenticated
  using (institucion_id = public.mi_institucion() and public.es_administrador())
  with check (institucion_id = public.mi_institucion() and public.es_administrador());
create policy "lider edita su diplomado" on public.diplomados for update to authenticated
  using (lider_id = (select auth.uid()))
  with check (lider_id = (select auth.uid()));

-- MODULOS
create policy "leer modulos accesibles" on public.modulos for select to authenticated
  using (
    exists (select 1 from public.diplomados d where d.id = modulos.diplomado_id and d.institucion_id = public.mi_institucion())
    and (
      public.mi_rol() = 'administrador'
      or public.es_lider_de_modulo(id)
      or public.es_docente_de_modulo(id)
      or public.esta_matriculado_modulo(id)
    )
  );
create policy "administrador gestiona modulos" on public.modulos for all to authenticated
  using (exists (select 1 from public.diplomados d where d.id = modulos.diplomado_id and d.institucion_id = public.mi_institucion()) and public.es_administrador())
  with check (exists (select 1 from public.diplomados d where d.id = modulos.diplomado_id and d.institucion_id = public.mi_institucion()) and public.es_administrador());
create policy "lider gestiona modulos de su diplomado" on public.modulos for all to authenticated
  using (public.es_lider_de_diplomado(diplomado_id))
  with check (public.es_lider_de_diplomado(diplomado_id));
-- El docente NO edita la fila de modulos (es logística: horario/salón/fechas límite, del
-- líder/administrador). Su contenido real vive en recursos_modulo/tareas_academicas/examenes/
-- asistencia_sesiones, ya protegidas por puede_gestionar_modulo().

-- MODULO_DOCENTES
create policy "leer asignaciones docentes" on public.modulo_docentes for select to authenticated
  using (exists (select 1 from public.modulos m join public.diplomados d on d.id = m.diplomado_id where m.id = modulo_docentes.modulo_id and d.institucion_id = public.mi_institucion()));
create policy "administrador y lider asignan docentes" on public.modulo_docentes for all to authenticated
  using (public.es_administrador() or public.es_lider_de_modulo(modulo_id))
  with check (public.es_administrador() or public.es_lider_de_modulo(modulo_id));

-- MATRICULAS
create policy "leer matriculas accesibles" on public.matriculas for select to authenticated
  using (
    estudiante_id = (select auth.uid())
    or public.mi_rol() = 'administrador'
    or public.es_lider_de_diplomado(diplomado_id)
  );
create policy "administrador y lider gestionan matriculas" on public.matriculas for all to authenticated
  using (public.es_administrador() or public.es_lider_de_diplomado(diplomado_id))
  with check (public.es_administrador() or public.es_lider_de_diplomado(diplomado_id));

-- RECURSOS_MODULO
create policy "leer recursos de modulo accesible" on public.recursos_modulo for select to authenticated
  using (public.puede_gestionar_modulo(modulo_id) or public.esta_matriculado_modulo(modulo_id));
create policy "gestionar recursos de mi modulo" on public.recursos_modulo for all to authenticated
  using (public.puede_gestionar_modulo(modulo_id)) with check (public.puede_gestionar_modulo(modulo_id));

-- TAREAS_ACADEMICAS
create policy "leer tareas de modulo accesible" on public.tareas_academicas for select to authenticated
  using (public.puede_gestionar_modulo(modulo_id) or public.esta_matriculado_modulo(modulo_id));
create policy "gestionar tareas de mi modulo" on public.tareas_academicas for all to authenticated
  using (public.puede_gestionar_modulo(modulo_id)) with check (public.puede_gestionar_modulo(modulo_id));

-- TAREAS_ACADEMICAS_ENTREGAS
create policy "leer entregas accesibles" on public.tareas_academicas_entregas for select to authenticated
  using (
    estudiante_id = (select auth.uid())
    or exists (select 1 from public.tareas_academicas t where t.id = tareas_academicas_entregas.tarea_id and public.puede_gestionar_modulo(t.modulo_id))
  );
create policy "estudiante entrega su propia tarea" on public.tareas_academicas_entregas for insert to authenticated
  with check (estudiante_id = (select auth.uid()) and exists (select 1 from public.tareas_academicas t where t.id = tarea_id and public.esta_matriculado_modulo(t.modulo_id)));
create policy "estudiante actualiza su entrega antes de calificar" on public.tareas_academicas_entregas for update to authenticated
  using (estudiante_id = (select auth.uid()) and estado <> 'calificada')
  with check (estudiante_id = (select auth.uid()));
create policy "docente/lider/admin califica entregas" on public.tareas_academicas_entregas for update to authenticated
  using (exists (select 1 from public.tareas_academicas t where t.id = tareas_academicas_entregas.tarea_id and public.puede_gestionar_modulo(t.modulo_id)));

-- EXAMENES
create policy "leer examenes accesibles" on public.examenes for select to authenticated
  using (public.puede_gestionar_modulo(modulo_id) or public.esta_matriculado_modulo(modulo_id));
create policy "gestionar examenes de mi modulo" on public.examenes for all to authenticated
  using (public.puede_gestionar_modulo(modulo_id)) with check (public.puede_gestionar_modulo(modulo_id));

-- EXAMEN_PREGUNTAS / OPCIONES
create policy "leer preguntas accesibles" on public.examen_preguntas for select to authenticated
  using (exists (select 1 from public.examenes e where e.id = examen_preguntas.examen_id and (public.puede_gestionar_modulo(e.modulo_id) or public.esta_matriculado_modulo(e.modulo_id))));
create policy "gestionar preguntas de mi examen" on public.examen_preguntas for all to authenticated
  using (exists (select 1 from public.examenes e where e.id = examen_preguntas.examen_id and public.puede_gestionar_modulo(e.modulo_id)))
  with check (exists (select 1 from public.examenes e where e.id = examen_preguntas.examen_id and public.puede_gestionar_modulo(e.modulo_id)));

create policy "leer opciones accesibles" on public.examen_opciones for select to authenticated
  using (exists (
    select 1 from public.examen_preguntas p join public.examenes e on e.id = p.examen_id
    where p.id = examen_opciones.pregunta_id and (public.puede_gestionar_modulo(e.modulo_id) or public.esta_matriculado_modulo(e.modulo_id))
  ));
create policy "gestionar opciones de mi examen" on public.examen_opciones for all to authenticated
  using (exists (select 1 from public.examen_preguntas p join public.examenes e on e.id = p.examen_id where p.id = examen_opciones.pregunta_id and public.puede_gestionar_modulo(e.modulo_id)))
  with check (exists (select 1 from public.examen_preguntas p join public.examenes e on e.id = p.examen_id where p.id = examen_opciones.pregunta_id and public.puede_gestionar_modulo(e.modulo_id)));

-- EXAMEN_INTENTOS
create policy "leer intentos accesibles" on public.examen_intentos for select to authenticated
  using (estudiante_id = (select auth.uid()) or exists (select 1 from public.examenes e where e.id = examen_intentos.examen_id and public.puede_gestionar_modulo(e.modulo_id)));
create policy "estudiante inicia su propio intento" on public.examen_intentos for insert to authenticated
  with check (estudiante_id = (select auth.uid()) and exists (select 1 from public.examenes e where e.id = examen_id and public.esta_matriculado_modulo(e.modulo_id)));
create policy "estudiante entrega su propio intento" on public.examen_intentos for update to authenticated
  using (estudiante_id = (select auth.uid()) and estado = 'en_progreso')
  with check (estudiante_id = (select auth.uid()));
create policy "docente califica preguntas abiertas" on public.examen_intentos for update to authenticated
  using (exists (select 1 from public.examenes e where e.id = examen_intentos.examen_id and public.puede_gestionar_modulo(e.modulo_id)));

-- EXAMEN_RESPUESTAS
create policy "leer respuestas accesibles" on public.examen_respuestas for select to authenticated
  using (
    exists (select 1 from public.examen_intentos i where i.id = examen_respuestas.intento_id and i.estudiante_id = (select auth.uid()))
    or exists (select 1 from public.examen_intentos i join public.examenes e on e.id = i.examen_id where i.id = examen_respuestas.intento_id and public.puede_gestionar_modulo(e.modulo_id))
  );
create policy "estudiante responde su propio intento" on public.examen_respuestas for all to authenticated
  using (exists (select 1 from public.examen_intentos i where i.id = examen_respuestas.intento_id and i.estudiante_id = (select auth.uid()) and i.estado = 'en_progreso'))
  with check (exists (select 1 from public.examen_intentos i where i.id = intento_id and i.estudiante_id = (select auth.uid()) and i.estado = 'en_progreso'));
create policy "docente califica respuestas abiertas" on public.examen_respuestas for update to authenticated
  using (exists (select 1 from public.examen_intentos i join public.examenes e on e.id = i.examen_id where i.id = examen_respuestas.intento_id and public.puede_gestionar_modulo(e.modulo_id)));

-- ASISTENCIA
create policy "leer sesiones accesibles" on public.asistencia_sesiones for select to authenticated
  using (public.puede_gestionar_modulo(modulo_id) or public.esta_matriculado_modulo(modulo_id));
create policy "gestionar sesiones de mi modulo" on public.asistencia_sesiones for all to authenticated
  using (public.puede_gestionar_modulo(modulo_id)) with check (public.puede_gestionar_modulo(modulo_id));

create policy "leer registros de asistencia accesibles" on public.asistencia_registros for select to authenticated
  using (
    estudiante_id = (select auth.uid())
    or exists (select 1 from public.asistencia_sesiones s where s.id = asistencia_registros.sesion_id and public.puede_gestionar_modulo(s.modulo_id))
  );
create policy "gestionar registros de mi modulo" on public.asistencia_registros for all to authenticated
  using (exists (select 1 from public.asistencia_sesiones s where s.id = asistencia_registros.sesion_id and public.puede_gestionar_modulo(s.modulo_id)))
  with check (exists (select 1 from public.asistencia_sesiones s where s.id = asistencia_registros.sesion_id and public.puede_gestionar_modulo(s.modulo_id)));

-- CALIFICACIONES_MODULO
create policy "leer calificaciones accesibles" on public.calificaciones_modulo for select to authenticated
  using (
    (estudiante_id = (select auth.uid()) and publicada)
    or public.puede_gestionar_modulo(modulo_id)
  );
create policy "gestionar calificaciones de mi modulo" on public.calificaciones_modulo for all to authenticated
  using (public.puede_gestionar_modulo(modulo_id)) with check (public.puede_gestionar_modulo(modulo_id));

-- FORO
create policy "leer foro de modulo accesible" on public.foro_temas for select to authenticated
  using (public.puede_gestionar_modulo(modulo_id) or public.esta_matriculado_modulo(modulo_id));
create policy "crear tema de foro" on public.foro_temas for insert to authenticated
  with check (public.puede_gestionar_modulo(modulo_id) or public.esta_matriculado_modulo(modulo_id));
create policy "borrar tema propio o staff" on public.foro_temas for delete to authenticated
  using (creado_por = (select auth.uid()) or public.puede_gestionar_modulo(modulo_id));

create policy "leer mensajes de foro accesibles" on public.foro_mensajes for select to authenticated
  using (exists (select 1 from public.foro_temas t where t.id = foro_mensajes.tema_id and (public.puede_gestionar_modulo(t.modulo_id) or public.esta_matriculado_modulo(t.modulo_id))));
create policy "crear mensaje de foro" on public.foro_mensajes for insert to authenticated
  with check (autor_id = (select auth.uid()) and exists (select 1 from public.foro_temas t where t.id = tema_id and (public.puede_gestionar_modulo(t.modulo_id) or public.esta_matriculado_modulo(t.modulo_id))));
create policy "borrar mensaje de foro propio o staff" on public.foro_mensajes for delete to authenticated
  using (autor_id = (select auth.uid()) or exists (select 1 from public.foro_temas t where t.id = foro_mensajes.tema_id and public.puede_gestionar_modulo(t.modulo_id)));

-- DEVOCIONALES / PETICIONES
create policy "leer devocionales de mi institucion" on public.devocionales for select to authenticated
  using (institucion_id = public.mi_institucion() and (modulo_id is null or public.puede_gestionar_modulo(modulo_id) or public.esta_matriculado_modulo(modulo_id)));
create policy "staff gestiona devocionales" on public.devocionales for all to authenticated
  using (institucion_id = public.mi_institucion() and public.mi_rol() in ('administrador','lider','docente'))
  with check (institucion_id = public.mi_institucion() and public.mi_rol() in ('administrador','lider','docente'));

create policy "leer peticiones visibles" on public.peticiones_oracion for select to authenticated
  using (
    institucion_id = public.mi_institucion()
    and (privado = false or autor_id = (select auth.uid()) or public.mi_rol() in ('administrador','lider','docente'))
  );
create policy "crear peticion propia" on public.peticiones_oracion for insert to authenticated
  with check (autor_id = (select auth.uid()) and institucion_id = public.mi_institucion());
create policy "actualizar o borrar peticion propia o staff" on public.peticiones_oracion for update to authenticated
  using (autor_id = (select auth.uid()) or public.mi_rol() in ('administrador','lider'));
create policy "borrar peticion propia o staff" on public.peticiones_oracion for delete to authenticated
  using (autor_id = (select auth.uid()) or public.mi_rol() in ('administrador','lider'));

-- EVIDENCIAS_CLASE
create policy "leer evidencias de mi modulo" on public.evidencias_clase for select to authenticated
  using (public.puede_gestionar_modulo(modulo_id));
create policy "docente registra evidencias" on public.evidencias_clase for all to authenticated
  using (public.puede_gestionar_modulo(modulo_id)) with check (public.puede_gestionar_modulo(modulo_id));

-- FINANCIERO
create policy "leer conceptos de pago de mi institucion" on public.conceptos_pago for select to authenticated
  using (institucion_id = public.mi_institucion());
create policy "administrador gestiona conceptos de pago" on public.conceptos_pago for all to authenticated
  using (institucion_id = public.mi_institucion() and public.es_administrador())
  with check (institucion_id = public.mi_institucion() and public.es_administrador());

create policy "leer pagos accesibles" on public.pagos for select to authenticated
  using (
    estudiante_id = (select auth.uid())
    or (institucion_id = public.mi_institucion() and public.mi_rol() in ('administrador','lider'))
  );
create policy "estudiante registra su propio pago" on public.pagos for insert to authenticated
  with check (estudiante_id = (select auth.uid()) and institucion_id = public.mi_institucion());
create policy "administrador gestiona pagos" on public.pagos for all to authenticated
  using (institucion_id = public.mi_institucion() and public.es_administrador())
  with check (institucion_id = public.mi_institucion() and public.es_administrador());

create policy "leer ofrendas de mi institucion" on public.ofrendas for select to authenticated
  using (institucion_id = public.mi_institucion() and public.mi_rol() in ('administrador','lider'));
create policy "administrador gestiona ofrendas" on public.ofrendas for all to authenticated
  using (institucion_id = public.mi_institucion() and public.es_administrador())
  with check (institucion_id = public.mi_institucion() and public.es_administrador());

-- COMUNICACIÓN
create policy "leer mis conversaciones" on public.conversaciones for select to authenticated
  using (public.es_participante(id));
create policy "crear conversacion" on public.conversaciones for insert to authenticated
  with check (institucion_id = public.mi_institucion() and created_by = (select auth.uid()));

create policy "leer participantes de mis conversaciones" on public.conversacion_participantes for select to authenticated
  using (public.es_participante(conversacion_id));
create policy "agregar participantes validos" on public.conversacion_participantes for insert to authenticated
  with check (
    exists (select 1 from public.conversaciones c where c.id = conversacion_id and c.created_by = (select auth.uid()))
    and public.puede_conversar((select auth.uid()), profile_id)
  );
create policy "salir de una conversacion" on public.conversacion_participantes for delete to authenticated
  using (profile_id = (select auth.uid()));

create policy "leer mensajes de mis conversaciones" on public.mensajes for select to authenticated
  using (public.es_participante(conversacion_id));
create policy "enviar mensaje en mi conversacion" on public.mensajes for insert to authenticated
  with check (autor_id = (select auth.uid()) and public.es_participante(conversacion_id));
create policy "editar o fijar mensaje propio o admin" on public.mensajes for update to authenticated
  using (autor_id = (select auth.uid()) or (public.es_participante(conversacion_id) and public.mi_rol() = 'administrador'));

create policy "leer adjuntos de mis conversaciones" on public.mensaje_adjuntos for select to authenticated
  using (exists (select 1 from public.mensajes m where m.id = mensaje_adjuntos.mensaje_id and public.es_participante(m.conversacion_id)));
create policy "adjuntar archivo a mensaje propio" on public.mensaje_adjuntos for insert to authenticated
  with check (exists (select 1 from public.mensajes m where m.id = mensaje_id and m.autor_id = (select auth.uid())));

create policy "leer lecturas de mis conversaciones" on public.mensaje_lecturas for select to authenticated
  using (exists (select 1 from public.mensajes m where m.id = mensaje_lecturas.mensaje_id and public.es_participante(m.conversacion_id)));
create policy "marcar mensaje como leido" on public.mensaje_lecturas for insert to authenticated
  with check (profile_id = (select auth.uid()) and exists (select 1 from public.mensajes m where m.id = mensaje_id and public.es_participante(m.conversacion_id)));

-- TAREAS DE GESTIÓN
create policy "leer tareas de gestion accesibles" on public.tareas_gestion for select to authenticated
  using (institucion_id = public.mi_institucion() and (responsable_id = (select auth.uid()) or asignado_por = (select auth.uid()) or public.mi_rol() in ('administrador','lider')));
create policy "administrador y lider asignan tareas de gestion" on public.tareas_gestion for insert to authenticated
  with check (institucion_id = public.mi_institucion() and public.mi_rol() in ('administrador','lider') and asignado_por = (select auth.uid()));
create policy "actualizar tarea de gestion" on public.tareas_gestion for update to authenticated
  using (responsable_id = (select auth.uid()) or asignado_por = (select auth.uid()) or public.mi_rol() = 'administrador');
create policy "administrador elimina tareas de gestion" on public.tareas_gestion for delete to authenticated
  using (public.mi_rol() = 'administrador' and institucion_id = public.mi_institucion());

create policy "leer archivos de tarea de gestion accesible" on public.tareas_gestion_archivos for select to authenticated
  using (exists (select 1 from public.tareas_gestion t where t.id = tareas_gestion_archivos.tarea_id and (t.responsable_id = (select auth.uid()) or t.asignado_por = (select auth.uid()) or public.mi_rol() in ('administrador','lider'))));
create policy "adjuntar archivo a tarea de gestion accesible" on public.tareas_gestion_archivos for insert to authenticated
  with check (subido_por = (select auth.uid()) and exists (select 1 from public.tareas_gestion t where t.id = tarea_id and (t.responsable_id = (select auth.uid()) or t.asignado_por = (select auth.uid()) or public.mi_rol() in ('administrador','lider'))));

create policy "leer comentarios de tarea de gestion accesible" on public.tareas_gestion_comentarios for select to authenticated
  using (exists (select 1 from public.tareas_gestion t where t.id = tareas_gestion_comentarios.tarea_id and (t.responsable_id = (select auth.uid()) or t.asignado_por = (select auth.uid()) or public.mi_rol() in ('administrador','lider'))));
create policy "comentar tarea de gestion accesible" on public.tareas_gestion_comentarios for insert to authenticated
  with check (autor_id = (select auth.uid()) and exists (select 1 from public.tareas_gestion t where t.id = tarea_id and (t.responsable_id = (select auth.uid()) or t.asignado_por = (select auth.uid()) or public.mi_rol() in ('administrador','lider'))));

create policy "leer historial de tarea de gestion accesible" on public.tareas_gestion_historial for select to authenticated
  using (exists (select 1 from public.tareas_gestion t where t.id = tareas_gestion_historial.tarea_id and (t.responsable_id = (select auth.uid()) or t.asignado_por = (select auth.uid()) or public.mi_rol() in ('administrador','lider'))));
create policy "insertar historial de tarea de gestion" on public.tareas_gestion_historial for insert to authenticated
  with check (cambiado_por = (select auth.uid()));

-- BIBLIOTECA
create policy "leer biblioteca de mi institucion" on public.biblioteca_categorias for select to authenticated
  using (institucion_id = public.mi_institucion());
create policy "administrador gestiona categorias de biblioteca" on public.biblioteca_categorias for all to authenticated
  using (institucion_id = public.mi_institucion() and public.es_administrador())
  with check (institucion_id = public.mi_institucion() and public.es_administrador());

create policy "leer recursos de biblioteca de mi institucion" on public.biblioteca_recursos for select to authenticated
  using (institucion_id = public.mi_institucion());
create policy "administrador gestiona recursos de biblioteca" on public.biblioteca_recursos for all to authenticated
  using (institucion_id = public.mi_institucion() and public.es_administrador())
  with check (institucion_id = public.mi_institucion() and public.es_administrador());

-- CERTIFICADOS
create policy "leer plantillas de mi institucion" on public.plantillas_certificado for select to authenticated
  using (institucion_id = public.mi_institucion() and public.mi_rol() in ('administrador','lider'));
create policy "administrador gestiona plantillas de certificado" on public.plantillas_certificado for all to authenticated
  using (institucion_id = public.mi_institucion() and public.es_administrador())
  with check (institucion_id = public.mi_institucion() and public.es_administrador());

create policy "leer certificados accesibles" on public.certificados for select to authenticated
  using (estudiante_id = (select auth.uid()) or (institucion_id = public.mi_institucion() and public.mi_rol() in ('administrador','lider')));
create policy "administrador emite certificados" on public.certificados for all to authenticated
  using (institucion_id = public.mi_institucion() and public.es_administrador())
  with check (institucion_id = public.mi_institucion() and public.es_administrador());

-- AUDITORIA: solo lectura para administradores de su propia institución; escritura solo vía funciones security definer.
create policy "administrador lee auditoria de su institucion" on public.auditoria for select to authenticated
  using (institucion_id = public.mi_institucion() and public.es_administrador());

-- ============================================================
-- 15. STORAGE (buckets y políticas)
-- ============================================================

insert into storage.buckets (id, name, public) values
  ('recursos-modulo', 'recursos-modulo', false),
  ('entregas-tareas', 'entregas-tareas', false),
  ('comprobantes-pago', 'comprobantes-pago', false),
  ('biblioteca', 'biblioteca', false),
  ('evidencias-clase', 'evidencias-clase', false),
  ('certificados', 'certificados', true),
  ('mensajes-adjuntos', 'mensajes-adjuntos', false),
  ('marca', 'marca', true),
  ('avatares', 'avatares', true),
  ('tareas-gestion', 'tareas-gestion', false)
on conflict (id) do nothing;

comment on table storage.objects is 'Convención de path: {institucion_id}/... — el primer segmento siempre es el institucion_id del propietario, usado por las políticas para aislar por tenant.';

-- recursos-modulo: {institucion_id}/{modulo_id}/archivo
create policy "leer recursos-modulo de mi institucion" on storage.objects for select to authenticated
  using (bucket_id = 'recursos-modulo' and (storage.foldername(name))[1] = public.mi_institucion()::text);
create policy "staff sube recursos-modulo" on storage.objects for insert to authenticated
  with check (bucket_id = 'recursos-modulo' and (storage.foldername(name))[1] = public.mi_institucion()::text and public.mi_rol() in ('administrador','lider','docente'));
create policy "staff borra recursos-modulo" on storage.objects for delete to authenticated
  using (bucket_id = 'recursos-modulo' and (storage.foldername(name))[1] = public.mi_institucion()::text and public.mi_rol() in ('administrador','lider','docente'));

-- entregas-tareas: {institucion_id}/{estudiante_id}/archivo
create policy "leer entregas-tareas accesibles" on storage.objects for select to authenticated
  using (bucket_id = 'entregas-tareas' and (storage.foldername(name))[1] = public.mi_institucion()::text and ((storage.foldername(name))[2] = auth.uid()::text or public.mi_rol() in ('administrador','lider','docente')));
create policy "estudiante sube su entrega" on storage.objects for insert to authenticated
  with check (bucket_id = 'entregas-tareas' and (storage.foldername(name))[1] = public.mi_institucion()::text and (storage.foldername(name))[2] = auth.uid()::text);
create policy "estudiante borra su entrega" on storage.objects for delete to authenticated
  using (bucket_id = 'entregas-tareas' and (storage.foldername(name))[1] = public.mi_institucion()::text and (storage.foldername(name))[2] = auth.uid()::text);

-- comprobantes-pago: {institucion_id}/{estudiante_id}/archivo
create policy "leer comprobantes-pago accesibles" on storage.objects for select to authenticated
  using (bucket_id = 'comprobantes-pago' and (storage.foldername(name))[1] = public.mi_institucion()::text and ((storage.foldername(name))[2] = auth.uid()::text or public.mi_rol() in ('administrador','lider')));
create policy "estudiante sube su comprobante" on storage.objects for insert to authenticated
  with check (bucket_id = 'comprobantes-pago' and (storage.foldername(name))[1] = public.mi_institucion()::text and (storage.foldername(name))[2] = auth.uid()::text);

-- biblioteca: {institucion_id}/archivo — lectura para todo el tenant, escritura solo administrador
create policy "leer biblioteca storage de mi institucion" on storage.objects for select to authenticated
  using (bucket_id = 'biblioteca' and (storage.foldername(name))[1] = public.mi_institucion()::text);
create policy "administrador sube a biblioteca storage" on storage.objects for all to authenticated
  using (bucket_id = 'biblioteca' and (storage.foldername(name))[1] = public.mi_institucion()::text and public.es_administrador())
  with check (bucket_id = 'biblioteca' and (storage.foldername(name))[1] = public.mi_institucion()::text and public.es_administrador());

-- evidencias-clase: {institucion_id}/{modulo_id}/archivo — solo staff
create policy "staff lee evidencias-clase" on storage.objects for select to authenticated
  using (bucket_id = 'evidencias-clase' and (storage.foldername(name))[1] = public.mi_institucion()::text and public.mi_rol() in ('administrador','lider','docente'));
create policy "staff sube evidencias-clase" on storage.objects for insert to authenticated
  with check (bucket_id = 'evidencias-clase' and (storage.foldername(name))[1] = public.mi_institucion()::text and public.mi_rol() in ('administrador','lider','docente'));

-- certificados: bucket público (necesario para verificación por QR sin sesión). No se crea
-- política de SELECT: al ser bucket público, Storage ya sirve la URL pública del objeto sin
-- necesitar RLS; una política de SELECT solo agregaría la posibilidad de LISTAR/enumerar archivos.
create policy "administrador emite certificados storage" on storage.objects for insert to authenticated
  with check (bucket_id = 'certificados' and (storage.foldername(name))[1] = public.mi_institucion()::text and public.es_administrador());

-- mensajes-adjuntos: {institucion_id}/{conversacion_id}/archivo — participantes de la conversación
create policy "leer mensajes-adjuntos de conversaciones donde participo" on storage.objects for select to authenticated
  using (bucket_id = 'mensajes-adjuntos' and (storage.foldername(name))[1] = public.mi_institucion()::text and public.es_participante(((storage.foldername(name))[2])::uuid));
create policy "adjuntar archivo en mi conversacion" on storage.objects for insert to authenticated
  with check (bucket_id = 'mensajes-adjuntos' and (storage.foldername(name))[1] = public.mi_institucion()::text and public.es_participante(((storage.foldername(name))[2])::uuid));

-- marca: {institucion_id}/archivo — logo del instituto, lectura pública vía bucket público
-- (necesario antes del login); sin política de SELECT por la misma razón que "certificados".
create policy "administrador sube marca" on storage.objects for all to authenticated
  using (bucket_id = 'marca' and (storage.foldername(name))[1] = public.mi_institucion()::text and public.es_administrador())
  with check (bucket_id = 'marca' and (storage.foldername(name))[1] = public.mi_institucion()::text and public.es_administrador());

-- avatares: {profile_id}/archivo — lectura pública vía bucket público, escritura solo dueño
create policy "usuario sube su propio avatar" on storage.objects for all to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

-- tareas-gestion: {institucion_id}/{tarea_id}/archivo — no reutiliza 'biblioteca' (escritura
-- reservada a administrador ahí); aquí puede escribir cualquiera con acceso a la tarea.
create policy "leer archivos de tarea de gestion storage" on storage.objects for select to authenticated
  using (bucket_id = 'tareas-gestion' and (storage.foldername(name))[1] = public.mi_institucion()::text and public.puede_ver_tarea_gestion(((storage.foldername(name))[2])::uuid));
create policy "subir archivo de tarea de gestion storage" on storage.objects for insert to authenticated
  with check (bucket_id = 'tareas-gestion' and (storage.foldername(name))[1] = public.mi_institucion()::text and public.puede_ver_tarea_gestion(((storage.foldername(name))[2])::uuid));

-- ============================================================
-- 16. FUNCIONES DE NEGOCIO (RPC)
-- ============================================================

-- Invitación de usuarios: administrador crea cualquier rol dentro de su institución;
-- líder solo puede crear docentes (regla de negocio explícita).
create or replace function public.crear_usuario_invitado(
  p_documento text,
  p_role text,
  p_nombre_completo text,
  p_email_contacto text default null,
  p_telefono text default null
)
returns table (id uuid, password text)
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  caller_role text;
  caller_institucion uuid;
  v_institucion_slug text;
  new_user_id uuid;
  v_documento text := trim(p_documento);
  v_email text;
  v_password text;
begin
  select role, institucion_id into caller_role, caller_institucion from public.profiles where id = auth.uid();

  if caller_role is null or caller_role not in ('administrador','lider') then
    raise exception 'No autorizado';
  end if;

  if p_role not in ('administrador','lider','docente','estudiante') then
    raise exception 'Rol invalido';
  end if;

  if caller_role = 'lider' and p_role <> 'docente' then
    raise exception 'Un lider solo puede crear cuentas de docente';
  end if;

  if v_documento is null or v_documento = '' then
    raise exception 'Falta el documento de identidad';
  end if;

  if exists (select 1 from public.profiles p where p.institucion_id = caller_institucion and p.documento_identidad = v_documento) then
    raise exception 'Ya existe una cuenta con ese documento en esta institucion';
  end if;

  select slug into v_institucion_slug from public.instituciones where id = caller_institucion;

  v_email := lower(regexp_replace(v_documento, '[^a-zA-Z0-9]', '', 'g')) || '@' || v_institucion_slug || '.celm.local';
  v_password := encode(gen_random_bytes(6), 'base64');
  v_password := regexp_replace(v_password, '[^a-zA-Z0-9]', '', 'g') || 'X7';
  new_user_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    new_user_id, 'authenticated', 'authenticated', v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider','email','providers', array['email']),
    '{}'::jsonb,
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), new_user_id::text, new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', v_email),
    'email', now(), now(), now()
  );

  insert into public.profiles (id, institucion_id, role, nombre_completo, documento_identidad, email_contacto, telefono, debe_cambiar_password)
  values (new_user_id, caller_institucion, p_role, p_nombre_completo, v_documento, p_email_contacto, p_telefono, true);

  insert into public.auditoria (institucion_id, actor_id, accion, entidad, entidad_id, metadata)
  values (caller_institucion, auth.uid(), 'crear_usuario_invitado', 'profiles', new_user_id, jsonb_build_object('role', p_role));

  return query select new_user_id, v_password;
end;
$$;

-- Aprobación de pago (con auditoría) — mantiene la regla de negocio en un solo lugar.
create or replace function public.aprobar_pago(p_pago_id uuid, p_aprobar boolean, p_notas text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_institucion uuid;
begin
  if not public.es_administrador() then
    raise exception 'No autorizado';
  end if;

  select institucion_id into v_institucion from public.pagos where id = p_pago_id;
  if v_institucion is distinct from public.mi_institucion() then
    raise exception 'Pago no encontrado';
  end if;

  update public.pagos
  set estado = case when p_aprobar then 'aprobado' else 'rechazado' end,
      aprobado_por = auth.uid(),
      aprobado_at = now(),
      notas_aprobacion = p_notas
  where id = p_pago_id;

  insert into public.auditoria (institucion_id, actor_id, accion, entidad, entidad_id, metadata)
  values (v_institucion, auth.uid(), case when p_aprobar then 'aprobar_pago' else 'rechazar_pago' end, 'pagos', p_pago_id, jsonb_build_object('notas', p_notas));
end;
$$;

-- Verificación pública de certificado (expone solo campos mínimos, sin sesión).
create or replace function public.verificar_certificado(p_codigo text)
returns table (
  valido boolean,
  nombre_estudiante text,
  nombre_diplomado text,
  nombre_institucion text,
  fecha_emision date
)
language sql
security definer
set search_path = public
stable
as $$
  select
    true as valido,
    p.nombre_completo as nombre_estudiante,
    d.nombre as nombre_diplomado,
    i.nombre as nombre_institucion,
    c.fecha_emision
  from public.certificados c
  join public.profiles p on p.id = c.estudiante_id
  join public.diplomados d on d.id = c.diplomado_id
  join public.instituciones i on i.id = c.institucion_id
  where c.codigo_verificacion = p_codigo;
$$;

grant execute on function public.verificar_certificado(text) to anon, authenticated;

-- Emisión de certificado (con auditoría).
create or replace function public.emitir_certificado(p_estudiante_id uuid, p_diplomado_id uuid, p_plantilla_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_institucion uuid := public.mi_institucion();
begin
  if not public.es_administrador() then
    raise exception 'No autorizado';
  end if;

  insert into public.certificados (institucion_id, estudiante_id, diplomado_id, plantilla_id, emitido_por)
  values (v_institucion, p_estudiante_id, p_diplomado_id, p_plantilla_id, auth.uid())
  returning id into v_id;

  insert into public.auditoria (institucion_id, actor_id, accion, entidad, entidad_id, metadata)
  values (v_institucion, auth.uid(), 'emitir_certificado', 'certificados', v_id, jsonb_build_object('estudiante_id', p_estudiante_id, 'diplomado_id', p_diplomado_id));

  return v_id;
end;
$$;

-- Recalificación manual de una respuesta abierta: actualiza la respuesta y recompone la
-- calificación/estado del intento en una sola transacción (evita tener esta lógica
-- duplicada en el cliente).
create or replace function public.calificar_respuesta_abierta(p_respuesta_id uuid, p_puntos numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intento_id uuid;
  v_modulo_id uuid;
  v_total numeric;
  v_pendiente boolean;
begin
  select er.intento_id, e.modulo_id into v_intento_id, v_modulo_id
  from public.examen_respuestas er
  join public.examen_intentos i on i.id = er.intento_id
  join public.examenes e on e.id = i.examen_id
  where er.id = p_respuesta_id;

  if v_intento_id is null or not public.puede_gestionar_modulo(v_modulo_id) then
    raise exception 'No autorizado';
  end if;

  update public.examen_respuestas set puntos_obtenidos = p_puntos where id = p_respuesta_id;

  select coalesce(sum(puntos_obtenidos), 0),
         bool_or(eq.tipo = 'abierta' and er.puntos_obtenidos is null)
    into v_total, v_pendiente
  from public.examen_respuestas er
  join public.examen_preguntas eq on eq.id = er.pregunta_id
  where er.intento_id = v_intento_id;

  update public.examen_intentos
  set calificacion = v_total,
      requiere_revision_manual = coalesce(v_pendiente, false),
      estado = case when v_pendiente then 'entregado' else 'calificado' end
  where id = v_intento_id;
end;
$$;

-- ============================================================
-- 17. ENDURECIMIENTO DE PERMISOS DE EJECUCIÓN
-- ============================================================
-- Postgres otorga EXECUTE a PUBLIC (incluye anon) por defecto al crear una función.
-- Las funciones auxiliares de RLS solo las necesita el rol authenticated (quien evalúa
-- las políticas); las de trigger no deben invocarse directamente vía RPC por nadie; y las
-- RPC de negocio ya validan el rol internamente pero no deben quedar expuestas a anon.

revoke all on function public.mi_institucion() from public, anon;
revoke all on function public.mi_rol() from public, anon;
revoke all on function public.es_administrador() from public, anon;
revoke all on function public.es_lider_de_diplomado(uuid) from public, anon;
revoke all on function public.es_lider_de_modulo(uuid) from public, anon;
revoke all on function public.es_docente_de_modulo(uuid) from public, anon;
revoke all on function public.esta_matriculado(uuid) from public, anon;
revoke all on function public.esta_matriculado_modulo(uuid) from public, anon;
revoke all on function public.puede_gestionar_modulo(uuid) from public, anon;
revoke all on function public.puede_conversar(uuid, uuid) from public, anon;
revoke all on function public.puede_ver_tarea_gestion(uuid) from public, anon;
grant execute on function public.puede_ver_tarea_gestion(uuid) to authenticated;
revoke all on function public.es_participante(uuid) from public, anon;
grant execute on function public.mi_institucion() to authenticated;
grant execute on function public.mi_rol() to authenticated;
grant execute on function public.es_administrador() to authenticated;
grant execute on function public.es_lider_de_diplomado(uuid) to authenticated;
grant execute on function public.es_lider_de_modulo(uuid) to authenticated;
grant execute on function public.es_docente_de_modulo(uuid) to authenticated;
grant execute on function public.esta_matriculado(uuid) to authenticated;
grant execute on function public.esta_matriculado_modulo(uuid) to authenticated;
grant execute on function public.puede_gestionar_modulo(uuid) to authenticated;
grant execute on function public.puede_conversar(uuid, uuid) to authenticated;
grant execute on function public.es_participante(uuid) to authenticated;

revoke all on function public.calificar_intento_examen() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

revoke all on function public.crear_usuario_invitado(text, text, text, text, text) from public, anon;
grant execute on function public.crear_usuario_invitado(text, text, text, text, text) to authenticated;
revoke all on function public.aprobar_pago(uuid, boolean, text) from public, anon;
grant execute on function public.aprobar_pago(uuid, boolean, text) to authenticated;
revoke all on function public.emitir_certificado(uuid, uuid, uuid) from public, anon;
grant execute on function public.emitir_certificado(uuid, uuid, uuid) to authenticated;
revoke all on function public.calificar_respuesta_abierta(uuid, numeric) from public, anon;
grant execute on function public.calificar_respuesta_abierta(uuid, numeric) to authenticated;

-- ============================================================
-- 18. ÍNDICES DE RENDIMIENTO
-- ============================================================
-- Postgres no indexa automáticamente las columnas de llave foránea. Con RLS evaluando
-- EXISTS/joins sobre estas columnas en casi cada consulta (mi_institucion, puede_gestionar_modulo,
-- es_lider_de_diplomado, etc.), dejarlas sin índice degrada el rendimiento a medida que crecen
-- las tablas. Detectado por el linter de rendimiento de Supabase tras completar el esquema.

create index if not exists idx_asistencia_registros_estudiante_id on public.asistencia_registros(estudiante_id);
create index if not exists idx_asistencia_sesiones_tomada_por on public.asistencia_sesiones(tomada_por);
create index if not exists idx_auditoria_actor_id on public.auditoria(actor_id);
create index if not exists idx_auditoria_institucion_id on public.auditoria(institucion_id);
create index if not exists idx_biblioteca_categorias_institucion_id on public.biblioteca_categorias(institucion_id);
create index if not exists idx_biblioteca_recursos_categoria_id on public.biblioteca_recursos(categoria_id);
create index if not exists idx_biblioteca_recursos_institucion_id on public.biblioteca_recursos(institucion_id);
create index if not exists idx_biblioteca_recursos_subido_por on public.biblioteca_recursos(subido_por);
create index if not exists idx_calificaciones_modulo_calculada_por on public.calificaciones_modulo(calculada_por);
create index if not exists idx_calificaciones_modulo_estudiante_id on public.calificaciones_modulo(estudiante_id);
create index if not exists idx_certificados_diplomado_id on public.certificados(diplomado_id);
create index if not exists idx_certificados_emitido_por on public.certificados(emitido_por);
create index if not exists idx_certificados_institucion_id on public.certificados(institucion_id);
create index if not exists idx_certificados_plantilla_id on public.certificados(plantilla_id);
create index if not exists idx_conceptos_pago_diplomado_id on public.conceptos_pago(diplomado_id);
create index if not exists idx_conceptos_pago_institucion_id on public.conceptos_pago(institucion_id);
create index if not exists idx_conceptos_pago_modulo_id on public.conceptos_pago(modulo_id);
create index if not exists idx_conversacion_participantes_profile_id on public.conversacion_participantes(profile_id);
create index if not exists idx_conversaciones_created_by on public.conversaciones(created_by);
create index if not exists idx_conversaciones_institucion_id on public.conversaciones(institucion_id);
create index if not exists idx_devocionales_creado_por on public.devocionales(creado_por);
create index if not exists idx_devocionales_institucion_id on public.devocionales(institucion_id);
create index if not exists idx_devocionales_modulo_id on public.devocionales(modulo_id);
create index if not exists idx_diplomados_created_by on public.diplomados(created_by);
create index if not exists idx_diplomados_institucion_id on public.diplomados(institucion_id);
create index if not exists idx_evidencias_clase_docente_id on public.evidencias_clase(docente_id);
create index if not exists idx_evidencias_clase_modulo_id on public.evidencias_clase(modulo_id);
create index if not exists idx_examen_intentos_estudiante_id on public.examen_intentos(estudiante_id);
create index if not exists idx_examen_opciones_pregunta_id on public.examen_opciones(pregunta_id);
create index if not exists idx_examen_preguntas_examen_id on public.examen_preguntas(examen_id);
create index if not exists idx_examen_respuestas_opcion_id on public.examen_respuestas(opcion_id);
create index if not exists idx_examen_respuestas_pregunta_id on public.examen_respuestas(pregunta_id);
create index if not exists idx_examenes_creado_por on public.examenes(creado_por);
create index if not exists idx_examenes_modulo_id on public.examenes(modulo_id);
create index if not exists idx_foro_mensajes_autor_id on public.foro_mensajes(autor_id);
create index if not exists idx_foro_mensajes_tema_id on public.foro_mensajes(tema_id);
create index if not exists idx_foro_temas_creado_por on public.foro_temas(creado_por);
create index if not exists idx_foro_temas_modulo_id on public.foro_temas(modulo_id);
create index if not exists idx_matriculas_estudiante_id on public.matriculas(estudiante_id);
create index if not exists idx_mensaje_adjuntos_mensaje_id on public.mensaje_adjuntos(mensaje_id);
create index if not exists idx_mensaje_lecturas_profile_id on public.mensaje_lecturas(profile_id);
create index if not exists idx_mensajes_autor_id on public.mensajes(autor_id);
create index if not exists idx_mensajes_conversacion_id on public.mensajes(conversacion_id);
create index if not exists idx_modulo_docentes_docente_id on public.modulo_docentes(docente_id);
create index if not exists idx_modulos_diplomado_id on public.modulos(diplomado_id);
create index if not exists idx_ofrendas_donante_id on public.ofrendas(donante_id);
create index if not exists idx_ofrendas_institucion_id on public.ofrendas(institucion_id);
create index if not exists idx_ofrendas_registrado_por on public.ofrendas(registrado_por);
create index if not exists idx_pagos_aprobado_por on public.pagos(aprobado_por);
create index if not exists idx_pagos_concepto_id on public.pagos(concepto_id);
create index if not exists idx_pagos_created_by on public.pagos(created_by);
create index if not exists idx_pagos_estudiante_id on public.pagos(estudiante_id);
create index if not exists idx_pagos_institucion_id on public.pagos(institucion_id);
create index if not exists idx_peticiones_oracion_autor_id on public.peticiones_oracion(autor_id);
create index if not exists idx_peticiones_oracion_institucion_id on public.peticiones_oracion(institucion_id);
create index if not exists idx_peticiones_oracion_modulo_id on public.peticiones_oracion(modulo_id);
create index if not exists idx_plantillas_certificado_institucion_id on public.plantillas_certificado(institucion_id);
create index if not exists idx_recursos_modulo_modulo_id on public.recursos_modulo(modulo_id);
create index if not exists idx_recursos_modulo_subido_por on public.recursos_modulo(subido_por);
create index if not exists idx_tareas_academicas_creado_por on public.tareas_academicas(creado_por);
create index if not exists idx_tareas_academicas_modulo_id on public.tareas_academicas(modulo_id);
create index if not exists idx_tareas_academicas_entregas_calificado_por on public.tareas_academicas_entregas(calificado_por);
create index if not exists idx_tareas_academicas_entregas_estudiante_id on public.tareas_academicas_entregas(estudiante_id);
create index if not exists idx_tareas_gestion_asignado_por on public.tareas_gestion(asignado_por);
create index if not exists idx_tareas_gestion_institucion_id on public.tareas_gestion(institucion_id);
create index if not exists idx_tareas_gestion_responsable_id on public.tareas_gestion(responsable_id);
create index if not exists idx_tareas_gestion_archivos_subido_por on public.tareas_gestion_archivos(subido_por);
create index if not exists idx_tareas_gestion_archivos_tarea_id on public.tareas_gestion_archivos(tarea_id);
create index if not exists idx_tareas_gestion_comentarios_autor_id on public.tareas_gestion_comentarios(autor_id);
create index if not exists idx_tareas_gestion_comentarios_tarea_id on public.tareas_gestion_comentarios(tarea_id);
create index if not exists idx_tareas_gestion_historial_cambiado_por on public.tareas_gestion_historial(cambiado_por);
create index if not exists idx_tareas_gestion_historial_tarea_id on public.tareas_gestion_historial(tarea_id);
