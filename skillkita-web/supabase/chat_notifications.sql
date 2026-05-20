-- In-app notifications (chat messages; extended for quotations & document submissions).
-- Run after chat_employer_admin.sql.
-- For quotation/JD14/payment-receipt alerts, also run:
--   migrations/20260521120000_quotation_document_notifications.sql
--
-- Supabase Realtime: enable for this table (Dashboard → Database → Replication,
-- or run below if your project allows altering the publication).

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'chat_message' check (kind = 'chat_message'),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  preview text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (message_id)
);

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

-- Inserts only via trigger (security definer); no insert policy for authenticated.

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
  on conflict (message_id) do nothing;

  return new;
end;
$$;

drop trigger if exists chat_messages_notify_recipient on public.chat_messages;
create trigger chat_messages_notify_recipient
after insert on public.chat_messages
for each row
execute function public.enqueue_chat_message_notification();

-- Realtime (optional; ignore errors if publication/table already configured).
do $$
begin
  alter publication supabase_realtime add table public.user_notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
