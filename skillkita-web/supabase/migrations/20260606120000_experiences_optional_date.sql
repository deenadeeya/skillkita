-- Experience date is optional; null when not set.

alter table public.experiences
  alter column date drop not null;
