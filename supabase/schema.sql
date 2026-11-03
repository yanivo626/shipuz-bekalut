-- "שיפוץ בקלות" — סכימת מסד נתונים ל-Supabase
-- מריצים את כל הקובץ הזה פעם אחת ב-SQL Editor של פרויקט ה-Supabase שלך.

-- טבלת פרויקטים — כל שורה = פרויקט שיפוץ אחד של לקוח/ה אחד/ת.
-- שימי לב: quantities, category_tiers, procurement_items וכו' נשמרים כ-jsonb
-- (בדיוק באותו מבנה שהאפליקציה כבר עובדת איתו) כדי לא לשנות את לוגיקת ה-React,
-- רק את המקום שבו הנתונים נשמרים.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  room_type text not null,
  disclaimer_accepted boolean not null default false,

  quantities jsonb not null default '{}'::jsonb,
  category_tiers jsonb not null default '{}'::jsonb,
  category_source jsonb not null default '{}'::jsonb,
  actual_area numeric,
  floor_access jsonb not null default '{"floor":0,"hasElevator":true,"hasParking":true}'::jsonb,
  use2026 boolean not null default true,

  procurement_items jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '{}'::jsonb,
  handover_checklist jsonb not null default '{}'::jsonb,
  general_docs jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);

-- מעדכן updated_at אוטומטית בכל שמירה
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- === אבטחה: Row Level Security ===
-- זה החלק הכי חשוב בכל הקובץ. בלעדיו, כל משתמש מחובר יכול לראות את
-- הפרויקטים של כולם. עם זה, כל שאילתה מסוננת אוטומטית כך שמשתמש רואה
-- ויכול לערוך רק את השורות שבהן user_id = המשתמש המחובר עצמו.
alter table public.projects enable row level security;

create policy "users can view their own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "users can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "users can update their own projects"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- === אחסון תמונות (Supabase Storage) ===
-- באג'קט אחד "project-photos", עם מבנה תיקיות: <user_id>/<project_id>/<filename>
-- כדי שגם כאן אפשר יהיה להגביל גישה לפי בעלים.
insert into storage.buckets (id, name, public)
values ('project-photos', 'project-photos', false)
on conflict (id) do nothing;

create policy "users can upload their own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can view their own photos"
  on storage.objects for select
  using (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete their own photos"
  on storage.objects for delete
  using (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
