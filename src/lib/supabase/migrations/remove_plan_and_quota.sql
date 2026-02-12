-- Remove subscription plan and quota columns from profiles
-- This project is now fully open-source and free to use

ALTER TABLE public.profiles DROP COLUMN IF EXISTS plan;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS message_quota;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS message_used;

DROP TYPE IF EXISTS public.plan_type;
