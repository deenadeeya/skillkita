-- Employer ↔ Admin chat (messages + file attachments)
-- Run in Supabase SQL Editor after auth_roles_setup.sql (needs public.is_admin()).
--
-- Storage bucket required (create in Dashboard → Storage):
--   - bucket name: chat-attachments
--   - privacy: Private bucket (recommended)

create extension if not exists "pgcrypto";

-- 0) Admin directory (so employers can pick an admin to chat with)
-- Employers are blocked by the default user_profiles select policy (own row only).
-- This policy allows any authenticated user to read basic admin rows.
drop policy if exists "profiles_select_admin_directory" on public.user_profiles;
create policy "profiles_select_admin_directory"
on public.user_profiles for select
to authenticated
using (role = 'admin');

-- 1) Conversations: one channel per (employer, admin)
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (employer_user_id, admin_user_id)
);

alter table public.chat_conversations enable row level security;

-- 2) Messages: text-only rows; attachments live in chat_message_attachments
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

-- 3) Attachments: one-or-more files per message
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

-- 4) RLS policies
-- Conversations: participants can read; employers can create for themselves targeting an admin.
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

-- Allow admins to list conversations assigned to them (insert optional).
drop policy if exists "chat_conversations_insert_admin" on public.chat_conversations;
create policy "chat_conversations_insert_admin"
on public.chat_conversations for insert
to authenticated
with check (
  public.is_admin()
  and admin_user_id = auth.uid()
);

-- Messages: participants can read; participants can write if they are sender.
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

-- Attachments: participants can read; uploader can write.
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

-- 5) Storage policies (bucket must exist: chat-attachments, private)
-- Path convention used by the app:
--   <conversation_id>/<message_id>/<filename>

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

