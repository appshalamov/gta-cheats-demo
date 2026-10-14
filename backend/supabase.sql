-- Secret Base · фото сообщества, лайки, баллы.  Supabase (Postgres 15+). Выполнить целиком в SQL Editor.
-- Принципы:
--   * баллы начисляет только база (триггеры, security definer) — клиент не может себе их записать;
--   * фото сначала «на проверке» (pending), видно только автору; после одобрения модератором — всем, и тогда же баллы;
--   * «рядом с местом» (dist_m) присылает клиент, поэтому бонус за это — только вместе с одобрением модератора;
--   * лайк — один на пользователя и фото; за лайк своего фото баллов нет; анонимные аккаунты лайкают и грузят наравне,
--     но вывод/обмен баллов (в будущем) — только для подтверждённых аккаунтов.

-- ───── таблицы ─────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text check (char_length(display_name) <= 40),
  is_moderator boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  place_key text not null check (place_key ~ '^(gta5|gta6):[a-z0-9:_-]{1,120}$'),   -- «gta6:gta6-hotel-victor»
  path text not null, thumb_path text,
  kind text not null default 'ground' check (kind in ('ground', 'night', 'drone')),
  width int, height int,
  taken_lat double precision, taken_lon double precision,
  gps_from text check (gps_from in ('exif', 'device')),
  dist_m double precision,
  on_site boolean generated always as (dist_m is not null and dist_m <= 300) stored,
  license text not null default 'CC BY 4.0',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  likes_count int not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists photos_place_idx on public.photos (place_key, status, likes_count desc);
create index if not exists photos_user_idx on public.photos (user_id, created_at desc);

create table if not exists public.likes (
  photo_id uuid not null references public.photos on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id, user_id)
);

create table if not exists public.points_ledger (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  delta int not null,
  reason text not null check (reason in ('upload', 'on_site', 'drone', 'like_received', 'like_removed', 'featured', 'adjust')),
  ref uuid,
  created_at timestamptz not null default now()
);
create index if not exists ledger_user_idx on public.points_ledger (user_id, created_at desc);
-- одна награда каждого вида за одно фото (кроме лайков)
create unique index if not exists ledger_once_idx on public.points_ledger (ref, reason) where reason in ('upload', 'on_site', 'drone', 'featured');

-- ───── представления для приложения ─────
create or replace view public.photos_public with (security_invoker = true) as
  select p.id, p.user_id, p.place_key, p.path, p.thumb_path, p.kind, p.on_site, p.license, p.status, p.likes_count,
         p.featured, p.created_at, coalesce(pr.display_name, 'Игрок') as author
  from public.photos p left join public.profiles pr on pr.id = p.user_id;

create or replace view public.profile_points with (security_invoker = true) as
  select user_id, coalesce(sum(delta), 0)::int as points,
         count(*) filter (where reason = 'upload')::int as uploads
  from public.points_ledger group by user_id;

-- ───── права (RLS) ─────
alter table public.profiles enable row level security;
alter table public.photos enable row level security;
alter table public.likes enable row level security;
alter table public.points_ledger enable row level security;

create policy profiles_read on public.profiles for select using (true);
create policy profiles_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and is_moderator = false);

create policy photos_read on public.photos for select using (status = 'approved' or user_id = auth.uid()
  or exists (select 1 from public.profiles m where m.id = auth.uid() and m.is_moderator));
create policy photos_insert on public.photos for insert with check (user_id = auth.uid() and status = 'pending'
  and likes_count = 0 and featured = false);
create policy photos_delete_own on public.photos for delete using (user_id = auth.uid());
create policy photos_moderate on public.photos for update using (exists (select 1 from public.profiles m where m.id = auth.uid() and m.is_moderator));

create policy likes_read_own on public.likes for select using (user_id = auth.uid());
create policy likes_insert_own on public.likes for insert with check (user_id = auth.uid()
  and exists (select 1 from public.photos p where p.id = photo_id and p.status = 'approved'));
create policy likes_delete_own on public.likes for delete using (user_id = auth.uid());

create policy ledger_read_own on public.points_ledger for select using (user_id = auth.uid());
-- вставки в points_ledger — только из триггеров ниже (security definer)

-- ───── триггеры ─────
-- профиль на каждого нового пользователя (в том числе анонимного)
create or replace function public.on_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id) values (new.id) on conflict do nothing; return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.on_new_user();

-- не больше 20 фото в сутки от одного пользователя
create or replace function public.limit_uploads() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.photos where user_id = new.user_id and created_at > now() - interval '1 day') >= 20 then
    raise exception 'upload limit reached';
  end if;
  return new;
end $$;
drop trigger if exists photos_limit on public.photos;
create trigger photos_limit before insert on public.photos for each row execute function public.limit_uploads();

-- одобрение модератором → баллы за фото, бонусы «на месте» и «дрон»
create or replace function public.on_photo_reviewed() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.reviewed_at := now();
    insert into public.points_ledger (user_id, delta, reason, ref) values (new.user_id, 10, 'upload', new.id) on conflict do nothing;
    if new.on_site then insert into public.points_ledger (user_id, delta, reason, ref) values (new.user_id, 5, 'on_site', new.id) on conflict do nothing; end if;
    if new.kind = 'drone' then insert into public.points_ledger (user_id, delta, reason, ref) values (new.user_id, 20, 'drone', new.id) on conflict do nothing; end if;
  elsif new.status = 'rejected' then
    new.reviewed_at := now();
  end if;
  return new;
end $$;
drop trigger if exists photos_reviewed on public.photos;
create trigger photos_reviewed before update of status on public.photos for each row execute function public.on_photo_reviewed();

-- лайк: счётчик, +1 автору (не за свой лайк), «главное фото места» при ≥ 5 лайках и лидерстве → +50 один раз
create or replace function public.on_like() returns trigger language plpgsql security definer set search_path = public as $$
declare ph public.photos; top uuid;
begin
  if tg_op = 'INSERT' then
    update public.photos set likes_count = likes_count + 1 where id = new.photo_id returning * into ph;
    if ph.user_id <> new.user_id then
      insert into public.points_ledger (user_id, delta, reason, ref) values (ph.user_id, 1, 'like_received', ph.id);
    end if;
    select id into top from public.photos where place_key = ph.place_key and status = 'approved'
      order by likes_count desc, created_at asc limit 1;
    if top = ph.id and ph.likes_count >= 5 and not ph.featured then
      update public.photos set featured = (id = ph.id) where place_key = ph.place_key;
      insert into public.points_ledger (user_id, delta, reason, ref) values (ph.user_id, 50, 'featured', ph.id) on conflict do nothing;
    end if;
    return new;
  else
    update public.photos set likes_count = greatest(likes_count - 1, 0) where id = old.photo_id returning * into ph;
    if ph.user_id <> old.user_id then
      insert into public.points_ledger (user_id, delta, reason, ref) values (ph.user_id, -1, 'like_removed', ph.id);
    end if;
    return old;
  end if;
end $$;
drop trigger if exists likes_changed on public.likes;
create trigger likes_changed after insert or delete on public.likes for each row execute function public.on_like();

-- ───── хранилище фото ─────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('place-photos', 'place-photos', true, 5242880, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg'];

create policy place_photos_read on storage.objects for select using (bucket_id = 'place-photos');
create policy place_photos_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'place-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy place_photos_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'place-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Включить в Authentication → Providers: «Anonymous sign-ins» (анонимные аккаунты на устройство).
-- Модератор: update public.profiles set is_moderator = true where id = '<uuid>';
-- Одобрить фото: update public.photos set status = 'approved' where id = '<uuid>';
