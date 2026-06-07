-- Fix ON CONFLICT for partial unique indexes on user_notifications.
-- Bare "ON CONFLICT DO NOTHING" fails when only partial unique indexes exist.

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
