-- "שיפוץ בקלות" — טבלת לידים (בקשות לשיחת ייעוץ ללא עלות)
-- מריצים פעם אחת ב-SQL Editor של Supabase.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  notes text,
  project_name text,
  project_type text,
  estimate_total numeric,
  created_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads(created_at desc);

-- אבטחה: משתמש מחובר יכול רק להוסיף ליד על שמו. אף משתמש לא יכול לקרוא
-- או לערוך לידים דרך האפליקציה — את הלידים רואים רק בלוח הבקרה של Supabase
-- (Table Editor) ובמייל שנשלח אוטומטית.
alter table public.leads enable row level security;

create policy "users can submit their own leads"
  on public.leads for insert
  with check (auth.uid() = user_id);

-- שליחת מייל על כל ליד חדש (בלי לחשוף כתובות/מפתחות בדפדפן):
-- Supabase ← Database ← Webhooks ← Create a new hook
--   Table: leads · Events: Insert · Type: HTTP Request · Method: POST
--   URL: כתובת ה-Webhook של תרחיש Make שלך (שמעביר מייל)
