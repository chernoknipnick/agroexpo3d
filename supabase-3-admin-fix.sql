-- АгроЭкспо 3D, часть 3: исправление проверки админа.
-- Правило чтения журнала проверяло таблицу admins от имени вошедшего пользователя, а admins закрыта RLS,
-- поэтому проверка не видела ни одной строки и админ не мог читать журнал. Теперь проверка идёт через функцию
-- с правами владельца базы. Выполнить один раз в SQL Editor.

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where uid = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admins read events" on public.events;
create policy "admins read events" on public.events for select to authenticated
  using (public.is_admin());

-- проверка: список админов
select u.email as admin from public.admins a join auth.users u on u.id = a.uid;
