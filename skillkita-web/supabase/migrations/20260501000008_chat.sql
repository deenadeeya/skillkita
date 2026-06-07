-- Employer ↔ Admin chat (messages + file attachments).
-- Requires: public.is_admin(), user_profiles, chat-attachments bucket.

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (employer_user_id, admin_user_id)
);

alter table public.chat_conversations enable row level security;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create index if not exists chat_messages_conversation_created_idx
  on public.chat_messages (conversation_id, created_at);

create table if not exists public.chat_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  uploader_user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  byte_size bigint,
  created_at timestamptz not null default now()
);

alter table public.chat_message_attachments enable row level security;

create index if not exists chat_attachments_message_idx
  on public.chat_message_attachments (message_id, created_at);

drop policy if exists "chat_conversations_select_participants" on public.chat_conversations;
create policy "chat_conversations_select_participants"
on public.chat_conversations for select
to authenticated
using (auth.uid() = employer_user_id or auth.uid() = admin_user_id);

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
      and up.status = 'approved'
  )
  and exists (
    select 1
    from public.user_profiles up2
    where up2.user_id = admin_user_id
      and up2.role = 'admin'
  )
);

drop policy if exists "chat_conversations_insert_admin" on public.chat_conversations;
create policy "chat_conversations_insert_admin"
on public.chat_conversations for insert
to authenticated
with check (public.is_admin() and admin_user_id = auth.uid());

drop policy if exists "chat_messages_select_participants" on public.chat_messages;
create policy "chat_messages_select_participants"
on public.chat_messages for select
to authenticated
using (
  exists (
    select 1
    from public.chat_conversations c
    where c.id = chat_messages.conversation_id
      and (auth.uid() = c.employer_user_id or auth.uid() = c.admin_user_id)
  )
);

drop policy if exists "chat_messages_insert_participants" on public.chat_messages;
create policy "chat_messages_insert_participants"
on public.chat_messages for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = chat_messages.conversation_id
      and (auth.uid() = c.employer_user_id or auth.uid() = c.admin_user_id)
  )
);

drop policy if exists "chat_attachments_select_participants" on public.chat_message_attachments;
create policy "chat_attachments_select_participants"
on public.chat_message_attachments for select
to authenticated
using (
  exists (
    select 1
    from public.chat_messages m
    join public.chat_conversations c on c.id = m.conversation_id
    where m.id = chat_message_attachments.message_id
      and (auth.uid() = c.employer_user_id or auth.uid() = c.admin_user_id)
  )
);

drop policy if exists "chat_attachments_insert_uploader" on public.chat_message_attachments;
create policy "chat_attachments_insert_uploader"
on public.chat_message_attachments for insert
to authenticated
with check (
  uploader_user_id = auth.uid()
  and exists (
    select 1
    from public.chat_messages m
    join public.chat_conversations c on c.id = m.conversation_id
    where m.id = chat_message_attachments.message_id
      and (auth.uid() = c.employer_user_id or auth.uid() = c.admin_user_id)
  )
);

-- Storage path: <conversation_id>/<message_id>/<filename>
drop policy if exists "chat_storage_select_participants" on storage.objects;
create policy "chat_storage_select_participants"
on storage.objects for select
to authenticated
using (
  bucket_id = 'chat-attachments'
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = split_part(name, '/', 1)::uuid
      and (auth.uid() = c.employer_user_id or auth.uid() = c.admin_user_id)
  )
);

drop policy if exists "chat_storage_insert_participants" on storage.objects;
create policy "chat_storage_insert_participants"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-attachments'
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = split_part(name, '/', 1)::uuid
      and (auth.uid() = c.employer_user_id or auth.uid() = c.admin_user_id)
  )
);

drop policy if exists "chat_storage_delete_admin" on storage.objects;
create policy "chat_storage_delete_admin"
on storage.objects for delete
to authenticated
using (bucket_id = 'chat-attachments' and public.is_admin());
