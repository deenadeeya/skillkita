-- Original upload filenames for course documents (storage paths use UUIDs).

alter table public.course_private_files
  add column if not exists syllabus_file_name text,
  add column if not exists tentative_file_name text,
  add column if not exists trainer_hrd_file_name text,
  add column if not exists trainer_cv_file_name text;
