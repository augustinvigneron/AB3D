-- ============================================================================
-- Nuvarex — nouvelles limites des offres
-- À exécuter après 0001 et 0002 (SQL Editor → coller → Run). Relançable sans risque.
--
--   Gratuit  : 10 clients,  5 générations de messages par mois
--   Pro      : 300 clients, 100 générations de messages par mois
--   Business : illimité,    illimité
--
-- Ces valeurs doivent rester identiques à src/lib/plans.ts.
-- ============================================================================

create or replace function public.plan_limits(p_plan public.plan_id)
returns table (max_clients int, max_ai_per_month int)
language sql immutable as $$
  select
    case p_plan when 'free' then 10 when 'pro' then 300 else null end as max_clients,
    case p_plan when 'free' then 5 when 'pro' then 100 else null end as max_ai_per_month;
$$;

-- consume_ai_generation : une limite NULL signifie « illimité ».
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

  if v_limit is not null and v_used >= v_limit then
    return query select false, v_used, v_limit, v_plan;
    return;
  end if;

  insert into public.ai_generations (user_id, simulated) values (v_user, p_simulated);
  return query select true, v_used + 1, v_limit, v_plan;
end $$;

revoke all on function public.consume_ai_generation(boolean) from public;
grant execute on function public.consume_ai_generation(boolean) to authenticated;
