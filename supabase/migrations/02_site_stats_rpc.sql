-- 02_site_stats_rpc.sql
-- Create a SECURITY DEFINER RPC to return aggregated counts and sums

create or replace function public.get_site_stats()
returns table(rooms_count int, users_count int, expenses_sum numeric)
language sql stable security definer as $$
  select
    (select count(*) from public.rooms) as rooms_count,
    (select count(*) from public.profiles) as users_count,
    (select coalesce(sum(price),0) from public.expenses) as expenses_sum;
$$;

grant execute on function public.get_site_stats() to public;
