-- Course date is optional; null when not scheduled yet.

alter table public.courses
  alter column date drop not null;
