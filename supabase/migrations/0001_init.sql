-- ============================================================================
-- Relanceo AI — schéma initial
-- À exécuter dans Supabase : SQL Editor → New query → coller → Run
-- (ou `supabase db push` avec le CLI).
-- Ce script est idempotent : il peut être relancé sans erreur sur une base
-- où il a déjà été exécuté (en entier ou en partie).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ───────────── Types ─────────────
do $$ begin
  create type public.client_status as enum ('prospect', 'actif', 'inactif', 'perdu');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.quote_status as enum ('brouillon', 'envoye', 'en_attente', 'accepte', 'refuse');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.reminder_status as enum ('a_faire', 'terminee');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.reminder_channel as enum ('email', 'telephone', 'sms', 'visite', 'autre');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.plan_id as enum ('free', 'pro', 'business');
exception when duplicate_object then null; end $$;

-- ───────────── Fonctions utilitaires ─────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Limites par plan : source de vérité côté base (dupliquée dans src/lib/plans.ts pour l'affichage).
create or replace function public.plan_limits(p_plan public.plan_id)
returns table (max_clients int, max_ai_per_month int)
language sql immutable as $$
  select
    case p_plan when 'free' then 10 else null end as max_clients,
    case p_plan when 'free' then 5 when 'pro' then 100 when 'business' then 300 end as max_ai_per_month;
$$;

-- ───────────── profiles ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  company_name text,
  plan public.plan_id not null default 'free',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Création automatique du profil à l'inscription.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, company_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'company_name', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── clients ─────────────
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  company text check (company is null or char_length(company) <= 120),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 40),
  notes text check (notes is null or char_length(notes) <= 5000),
  status public.client_status not null default 'prospect',
  last_contact_at date,
  next_followup_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists clients_user_next_followup_idx on public.clients (user_id, next_followup_at);

drop trigger if exists clients_updated_at on public.clients;
create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- Limite de clients selon le plan, appliquée côté base (impossible à contourner depuis le client).
create or replace function public.enforce_client_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_plan public.plan_id;
  v_max int;
  v_count int;
begin
  select plan into v_plan from public.profiles where id = new.user_id;
  select max_clients into v_max from public.plan_limits(coalesce(v_plan, 'free'));
  if v_max is not null then
    select count(*) into v_count from public.clients where user_id = new.user_id;
    if v_count >= v_max then
      raise exception 'CLIENT_LIMIT_REACHED' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists clients_enforce_limit on public.clients;
create trigger clients_enforce_limit
  before insert on public.clients
  for each row execute function public.enforce_client_limit();

-- ───────────── quotes (devis) ─────────────
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  amount numeric(12, 2) not null check (amount >= 0),
  sent_at date,
  status public.quote_status not null default 'brouillon',
  next_followup_at date,
  notes text check (notes is null or char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotes_user_id_idx on public.quotes (user_id);
create index if not exists quotes_client_id_idx on public.quotes (client_id);

drop trigger if exists quotes_updated_at on public.quotes;
create trigger quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

-- Un devis doit référencer un client du même utilisateur.
create or replace function public.check_quote_client_owner()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.clients c where c.id = new.client_id and c.user_id = new.user_id) then
    raise exception 'CLIENT_NOT_OWNED' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists quotes_check_client_owner on public.quotes;
create trigger quotes_check_client_owner
  before insert or update on public.quotes
  for each row execute function public.check_quote_client_owner();

-- ───────────── reminders (relances) ─────────────
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  quote_id uuid references public.quotes (id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  due_at date not null,
  channel public.reminder_channel not null default 'email',
  status public.reminder_status not null default 'a_faire',
  notes text check (notes is null or char_length(notes) <= 5000),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reminders_user_due_idx on public.reminders (user_id, status, due_at);

drop trigger if exists reminders_updated_at on public.reminders;
create trigger reminders_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();

create or replace function public.check_reminder_refs_owner()
returns trigger language plpgsql as $$
begin
  if new.client_id is not null and not exists (
    select 1 from public.clients c where c.id = new.client_id and c.user_id = new.user_id
  ) then
    raise exception 'CLIENT_NOT_OWNED' using errcode = 'P0001';
  end if;
  if new.quote_id is not null and not exists (
    select 1 from public.quotes q where q.id = new.quote_id and q.user_id = new.user_id
  ) then
    raise exception 'QUOTE_NOT_OWNED' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists reminders_check_refs_owner on public.reminders;
create trigger reminders_check_refs_owner
  before insert or update on public.reminders
  for each row execute function public.check_reminder_refs_owner();

-- ───────────── reminder_events (historique des actions) ─────────────
create table if not exists public.reminder_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reminder_id uuid references public.reminders (id) on delete set null,
  action text not null check (action in ('creee', 'modifiee', 'terminee', 'reouverte', 'supprimee')),
  details text check (details is null or char_length(details) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists reminder_events_user_created_idx on public.reminder_events (user_id, created_at desc);

-- ───────────── ai_generations (quota IA) ─────────────
create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  simulated boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ai_generations_user_created_idx on public.ai_generations (user_id, created_at);

-- Nombre de générations consommées ce mois (UTC).
create or replace function public.ai_usage_this_month()
returns int language sql stable security invoker as $$
  select count(*)::int from public.ai_generations
  where user_id = auth.uid()
    and created_at >= date_trunc('month', now());
$$;

-- Consomme atomiquement une génération si le quota le permet.
-- Retourne allowed=false sans rien insérer quand le quota est atteint.
create or replace function public.consume_ai_generation(p_simulated boolean default false)
returns table (allowed boolean, used int, limit_value int, plan public.plan_id)
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_plan public.plan_id;
  v_limit int;
  v_used int;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  -- Verrou sur le profil pour éviter deux générations concurrentes qui dépassent le quota.
  select p.plan into v_plan from public.profiles p where p.id = v_user for update;
  v_plan := coalesce(v_plan, 'free');
  select max_ai_per_month into v_limit from public.plan_limits(v_plan);

  select count(*)::int into v_used from public.ai_generations g
  where g.user_id = v_user and g.created_at >= date_trunc('month', now());

  if v_used >= v_limit then
    return query select false, v_used, v_limit, v_plan;
    return;
  end if;

  insert into public.ai_generations (user_id, simulated) values (v_user, p_simulated);
  return query select true, v_used + 1, v_limit, v_plan;
end $$;

-- Suppression complète du compte par l'utilisateur lui-même.
create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;
  -- Les cascades ON DELETE suppriment profil, clients, devis, relances, historique, quotas.
  delete from auth.users where id = v_user;
end $$;

-- ───────────── Row Level Security ─────────────
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.quotes enable row level security;
alter table public.reminders enable row level security;
alter table public.reminder_events enable row level security;
alter table public.ai_generations enable row level security;

-- profiles : lecture/mise à jour de son propre profil uniquement.
-- Le plan n'est PAS modifiable par l'utilisateur (voir trigger ci-dessous).
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Privilèges de colonne : un utilisateur ne peut modifier que son nom, son
-- entreprise et ses préférences. Le plan et les identifiants Stripe ne sont
-- modifiables que côté serveur (webhook Stripe avec la clé service_role).
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, company_name, preferences) on public.profiles to authenticated;

-- ai_generations : jamais d'écriture directe (quota consommé via consume_ai_generation).
revoke insert, update, delete on public.ai_generations from authenticated;

-- clients / quotes / reminders / reminder_events : accès complet à ses propres lignes.
drop policy if exists "clients_all_own" on public.clients;
create policy "clients_all_own" on public.clients for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "quotes_all_own" on public.quotes;
create policy "quotes_all_own" on public.quotes for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reminders_all_own" on public.reminders;
create policy "reminders_all_own" on public.reminders for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reminder_events_select_own" on public.reminder_events;
create policy "reminder_events_select_own" on public.reminder_events for select to authenticated
  using (auth.uid() = user_id);
drop policy if exists "reminder_events_insert_own" on public.reminder_events;
create policy "reminder_events_insert_own" on public.reminder_events for insert to authenticated
  with check (auth.uid() = user_id);

-- ai_generations : lecture seule ; l'insertion passe obligatoirement par consume_ai_generation().
drop policy if exists "ai_generations_select_own" on public.ai_generations;
create policy "ai_generations_select_own" on public.ai_generations for select to authenticated
  using (auth.uid() = user_id);

-- ───────────── Droits d'exécution ─────────────
revoke all on function public.consume_ai_generation(boolean) from public;
grant execute on function public.consume_ai_generation(boolean) to authenticated;
revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
grant execute on function public.ai_usage_this_month() to authenticated;
