create table if not exists public.hardware_lab_feedback (
  id uuid primary key default gen_random_uuid(),
  feedback_type text not null check (feedback_type in ('bug', 'suggestion')),
  message text not null check (char_length(message) between 20 and 4000),
  contact_email text check (contact_email is null or char_length(contact_email) <= 320),
  image_paths text[] not null default '{}',
  status text not null default 'new' check (status in ('new', 'reviewed', 'resolved')),
  upload_token uuid default gen_random_uuid(),
  source_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hardware_lab_feedback_created_idx
on public.hardware_lab_feedback (created_at desc);

create index if not exists hardware_lab_feedback_status_idx
on public.hardware_lab_feedback (status, created_at desc);

drop trigger if exists hardware_lab_feedback_set_updated_at on public.hardware_lab_feedback;
create trigger hardware_lab_feedback_set_updated_at
before update on public.hardware_lab_feedback
for each row execute function public.set_updated_at();

alter table public.hardware_lab_feedback enable row level security;

drop policy if exists "Admins can read hardware lab feedback" on public.hardware_lab_feedback;
create policy "Admins can read hardware lab feedback"
on public.hardware_lab_feedback for select
to authenticated
using (public.is_shop_admin());

drop policy if exists "Admins can update hardware lab feedback" on public.hardware_lab_feedback;
create policy "Admins can update hardware lab feedback"
on public.hardware_lab_feedback for update
to authenticated
using (public.is_shop_admin())
with check (public.is_shop_admin());

drop policy if exists "Admins can delete hardware lab feedback" on public.hardware_lab_feedback;
create policy "Admins can delete hardware lab feedback"
on public.hardware_lab_feedback for delete
to authenticated
using (public.is_shop_admin());

create or replace function public.create_hardware_lab_feedback(
  p_feedback_type text,
  p_message text,
  p_contact_email text default null,
  p_website text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_feedback public.hardware_lab_feedback;
  v_headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  v_source text;
  v_source_hash text;
begin
  if coalesce(trim(p_website), '') <> '' then
    raise exception 'feedback_rejected';
  end if;

  if p_feedback_type not in ('bug', 'suggestion') then
    raise exception 'invalid_feedback_type';
  end if;

  p_message := trim(coalesce(p_message, ''));
  if char_length(p_message) < 20 or char_length(p_message) > 4000 then
    raise exception 'invalid_feedback_message';
  end if;

  p_contact_email := nullif(trim(coalesce(p_contact_email, '')), '');
  if p_contact_email is not null and (
    char_length(p_contact_email) > 320
    or p_contact_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ) then
    raise exception 'invalid_feedback_email';
  end if;

  v_source := coalesce(
    split_part(v_headers ->> 'x-forwarded-for', ',', 1),
    v_headers ->> 'cf-connecting-ip',
    v_headers ->> 'x-real-ip'
  );
  v_source_hash := case when nullif(trim(v_source), '') is null then null else md5(trim(v_source)) end;

  if v_source_hash is not null and (
    select count(*)
    from public.hardware_lab_feedback feedback
    where feedback.source_hash = v_source_hash
      and feedback.created_at > now() - interval '1 hour'
  ) >= 8 then
    raise exception 'feedback_rate_limit';
  end if;

  insert into public.hardware_lab_feedback (
    feedback_type,
    message,
    contact_email,
    source_hash
  ) values (
    p_feedback_type,
    p_message,
    p_contact_email,
    v_source_hash
  )
  returning * into v_feedback;

  return jsonb_build_object(
    'id', v_feedback.id,
    'upload_token', v_feedback.upload_token
  );
end;
$$;

create or replace function public.can_upload_hardware_lab_feedback(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.hardware_lab_feedback feedback
    where feedback.id::text = split_part(p_name, '/', 1)
      and feedback.upload_token::text = split_part(p_name, '/', 2)
      and feedback.upload_token is not null
      and feedback.created_at > now() - interval '30 minutes'
  );
$$;

create or replace function public.finalize_hardware_lab_feedback(
  p_feedback_id uuid,
  p_upload_token uuid,
  p_image_paths text[] default '{}'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(cardinality(p_image_paths), 0) > 3 then
    raise exception 'too_many_feedback_images';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_image_paths, '{}')) as image_path
    where split_part(image_path, '/', 1) <> p_feedback_id::text
      or split_part(image_path, '/', 2) <> p_upload_token::text
  ) then
    raise exception 'invalid_feedback_image_path';
  end if;

  update public.hardware_lab_feedback
  set image_paths = coalesce(p_image_paths, '{}'),
      upload_token = null
  where id = p_feedback_id
    and upload_token = p_upload_token
    and created_at > now() - interval '30 minutes';

  return found;
end;
$$;

create or replace function public.cancel_hardware_lab_feedback(
  p_feedback_id uuid,
  p_upload_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.hardware_lab_feedback
  where id = p_feedback_id
    and upload_token = p_upload_token
    and created_at > now() - interval '30 minutes';

  return found;
end;
$$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'hardware-lab-feedback',
  'hardware-lab-feedback',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Visitors can upload hardware lab feedback images" on storage.objects;
create policy "Visitors can upload hardware lab feedback images"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'hardware-lab-feedback'
  and public.can_upload_hardware_lab_feedback(name)
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
);

drop policy if exists "Visitors can remove unfinished hardware lab feedback images" on storage.objects;
create policy "Visitors can remove unfinished hardware lab feedback images"
on storage.objects for delete
to anon, authenticated
using (
  bucket_id = 'hardware-lab-feedback'
  and public.can_upload_hardware_lab_feedback(name)
);

drop policy if exists "Admins can read hardware lab feedback images" on storage.objects;
create policy "Admins can read hardware lab feedback images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'hardware-lab-feedback'
  and public.is_shop_admin()
);

drop policy if exists "Admins can delete hardware lab feedback images" on storage.objects;
create policy "Admins can delete hardware lab feedback images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'hardware-lab-feedback'
  and public.is_shop_admin()
);

revoke all on public.hardware_lab_feedback from anon, authenticated;
grant select, delete on public.hardware_lab_feedback to authenticated;
grant update (status) on public.hardware_lab_feedback to authenticated;

revoke all on function public.create_hardware_lab_feedback(text, text, text, text) from public;
revoke all on function public.finalize_hardware_lab_feedback(uuid, uuid, text[]) from public;
revoke all on function public.cancel_hardware_lab_feedback(uuid, uuid) from public;
revoke all on function public.can_upload_hardware_lab_feedback(text) from public;

grant execute on function public.create_hardware_lab_feedback(text, text, text, text) to anon, authenticated;
grant execute on function public.finalize_hardware_lab_feedback(uuid, uuid, text[]) to anon, authenticated;
grant execute on function public.cancel_hardware_lab_feedback(uuid, uuid) to anon, authenticated;
grant execute on function public.can_upload_hardware_lab_feedback(text) to anon, authenticated;
