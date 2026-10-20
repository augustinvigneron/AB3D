-- ============================================================================
-- Nuvarex — préparation Stripe (Billing + Tax)
-- À exécuter après 0001_init.sql.
-- ============================================================================

-- Statut d'abonnement Stripe (active, past_due, canceled…) : lisible par
-- l'utilisateur (politique select existante), modifiable uniquement côté
-- serveur (les privilèges de colonne de 0001 n'autorisent pas cette colonne).
alter table public.profiles
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz;

-- Journal des événements Stripe traités : garantit l'idempotence du webhook
-- (Stripe peut livrer le même événement plusieurs fois).
create table if not exists public.stripe_events (
  id text primary key,            -- evt_…
  type text not null,
  processed_at timestamptz not null default now()
);

-- Aucune politique : inaccessible aux utilisateurs, seul le rôle service_role (webhook) y écrit.
alter table public.stripe_events enable row level security;
revoke all on public.stripe_events from authenticated, anon;
