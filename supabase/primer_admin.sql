-- ============================================================
-- Alta de un programa nuevo + su primer administrador (equivalente SQL de crear_programa)
-- Requiere haber ejecutado antes supabase/schema.sql en el mismo proyecto.
-- Se ejecuta como superusuario (SQL Editor de Supabase), UNA vez por institución nueva.
-- Edita los valores marcados con CAMBIAR antes de correrlo.
-- ============================================================

do $$
declare
  v_nombre_institucion text := 'CAMBIAR: Nombre del instituto';
  v_slug text := 'CAMBIAR-slug-unico';              -- solo minúsculas, números y guiones
  v_email text := 'CAMBIAR@correo.com';              -- correo real del primer administrador
  v_password text := 'CAMBIAR-contraseña-temporal';  -- se le pide cambiarla al entrar
  v_nombre_admin text := 'CAMBIAR Nombre Completo';

  v_institucion_id uuid;
  v_user_id uuid := gen_random_uuid();
begin
  insert into public.instituciones (nombre, slug)
  values (v_nombre_institucion, v_slug)
  returning id into v_institucion_id;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id, 'authenticated', 'authenticated', v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider','email','providers', array['email']),
    '{}'::jsonb,
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), v_user_id::text, v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email', now(), now(), now()
  );

  insert into public.profiles (id, institucion_id, role, nombre_completo, email_contacto, debe_cambiar_password)
  values (v_user_id, v_institucion_id, 'administrador', v_nombre_admin, v_email, true);

  raise notice 'Institución % creada (id=%). Administrador: % / contraseña temporal indicada arriba.', v_nombre_institucion, v_institucion_id, v_email;
end $$;
