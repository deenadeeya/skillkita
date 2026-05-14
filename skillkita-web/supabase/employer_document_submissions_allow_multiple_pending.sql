-- Run once if you already applied employer_document_submissions.sql with the
-- "one pending per employer" unique index. Removes that restriction.
drop index if exists public.employer_doc_sub_one_pending_per_type;
