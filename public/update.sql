-- update.sql: run ONCE in Supabase > SQL Editor AFTER schema.sql. Safe to run again.
-- New: settings (reward Rs 2.5, 20s timer), 24h per-ad cooldown, block/delete users, maintenance, resets, stats.

create table if not exists settings(key text primary key, value text not null);
insert into settings(key,value) values('reward','2.5'),('timer_seconds','20'),('daily_limit','10'),('min_first','200'),('min_next','800'),('welcome_bonus','50'),('c1','8'),('c2','5'),('c3','2'),('ref_threshold','20'),('maintenance','off') on conflict (key) do nothing;
update settings set value='2.5' where key='reward' and value='4.5';
alter table settings enable row level security;
drop policy if exists st_sel on settings; create policy st_sel on settings for select using (true);
drop policy if exists st_all on settings; create policy st_all on settings for all using (is_admin()) with check (is_admin());

alter table profiles add column if not exists blocked boolean not null default false;
alter table transactions add column if not exists kind text;
update transactions set kind=case when description like 'Ad view%' then 'ad' when description like 'Welcome%' then 'bonus' when description like 'Level%' then 'commission' when description like 'Withdrawal refunded%' then 'refund' when type='debit' then 'withdraw' end where kind is null;

-- deleting a user removes their data too
alter table transactions drop constraint if exists transactions_user_id_fkey, add constraint transactions_user_id_fkey foreign key(user_id) references profiles(id) on delete cascade;
alter table ad_views drop constraint if exists ad_views_user_id_fkey, add constraint ad_views_user_id_fkey foreign key(user_id) references profiles(id) on delete cascade;
alter table withdrawals drop constraint if exists withdrawals_user_id_fkey, add constraint withdrawals_user_id_fkey foreign key(user_id) references profiles(id) on delete cascade;
alter table profiles drop constraint if exists profiles_referrer_fkey, add constraint profiles_referrer_fkey foreign key(referrer) references profiles(id) on delete set null;

create or replace function setting_n(k text) returns numeric language sql stable security definer set search_path=public as $$ select value::numeric from settings where key=k $$;

-- blocks maintenance + blocked users from every money action
create or replace function guard() returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Login required'; end if;
 if is_admin() then return; end if;
 if (select value from settings where key='maintenance')='on' then raise exception 'Site is under maintenance. Please try again later.'; end if;
 if (select blocked from profiles where id=auth.uid()) then raise exception 'Your account has been blocked. Contact support.'; end if;
end $$;

create or replace function start_ad(p_slot uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare v uuid; n int;
begin
 perform guard();
 if not exists(select 1 from ad_slots where id=p_slot and active) then raise exception 'Ad not available'; end if;
 if exists(select 1 from ad_views where user_id=auth.uid() and slot_id=p_slot and claimed and claimed_at>now()-interval '24 hours') then raise exception 'This ad is available again 24 hours after you watched it'; end if;
 select count(*) into n from ad_views where user_id=auth.uid() and claimed and (claimed_at at time zone 'Asia/Karachi')::date=pk_today();
 if n>=setting_n('daily_limit') then raise exception 'Daily ad limit reached'; end if;
 insert into ad_views(user_id,slot_id) values(auth.uid(),p_slot) returning id into v; return v; end $$;

create or replace function claim_ad(p_view uuid) returns numeric language plpgsql security definer set search_path=public as $$
declare v ad_views; n int; me profiles; cur uuid; lvl int:=1; pct numeric[]:=array[setting_n('c1')/100,setting_n('c2')/100,setting_n('c3')/100]; c numeric; reward numeric:=setting_n('reward');
begin
 perform guard();
 select * into v from ad_views where id=p_view and user_id=auth.uid() for update;
 if not found or v.claimed then raise exception 'Invalid ad session'; end if;
 if now()-v.started_at < make_interval(secs=>setting_n('timer_seconds')::double precision) then raise exception 'Timer not finished'; end if;
 if exists(select 1 from ad_views where user_id=auth.uid() and slot_id=v.slot_id and claimed and claimed_at>now()-interval '24 hours' and id<>v.id) then raise exception 'Ad already watched in the last 24 hours'; end if;
 select count(*) into n from ad_views where user_id=auth.uid() and claimed and (claimed_at at time zone 'Asia/Karachi')::date=pk_today();
 if n>=setting_n('daily_limit') then raise exception 'Daily ad limit reached'; end if;
 update ad_views set claimed=true, claimed_at=now() where id=v.id;
 update profiles set balance=balance+reward, ads_total=ads_total+1 where id=auth.uid() returning * into me;
 insert into transactions(user_id,type,amount,description,kind) values(auth.uid(),'credit',reward,'Ad view reward','ad');
 if me.ads_total>=setting_n('ref_threshold') then
  cur:=me.referrer;
  while cur is not null and lvl<=3 loop
   c:=round(reward*pct[lvl],3);
   update profiles set balance=balance+c where id=cur;
   insert into transactions(user_id,type,amount,description,kind) values(cur,'credit',c,'Level '||lvl||' team commission ('||me.user_code||')','commission');
   select referrer into cur from profiles where id=cur; lvl:=lvl+1;
  end loop;
 end if;
 return reward; end $$;

create or replace function claim_bonus() returns void language plpgsql security definer set search_path=public as $$
begin
 perform guard();
 update profiles set balance=balance+setting_n('welcome_bonus'), bonus_claimed=true where id=auth.uid() and not bonus_claimed;
 if not found then raise exception 'Bonus already claimed'; end if;
 insert into transactions(user_id,type,amount,description,kind) values(auth.uid(),'credit',setting_n('welcome_bonus'),'Welcome bonus','bonus'); end $$;

create or replace function request_withdraw(p_method text,p_title text,p_number text,p_amount numeric) returns void language plpgsql security definer set search_path=public as $$
declare minv numeric;
begin
 perform guard();
 if p_method not in ('JazzCash','Easypaisa') then raise exception 'Invalid method'; end if;
 if length(trim(coalesce(p_title,'')))<3 or length(trim(coalesce(p_number,'')))<10 then raise exception 'Enter valid account details'; end if;
 if exists(select 1 from withdrawals where user_id=auth.uid() and status='pending') then raise exception 'You already have a pending request'; end if;
 minv:=case when exists(select 1 from withdrawals where user_id=auth.uid() and status<>'rejected') then setting_n('min_next') else setting_n('min_first') end;
 if p_amount<minv then raise exception 'Minimum withdrawal is Rs. %',minv; end if;
 update profiles set balance=balance-p_amount where id=auth.uid() and balance>=p_amount;
 if not found then raise exception 'Insufficient balance'; end if;
 insert into withdrawals(user_id,method,account_title,account_number,amount) values(auth.uid(),p_method,trim(p_title),trim(p_number),p_amount);
 insert into transactions(user_id,type,amount,description,kind) values(auth.uid(),'debit',p_amount,'Withdrawal request ('||p_method||')','withdraw'); end $$;

create or replace function update_my_name(p_name text) returns void language plpgsql security definer set search_path=public as $$
begin perform guard(); if length(trim(coalesce(p_name,'')))<2 then raise exception 'Enter a valid name'; end if;
 update profiles set name=left(trim(p_name),40) where id=auth.uid(); end $$;

-- ADMIN FUNCTIONS (every one checks is_admin)
create or replace function admin_review(p_id uuid,p_approve boolean) returns void language plpgsql security definer set search_path=public as $$
declare w withdrawals;
begin
 if not is_admin() then raise exception 'Not allowed'; end if;
 select * into w from withdrawals where id=p_id and status='pending' for update;
 if not found then raise exception 'Request not found or already processed'; end if;
 if p_approve then update withdrawals set status='approved' where id=p_id;
 else update withdrawals set status='rejected' where id=p_id;
  update profiles set balance=balance+w.amount where id=w.user_id;
  insert into transactions(user_id,type,amount,description,kind) values(w.user_id,'credit',w.amount,'Withdrawal refunded','refund'); end if; end $$;

create or replace function admin_edit_withdrawal(p_id uuid,p_method text,p_title text,p_number text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not is_admin() then raise exception 'Not allowed'; end if;
 if p_method not in ('JazzCash','Easypaisa') then raise exception 'Invalid method'; end if;
 update withdrawals set method=p_method,account_title=trim(p_title),account_number=trim(p_number) where id=p_id; end $$;

create or replace function admin_delete_withdrawal(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare w withdrawals;
begin
 if not is_admin() then raise exception 'Not allowed'; end if;
 select * into w from withdrawals where id=p_id for update; if not found then return; end if;
 if w.status='pending' then update profiles set balance=balance+w.amount where id=w.user_id;
  insert into transactions(user_id,type,amount,description,kind) values(w.user_id,'credit',w.amount,'Withdrawal refunded','refund'); end if;
 delete from withdrawals where id=p_id; end $$;

create or replace function admin_set_blocked(p_id uuid,p_blocked boolean) returns void language plpgsql security definer set search_path=public as $$
begin if not is_admin() then raise exception 'Not allowed'; end if;
 update profiles set blocked=p_blocked where id=p_id and not is_admin; end $$;

create or replace function admin_delete_user(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin if not is_admin() then raise exception 'Not allowed'; end if;
 if exists(select 1 from profiles where id=p_id and is_admin) then raise exception 'Cannot delete an admin'; end if;
 delete from auth.users where id=p_id; end $$;

-- Fallback for "forgot password" when emails are not set up: admin sets a temporary password
create or replace function admin_set_password(p_id uuid,p_pass text) returns void language plpgsql security definer set search_path=public as $$
begin if not is_admin() then raise exception 'Not allowed'; end if;
 if length(coalesce(p_pass,''))<6 then raise exception 'Password must be 6+ characters'; end if;
 update auth.users set encrypted_password=extensions.crypt(p_pass,extensions.gen_salt('bf')),updated_at=now() where id=p_id; end $$;

create or replace function admin_reset_ads() returns void language plpgsql security definer set search_path=public as $$
begin if not is_admin() then raise exception 'Not allowed'; end if; delete from ad_views; end $$;

create or replace function admin_reset_all(p_confirm text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not is_admin() then raise exception 'Not allowed'; end if;
 if p_confirm<>'RESET' then raise exception 'Type RESET to confirm'; end if;
 delete from auth.users where id not in (select id from profiles where is_admin);
 delete from ad_views; delete from transactions; delete from withdrawals;
 update profiles set balance=0,ads_total=0 where is_admin;
 perform setval('user_code_seq',100001,false); end $$;

create or replace function admin_stats() returns json language plpgsql security definer set search_path=public as $$
declare d0 timestamptz:=(pk_today()::timestamp at time zone 'Asia/Karachi');
begin
 if not is_admin() then raise exception 'Not allowed'; end if;
 return json_build_object(
  'users',(select count(*) from profiles where not is_admin),
  'active_today',(select count(distinct user_id) from ad_views where claimed and claimed_at>=d0),
  'joined_today',(select count(*) from profiles where created_at>=d0 and not is_admin),
  'earn_today',(select coalesce(sum(amount),0) from transactions where type='credit' and kind in ('ad','bonus','commission') and created_at>=d0),
  'earn_total',(select coalesce(sum(amount),0) from transactions where type='credit' and kind in ('ad','bonus','commission')),
  'balances',(select coalesce(sum(balance),0) from profiles where not is_admin),
  'pending_count',(select count(*) from withdrawals where status='pending'),
  'pending_amount',(select coalesce(sum(amount),0) from withdrawals where status='pending'),
  'paid_total',(select coalesce(sum(amount),0) from withdrawals where status='approved')); end $$;
