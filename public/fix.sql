-- fix.sql: run ONCE in Supabase > SQL Editor (after schema.sql). Safe to run again.

-- 1) Lets the signup page check the device BEFORE creating the account, so errors are clear
create or replace function device_taken(p_device text) returns boolean language sql security definer stable set search_path=public as $$
 select exists(select 1 from profiles where device_id=p_device) $$;
grant execute on function device_taken(text) to anon, authenticated;

-- 2) DIAGNOSIS: run these two lines. The first must return 1 row, the second shows how many profiles exist.
-- select tgname from pg_trigger where tgname='on_auth_user_created';
-- select count(*) from profiles;

-- 3) TESTING ONLY: you made a test account and want to make another one from the same browser/device
-- update profiles set device_id=null;

-- 4) TESTING ONLY: delete all test users completely (their profiles are removed automatically)
-- delete from auth.users;
