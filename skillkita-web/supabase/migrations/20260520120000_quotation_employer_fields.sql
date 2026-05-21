-- Employer quotation request: location address and employer-filled pricing/mode at submit time.

alter table public.quotation_requests
  add column if not exists course_location_address text;
