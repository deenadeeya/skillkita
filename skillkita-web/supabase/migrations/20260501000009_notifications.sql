-- In-app notifications: chat, quotation requests, document submissions.
-- Requires: chat, quotations, employer_document_submissions.

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in (
    'chat_message',
    'quotation_request_new',
    'quotation_request_reviewed',
    'document_submission_new'
  )),
  conversation_id uuid references public.chat_conversations(id) on delete cascade,
  message_id uuid references public.chat_messages(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  employer_user_id uuid references auth.users(id) on delete cascade,
  admin_user_id uuid references auth.users(id) on delete cascade,
  quotation_request_id uuid references public.quotation_requests(id) on delete cascade,
  document_submission_id uuid references public.employer_document_submissions(id) on delete cascade,
  preview text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create unique index if not exists user_notifications_message_id_uq
  on public.user_notifications (message_id)
  where message_id is not null;

create unique index if not exists user_notifications_quotation_per_user_uq
  on public.user_notifications (user_id, kind, quotation_request_id)
  where quotation_request_id is not null;

create unique index if not exists user_notifications_document_per_user_uq
  on public.user_notifications (user_id, kind, document_submission_id)
  where document_submission_id is not null;

create index if not exists user_notifications_user_unread_idx
  on public.user_notifications (user_id, read_at, created_at desc);

alter table public.user_notifications enable row level security;

grant select, update on public.user_notifications to authenticated;

drop policy if exists "user_notifications_select_own" on public.user_notifications;
create policy "user_notifications_select_own"
on public.user_notifications for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_notifications_update_own" on public.user_notifications;
create policy "user_notifications_update_own"
on public.user_notifications for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Chat message notifications
create or replace function public.enqueue_chat_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv record;
  recipient uuid;
  preview text;
begin
  select c.employer_user_id, c.admin_user_id
  into conv
  from public.chat_conversations c
  where c.id = new.conversation_id;

  if conv.employer_user_id is null then
    return new;
  end if;

  if new.sender_user_id = conv.employer_user_id then
    recipient := conv.admin_user_id;
  elsif new.sender_user_id = conv.admin_user_id then
    recipient := conv.employer_user_id;
  else
    return new;
  end if;

  preview :=
    case
      when new.body is not null and btrim(new.body) <> '' then left(btrim(new.body), 200)
      else 'Sent a file'
    end;

  insert into public.user_notifications (
    user_id,
    kind,
    conversation_id,
    message_id,
    sender_user_id,
    employer_user_id,
    admin_user_id,
    preview
  )
  values (
    recipient,
    'chat_message',
    new.conversation_id,
    new.id,
    new.sender_user_id,
    conv.employer_user_id,
    conv.admin_user_id,
    preview
  )
  on conflict (message_id) where message_id is not null do nothing;

  return new;
end;
$$;

drop trigger if exists chat_messages_notify_recipient on public.chat_messages;
create trigger chat_messages_notify_recipient
after insert on public.chat_messages
for each row
execute function public.enqueue_chat_message_notification();

-- Admin notification helpers
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
    if p_quotation_request_id is not null then
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
      on conflict (user_id, kind, quotation_request_id)
        where quotation_request_id is not null
      do nothing;
    elsif p_document_submission_id is not null then
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
      on conflict (user_id, kind, document_submission_id)
        where document_submission_id is not null
      do nothing;
    else
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
      );
    end if;
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
    on conflict (user_id, kind, quotation_request_id)
      where quotation_request_id is not null
    do nothing;
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

-- Realtime (optional; ignore errors if already configured)
do $$
begin
  alter publication supabase_realtime add table public.user_notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
