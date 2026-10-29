-- АгроЭкспо 3D, часть 2: рейтинг дня и доступ к статистике для админа.
-- Перед запуском создайте себе пользователя: Authentication → Users → Add user → Create new user
-- (email и пароль, галочка Auto Confirm User). Потом выполните этот файл в SQL Editor.

-- Рейтинг дня для табло в павильоне: последний ник, хозяйство, регион и баллы каждого, кто играл сегодня (по Москве).
create or replace function public.leaders_today()
returns table (visitor uuid, nick text, farm text, region text, points int, level int)
language sql stable security definer set search_path = public as $$
  select * from (
    select distinct on (e.visitor) e.visitor, e.nick, e.farm, e.region, e.points, e.level
    from public.events e
    where e.at >= (date_trunc('day', now() at time zone 'Europe/Moscow') at time zone 'Europe/Moscow')
    order by e.visitor, e.at desc
  ) t
  where t.points > 0
  order by t.points desc
  limit 50;
$$;
revoke all on function public.leaders_today() from public;
grant execute on function public.leaders_today() to anon, authenticated;

-- Админы: читать журнал может только вошедший пользователь из этой таблицы.
create table if not exists public.admins (uid uuid primary key references auth.users (id) on delete cascade);
alter table public.admins enable row level security;
drop policy if exists "admins read events" on public.events;
-- проверка через функцию с правами владельца: сама таблица admins закрыта RLS и изнутри правила не видна
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where uid = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
create policy "admins read events" on public.events for select to authenticated
  using (public.is_admin());
grant select on public.events to authenticated;
grant select on public.visitors to authenticated;

-- Делает админами всех уже созданных пользователей (то есть вас). Запускайте до того, как кто-то ещё сможет зарегистрироваться.
insert into public.admins (uid) select id from auth.users on conflict do nothing;
select u.email as admin from public.admins a join auth.users u on u.id = a.uid;
