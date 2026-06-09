-- Employers no longer require admin approval before using employer features.
-- Sign-ups are created as approved (see handle_new_user); backfill any legacy pending rows.

update public.user_profiles
set
  status = 'approved',
  approved_at = coalesce(approved_at, now())
where role = 'employer'
  and status = 'pending';

drop policy if exists "quotation_insert_employer" on public.quotation_requests;
create policy "quotation_insert_employer"
on public.quotation_requests for insert
to authenticated
with check (
  employer_user_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1
    from public.user_profiles up
    where up.user_id = auth.uid()
      and up.role = 'employer'
      and up.status <> 'rejected'
  )
);

drop policy if exists "employer_doc_sub_insert_employer" on public.employer_document_submissions;
create policy "employer_doc_sub_insert_employer"
on public.employer_document_submissions for insert
to authenticated
with check (
  employer_user_id = auth.uid()
  and status = 'pending'
  and submission_type in ('jd14', 'payment_receipt')
  and exists (
    select 1
    from public.user_profiles up
    where up.user_id = auth.uid()
      and up.role = 'employer'
      and up.status <> 'rejected'
  )
);

drop policy if exists "jd14_templates_select_admin_or_employer" on public.jd14_submission_templates;
create policy "jd14_templates_select_admin_or_employer"
on public.jd14_submission_templates for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.user_profiles up
    where up.user_id = auth.uid()
      and up.role = 'employer'
      and up.status <> 'rejected'
  )
);

drop policy if exists "employer_documents_employer_jd14_templates_select" on storage.objects;
create policy "employer_documents_employer_jd14_templates_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'employer-documents'
  and split_part(name, '/', 1) = 'jd14_templates'
  and exists (
    select 1
    from public.user_profiles up
    where up.user_id = auth.uid()
      and up.role = 'employer'
      and up.status <> 'rejected'
  )
);

drop policy if exists "chat_conversations_insert_employer" on public.chat_conversations;
create policy "chat_conversations_insert_employer"
on public.chat_conversations for insert
to authenticated
with check (
  employer_user_id = auth.uid()
  and exists (
    select 1
    from public.user_profiles up
    where up.user_id = auth.uid()
      and up.role = 'employer'
      and up.status <> 'rejected'
  )
  and exists (
    select 1
    from public.user_profiles up2
    where up2.user_id = admin_user_id
      and up2.role = 'admin'
  )
);

notify pgrst, 'reload schema';
