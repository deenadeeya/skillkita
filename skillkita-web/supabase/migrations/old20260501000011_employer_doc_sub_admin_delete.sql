-- Allow admins to delete employer JD14 and payment receipt submissions.

drop policy if exists "employer_doc_sub_delete_admin" on public.employer_document_submissions;
create policy "employer_doc_sub_delete_admin"
on public.employer_document_submissions for delete
to authenticated
using (public.is_admin());

notify pgrst, 'reload schema';
