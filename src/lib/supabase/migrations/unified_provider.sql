  -- Step 1: Add new columns                                                                                                                          alter table public.profiles add column if not exists ai_provider text not null default 'openai';                                                  
  alter table public.profiles add column if not exists ai_api_key text;
  alter table public.profiles add column if not exists ai_base_url text;

  -- Step 2: Migrate existing data (prefer OpenAI, fallback Anthropic)
  update public.profiles
  set
    ai_provider = case
      when openai_api_key is not null and openai_api_key != '' then 'openai'
      when anthropic_api_key is not null and anthropic_api_key != '' then 'anthropic'
      else 'openai'
    end,
    ai_api_key = case
      when openai_api_key is not null and openai_api_key != '' then openai_api_key
      when anthropic_api_key is not null and anthropic_api_key != '' then anthropic_api_key
      else null
    end,
    ai_base_url = case
      when openai_api_key is not null and openai_api_key != '' then openai_base_url
      when anthropic_api_key is not null and anthropic_api_key != '' then anthropic_base_url
      else null
    end;

  -- Step 3: Drop old columns
  alter table public.profiles drop column if exists openai_api_key;
  alter table public.profiles drop column if exists openai_base_url;
  alter table public.profiles drop column if exists anthropic_api_key;
  alter table public.profiles drop column if exists anthropic_base_url;