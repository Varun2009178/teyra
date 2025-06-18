create or replace function public.update_total_eco_score(user_id_input uuid, score_change integer)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set total_eco_score = total_eco_score + score_change
  where user_id = user_id_input;
end;
$$;
