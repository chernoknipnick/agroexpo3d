-- АгроЭкспо 3D: журнал посетителей.
-- Выполнить один раз в Supabase → SQL Editor → New query → Run.

create table if not exists public.events (
  id       uuid primary key default gen_random_uuid(),
  at       timestamptz not null default now(),
  visitor  uuid not null,            -- постоянный id браузера посетителя
  session  uuid not null,            -- id одного захода
  nick     text,
  role     text,
  region   text,
  farm     text,
  points   int,
  level    int,
  action   text not null
);
create index if not exists events_visitor_at on public.events (visitor, at);

-- Сайт может только добавлять строки. Читать и менять их может только владелец проекта из панели Supabase.
alter table public.events enable row level security;
drop policy if exists "site inserts events" on public.events;
create policy "site inserts events" on public.events for insert to anon
  with check (
    char_length(action) <= 300
    and char_length(coalesce(nick, '')) <= 60
    and char_length(coalesce(farm, '')) <= 80
    and char_length(coalesce(region, '')) <= 80
    and char_length(coalesce(role, '')) <= 40
    and coalesce(points, 0) between 0 and 100000
  );
grant insert on public.events to anon;

-- Сводка по посетителям: кто, когда впервые и в последний раз, сколько заходов, баллов и действий.
create or replace view public.visitors with (security_invoker = on) as
select
  visitor,
  (array_agg(nick   order by at desc))[1] as nick,
  (array_agg(role   order by at desc))[1] as role,
  (array_agg(region order by at desc))[1] as region,
  (array_agg(farm   order by at desc))[1] as farm,
  max(points)                              as points,
  max(level)                               as level,
  count(distinct session)                  as visits,
  count(*)                                 as actions,
  min(at)                                  as first_seen,
  max(at)                                  as last_seen
from public.events
group by visitor
order by last_seen desc;
revoke all on public.visitors from anon, authenticated;
