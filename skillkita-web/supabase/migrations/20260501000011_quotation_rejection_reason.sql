-- Optional admin-provided reason when a quotation request is rejected.

alter table public.quotation_requests
  add column if not exists rejection_reason text;
