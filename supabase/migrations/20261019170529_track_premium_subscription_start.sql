-- periodo_inicio advances on every renewal; keep the beginning of the
-- current Stripe subscription separately for the admin's new-signups list.
alter table public.usuarios_premium
  add column if not exists subscription_started_at timestamptz;

create or replace function public.set_premium_subscription_started_at()
returns trigger
language plpgsql
as $$
begin
  if new.stripe_subscription_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.subscription_started_at := new.periodo_inicio;
  elsif new.stripe_subscription_id is distinct from old.stripe_subscription_id then
    new.subscription_started_at := new.periodo_inicio;
  end if;

  return new;
end;
$$;

drop trigger if exists track_premium_subscription_start on public.usuarios_premium;
create trigger track_premium_subscription_start
before insert or update on public.usuarios_premium
for each row execute function public.set_premium_subscription_started_at();
