-- Ensure anonymous visitors can read company experiences.

drop policy if exists "experiences_select_all" on public.experiences;
create policy "experiences_select_all"
on public.experiences for select
to anon, authenticated
using (true);
