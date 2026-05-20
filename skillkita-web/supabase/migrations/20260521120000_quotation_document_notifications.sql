-- Extend in-app notifications for quotation requests and document submissions (JD14 / payment receipt).
-- Run after chat_notifications.sql, quotations.sql, employer_document_submissions.sql.

-- Relax chat-only columns and kind constraint.
alter table public.user_notifications
  alter column conversation_id drop not null,
  alter column message_id drop not null,
  alter column employer_user_id drop not null,
  alter column admin_user_id drop not null;

alter table public.user_notifications drop constraint if exists user_notifications_kind_check;

alter table public.user_notifications
  add column if not exists quotation_request_id uuid references public.quotation_requests(id) on delete cascade,
  add column if not exists document_submission_id uuid references public.employer_document_submissions(id) on delete cascade;

alter table public.user_notifications
  add constraint user_notifications_kind_check check (
    kind in (
      'chat_message',
      'quotation_request_new',
      'quotation_request_reviewed',
      'document_submission_new'
    )
  );

-- Replace single message_id unique with kind-specific partial uniques.
alter table public.user_notifications drop constraint if exists user_notifications_message_id_key;

create unique index if not exists user_notifications_message_id_uq
  on public.user_notifications (message_id)
  where message_id is not null;

create unique index if not exists user_notifications_quotation_per_user_uq
  on public.user_notifications (user_id, kind, quotation_request_id)
  where quotation_request_id is not null;

create unique index if not exists user_notifications_document_per_user_uq
  on public.user_notifications (user_id, kind, document_submission_id)
  where document_submission_id is not null;

-- All admin accounts (user_profiles.role = admin and legacy admin_users).
create or replace function public.admin_user_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.user_id
  from public.user_profiles p
  where p.role = 'admin'
  union
  select au.user_id
  from public.admin_users au;
$$;

create or replace function public.notify_all_admins(
  p_kind text,
  p_preview text,
  p_sender_user_id uuid,
  p_employer_user_id uuid,
  p_quotation_request_id uuid default null,
  p_document_submission_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid;
begin
  for admin_id in select public.admin_user_ids() loop
    insert into public.user_notifications (
      user_id,
      kind,
      sender_user_id,
      employer_user_id,
      preview,
      quotation_request_id,
      document_submission_id
    )
    values (
      admin_id,
      p_kind,
      p_sender_user_id,
      p_employer_user_id,
      left(btrim(p_preview), 200),
      p_quotation_request_id,
      p_document_submission_id
    )
    on conflict do nothing;
  end loop;
end;
$$;

create or replace function public.enqueue_quotation_request_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  preview text;
  qno text;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  qno :=
    case
      when new.quotation_no is not null then '#' || lpad(new.quotation_no::text, 4, '0')
      else ''
    end;

  preview := 'New quotation request' || qno || ': ' || left(btrim(new.course_name), 120);

  perform public.notify_all_admins(
    'quotation_request_new',
    preview,
    new.employer_user_id,
    new.employer_user_id,
    new.id,
    null
  );

  return new;
end;
$$;

drop trigger if exists quotation_requests_notify_admins on public.quotation_requests;
create trigger quotation_requests_notify_admins
after insert on public.quotation_requests
for each row
execute function public.enqueue_quotation_request_notification();

create or replace function public.enqueue_quotation_reviewed_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  preview text;
  qno text;
  status_label text;
begin
  if old.status = 'pending'
     and new.status in ('approved', 'rejected')
     and new.reviewed_at is not null
     and new.employer_user_id is not null then
    status_label := case when new.status = 'approved' then 'approved' else 'rejected' end;
    qno :=
      case
        when new.quotation_no is not null then ' #' || lpad(new.quotation_no::text, 4, '0')
        else ''
      end;
    preview := 'Quotation' || qno || ' ' || status_label || ': ' || left(btrim(new.course_name), 120);

    insert into public.user_notifications (
      user_id,
      kind,
      sender_user_id,
      employer_user_id,
      preview,
      quotation_request_id
    )
    values (
      new.employer_user_id,
      'quotation_request_reviewed',
      coalesce(new.reviewed_by, new.employer_user_id),
      new.employer_user_id,
      preview,
      new.id
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists quotation_requests_notify_employer_reviewed on public.quotation_requests;
create trigger quotation_requests_notify_employer_reviewed
after update on public.quotation_requests
for each row
execute function public.enqueue_quotation_reviewed_notification();

create or replace function public.enqueue_document_submission_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  preview text;
  type_label text;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  type_label :=
    case new.submission_type
      when 'jd14' then 'JD14'
      when 'payment_receipt' then 'Payment receipt'
      else 'Document'
    end;

  preview := 'New ' || type_label || ' submission: ' || left(btrim(new.course_name), 120);

  perform public.notify_all_admins(
    'document_submission_new',
    preview,
    new.employer_user_id,
    new.employer_user_id,
    null,
    new.id
  );

  return new;
end;
$$;

drop trigger if exists employer_doc_sub_notify_admins on public.employer_document_submissions;
create trigger employer_doc_sub_notify_admins
after insert on public.employer_document_submissions
for each row
execute function public.enqueue_document_submission_notification();
