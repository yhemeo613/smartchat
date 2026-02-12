-- SmartChat Database Schema
-- Requires: pgvector extension

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "vector" with schema "extensions";

-- ============================================================
-- Custom Types
-- ============================================================
create type public.plan_type as enum ('free', 'pro', 'enterprise');
create type public.document_status as enum ('processing', 'ready', 'error');
create type public.message_role as enum ('user', 'assistant', 'system');

-- ============================================================
-- Tables
-- ============================================================

-- Profiles (linked 1:1 with auth.users)
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text unique not null,
  full_name   text,
  avatar_url  text,
  plan          public.plan_type not null default 'free',
  message_quota integer not null default 50,
  message_used  integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'User profiles, auto-created on signup via trigger.';

-- Bots
create table public.bots (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  description     text,
  avatar_url      text,
  welcome_message text not null default 'Hi! How can I help you today?',
  system_prompt   text not null default 'You are a helpful customer support assistant.',
  theme_color     text not null default '#3B82F6',
  model           text not null default 'gpt-4o-mini',
  temperature     real not null default 0.7 check (temperature >= 0 and temperature <= 2),
  max_tokens      integer not null default 1000 check (max_tokens > 0 and max_tokens <= 16000),
  is_public       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.bots is 'AI chatbot configurations owned by users.';

create index idx_bots_user_id on public.bots(user_id);

-- Documents (knowledge base files uploaded per bot)
create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  bot_id      uuid not null references public.bots(id) on delete cascade,
  name        text not null,
  content     text not null,
  token_count integer not null default 0,
  status      public.document_status not null default 'processing',
  created_at  timestamptz not null default now()
);

comment on table public.documents is 'Knowledge base documents uploaded for a bot.';

create index idx_documents_bot_id on public.documents(bot_id);
create index idx_documents_status on public.documents(status);

-- Document Chunks (vector embeddings for RAG)
create table public.document_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  bot_id      uuid not null references public.bots(id) on delete cascade,
  content     text not null,
  embedding   vector(1536),
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);

comment on table public.document_chunks is 'Chunked document embeddings for vector similarity search.';

create index idx_document_chunks_document_id on public.document_chunks(document_id);
create index idx_document_chunks_bot_id on public.document_chunks(bot_id);

-- HNSW index for fast approximate nearest-neighbor search on embeddings
create index idx_document_chunks_embedding on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Conversations
create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  bot_id      uuid not null references public.bots(id) on delete cascade,
  visitor_id  text not null,
  title       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.conversations is 'Chat conversations between visitors and bots.';

create index idx_conversations_bot_id on public.conversations(bot_id);
create index idx_conversations_visitor_id on public.conversations(visitor_id);

-- Messages
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            public.message_role not null,
  content         text not null,
  sources         jsonb default '[]',
  created_at      timestamptz not null default now()
);

comment on table public.messages is 'Individual messages within a conversation.';

create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_created_at on public.messages(created_at);

-- ============================================================
-- Updated_at trigger function
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_bots_updated
  before update on public.bots
  for each row execute function public.handle_updated_at();

create trigger on_conversations_updated
  before update on public.conversations
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Auto-create profile on user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

-- Profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Bots
alter table public.bots enable row level security;

create policy "Users can view their own bots"
  on public.bots for select
  using (auth.uid() = user_id);

create policy "Users can create bots"
  on public.bots for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bots"
  on public.bots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own bots"
  on public.bots for delete
  using (auth.uid() = user_id);

create policy "Public bots are viewable by anyone"
  on public.bots for select
  using (is_public = true);

-- Documents
alter table public.documents enable row level security;

create policy "Users can view documents of their bots"
  on public.documents for select
  using (
    bot_id in (select id from public.bots where user_id = auth.uid())
  );

create policy "Users can insert documents to their bots"
  on public.documents for insert
  with check (
    bot_id in (select id from public.bots where user_id = auth.uid())
  );

create policy "Users can update documents of their bots"
  on public.documents for update
  using (
    bot_id in (select id from public.bots where user_id = auth.uid())
  )
  with check (
    bot_id in (select id from public.bots where user_id = auth.uid())
  );

create policy "Users can delete documents of their bots"
  on public.documents for delete
  using (
    bot_id in (select id from public.bots where user_id = auth.uid())
  );

-- Document Chunks
alter table public.document_chunks enable row level security;

create policy "Users can view chunks of their bots"
  on public.document_chunks for select
  using (
    bot_id in (select id from public.bots where user_id = auth.uid())
  );

create policy "Users can insert chunks to their bots"
  on public.document_chunks for insert
  with check (
    bot_id in (select id from public.bots where user_id = auth.uid())
  );

create policy "Users can delete chunks of their bots"
  on public.document_chunks for delete
  using (
    bot_id in (select id from public.bots where user_id = auth.uid())
  );

-- Service role bypass for document_chunks (used by embedding pipeline)
create policy "Service role can manage all chunks"
  on public.document_chunks for all
  using (auth.role() = 'service_role');

-- Conversations
alter table public.conversations enable row level security;

create policy "Users can view conversations of their bots"
  on public.conversations for select
  using (
    bot_id in (select id from public.bots where user_id = auth.uid())
  );

create policy "Anyone can create conversations on public bots"
  on public.conversations for insert
  with check (
    bot_id in (select id from public.bots where is_public = true)
  );

create policy "Users can delete conversations of their bots"
  on public.conversations for delete
  using (
    bot_id in (select id from public.bots where user_id = auth.uid())
  );

-- Messages
alter table public.messages enable row level security;

create policy "Users can view messages of their bot conversations"
  on public.messages for select
  using (
    conversation_id in (
      select c.id from public.conversations c
      join public.bots b on b.id = c.bot_id
      where b.user_id = auth.uid()
    )
  );

create policy "Anyone can insert messages to public bot conversations"
  on public.messages for insert
  with check (
    conversation_id in (
      select c.id from public.conversations c
      join public.bots b on b.id = c.bot_id
      where b.is_public = true
    )
  );

-- Service role bypass for messages (used by AI response pipeline)
create policy "Service role can manage all messages"
  on public.messages for all
  using (auth.role() = 'service_role');

-- ============================================================
-- Vector similarity search function
-- ============================================================
create or replace function public.match_documents(
  query_embedding  vector(1536),
  match_bot_id     uuid,
  match_threshold  float default 0.78,
  match_count      int default 5
)
returns table (
  id         uuid,
  content    text,
  metadata   jsonb,
  similarity float
)
language sql
stable
security definer
set search_path = 'public', 'extensions'
as $$
  select
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where dc.bot_id = match_bot_id
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
