-- Add user AI configuration columns to profiles
alter table public.profiles
  add column if not exists openai_api_key    text,
  add column if not exists openai_base_url   text,
  add column if not exists anthropic_api_key text,
  add column if not exists anthropic_base_url text,
  add column if not exists default_model     text not null default 'gpt-4o-mini';
