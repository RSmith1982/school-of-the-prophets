-- The School of The Prophets — student records
-- Administrator: the school's own e-mail address (case-insensitive)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select lower(coalesce(auth.jwt() ->> 'email','')) = 'robertsmith.live4yeshua@outlook.com';
$$;

-- Profiles -----------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  diploma text not null default 'Disciple',
  plan text not null default 'english',      -- 'english' | 'japanese'
  enrollment_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (auth.uid() = id or public.is_admin());
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (auth.uid() = id or public.is_admin());

-- create a profile automatically when a student signs up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, diploma, plan)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'name',''),
          coalesce(new.email,''),
          coalesce(new.raw_user_meta_data ->> 'diploma','Disciple'),
          coalesce(new.raw_user_meta_data ->> 'plan','english'))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Reading-plan progress ---------------------------------------------
create table if not exists public.reading_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null,                        -- 'english' | 'japanese'
  done integer[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, plan)
);
alter table public.reading_progress enable row level security;
drop policy if exists "own reading" on public.reading_progress;
create policy "own reading" on public.reading_progress for all
  using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);

-- Course progress (written only through the functions below) --------
create table if not exists public.course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course text not null,                      -- page slug, e.g. 'full-gospel'
  status text not null default 'reading',    -- 'reading' | 'passed'
  best_score integer not null default 0,
  attempts integer not null default 0,
  fails integer not null default 0,
  lock_until timestamptz,
  passed_at timestamptz,
  last_attempt_at timestamptz,
  student_name text,
  level text,
  primary key (user_id, course)
);
alter table public.course_progress enable row level security;
drop policy if exists "own course read" on public.course_progress;
create policy "own course read" on public.course_progress for select using (auth.uid() = user_id or public.is_admin());

create table if not exists public.exam_attempts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course text not null,
  score integer not null,
  correct integer not null,
  total integer not null,
  passed boolean not null,
  taken_at timestamptz not null default now()
);
alter table public.exam_attempts enable row level security;
drop policy if exists "own attempts read" on public.exam_attempts;
create policy "own attempts read" on public.exam_attempts for select using (auth.uid() = user_id or public.is_admin());

-- Is the student allowed to take this course's assessment now?
create or replace function public.exam_gate(p_course text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.course_progress;
begin
  if auth.uid() is null then return jsonb_build_object('allowed', false, 'reason', 'signin'); end if;
  select * into r from public.course_progress where user_id = auth.uid() and course = p_course;
  if r.user_id is null then return jsonb_build_object('allowed', true, 'fails', 0); end if;
  if r.lock_until is not null and r.lock_until > now() then
    return jsonb_build_object('allowed', false, 'reason', 'locked', 'until', r.lock_until, 'fails', r.fails);
  end if;
  return jsonb_build_object('allowed', true, 'fails', r.fails, 'status', r.status, 'best', r.best_score);
end $$;

-- Record an assessment result. Waiting periods after a failed attempt: 15 min, 1 h, 4 h, then 24 h.
create or replace function public.submit_exam(p_course text, p_correct integer, p_total integer, p_pass integer, p_name text, p_level text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.course_progress; pct integer; ok boolean; waits integer[] := array[15,60,240,1440]; mins integer; nf integer;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  select * into r from public.course_progress where user_id = auth.uid() and course = p_course;
  if r.lock_until is not null and r.lock_until > now() then
    return jsonb_build_object('accepted', false, 'reason', 'locked', 'until', r.lock_until, 'fails', r.fails);
  end if;
  pct := round(p_correct::numeric / greatest(p_total,1) * 100);
  ok := pct >= p_pass;
  insert into public.exam_attempts (user_id, course, score, correct, total, passed)
  values (auth.uid(), p_course, pct, p_correct, p_total, ok);
  if r.user_id is null then
    insert into public.course_progress (user_id, course, status, best_score, attempts, fails, last_attempt_at, student_name, level)
    values (auth.uid(), p_course, 'reading', 0, 0, 0, now(), p_name, p_level);
    select * into r from public.course_progress where user_id = auth.uid() and course = p_course;
  end if;
  if ok then
    update public.course_progress set status = 'passed', best_score = greatest(best_score, pct), attempts = attempts + 1,
      fails = 0, lock_until = null, passed_at = coalesce(passed_at, now()), last_attempt_at = now(), student_name = p_name, level = p_level
      where user_id = auth.uid() and course = p_course;
    return jsonb_build_object('accepted', true, 'passed', true, 'score', pct);
  else
    nf := r.fails + 1; mins := waits[least(nf, 4)];
    update public.course_progress set best_score = greatest(best_score, pct), attempts = attempts + 1, fails = nf,
      lock_until = now() + (mins || ' minutes')::interval, last_attempt_at = now(), student_name = p_name, level = p_level
      where user_id = auth.uid() and course = p_course;
    return jsonb_build_object('accepted', true, 'passed', false, 'score', pct, 'fails', nf, 'until', now() + (mins || ' minutes')::interval, 'minutes', mins);
  end if;
end $$;

-- Practical training: the student reports a part done; the Bishop approves ----
create table if not exists public.practical_requests (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null,                       -- 'level-one' | 'level-two' | 'level-three'
  part integer not null,                     -- 2 = watched it done, 3 = did it while being graded
  note text not null default '',
  requested_at timestamptz not null default now()
);
alter table public.practical_requests enable row level security;
drop policy if exists "own requests" on public.practical_requests;
create policy "own requests" on public.practical_requests for all
  using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);

-- Approvals: only the administrator writes; students read their own ----
create table if not exists public.approvals (
  user_id uuid not null references auth.users(id) on delete cascade,
  item text not null,                        -- 'enrollment' | 'course:<slug>' | 'practical:<level>:<part>' | 'diploma:<name>'
  approved boolean not null default true,
  note text not null default '',
  approved_at timestamptz not null default now(),
  primary key (user_id, item)
);
alter table public.approvals enable row level security;
drop policy if exists "approvals read" on public.approvals;
create policy "approvals read" on public.approvals for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "approvals admin write" on public.approvals;
create policy "approvals admin write" on public.approvals for all using (public.is_admin()) with check (public.is_admin());

-- Admin overview -----------------------------------------------------
create or replace function public.admin_students()
returns setof public.profiles language sql security definer set search_path = public as $$
  select * from public.profiles where public.is_admin() order by created_at desc;
$$;

grant execute on function public.exam_gate(text) to authenticated;
grant execute on function public.submit_exam(text,integer,integer,integer,text,text) to authenticated;
grant execute on function public.admin_students() to authenticated;
grant execute on function public.is_admin() to authenticated, anon;

-- Levels of mastery (September 2026) ---------------------------------
-- Practical training moved from four parts to seven levels of mastery per activity:
--   1 Witness · 2–4 Disciple of ___ · 5–6 Minister of ___ · 7 Instructor of ___
alter table public.practical_requests add column if not exists activity text not null default '';
-- Run the block below ONCE to carry records made under the four parts across to the seven levels:
--   old part 1 (received training)           -> level 2
--   old part 2 (witnessed)                   -> level 3   (water baptism, level one: own baptism -> level 1)
--   old part 3 (performed under supervision) -> level 4
--   old part 4 (taught someone else)         -> level 6
-- update public.approvals set item = regexp_replace(item, ':(\d)$', ':' ||
--   case substring(item from ':(\d)$')
--     when '4' then '6' when '3' then '4'
--     when '2' then case when item like 'practical:level-one:baptizing-in-water:%' then '1' else '3' end
--     when '1' then '2' end)
--   where item like 'practical:%' and item ~ ':[1-4]$';
-- update public.practical_requests set part =
--   case part when 4 then 6 when 3 then 4
--     when 2 then case when level = 'level-one' and activity = 'baptizing-in-water' then 1 else 3 end
--     when 1 then 2 else part end
--   where part between 1 and 4;

-- Competencies: reports for verification, and the authorized people who verify them -----------
-- Run everything below in the Supabase SQL editor once (it is safe to run again).

-- The people the Bishop has authorized to verify competencies (instructors and witnesses). Only the Bishop writes here.
create table if not exists public.authorized (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text not null default '',
  granted_at timestamptz not null default now()
);
alter table public.authorized enable row level security;
drop policy if exists "authorized read" on public.authorized;
create policy "authorized read" on public.authorized for select using (auth.uid() is not null);
drop policy if exists "authorized admin write" on public.authorized;
create policy "authorized admin write" on public.authorized for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.is_authorized() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (select 1 from public.authorized where user_id = auth.uid());
$$;

-- The list students choose a verifier from: every authorized person, and the Bishop.
create or replace function public.authorized_people()
returns table (id uuid, name text) language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(p.name,''), p.email) as name
  from public.profiles p
  where auth.uid() is not null
    and (lower(p.email) = 'robertsmith.live4yeshua@outlook.com' or exists (select 1 from public.authorized a where a.user_id = p.id))
  order by (lower(p.email) = 'robertsmith.live4yeshua@outlook.com') desc, name;
$$;

-- A report now says which level of mastery was reached, when, with whom, and what happened.
alter table public.practical_requests
  add column if not exists activity text not null default '',
  add column if not exists student_name text not null default '',
  add column if not exists done_on date,
  add column if not exists verifier_id uuid references auth.users(id) on delete set null,
  add column if not exists verifier_role text not null default '',
  add column if not exists trainee text not null default '',
  add column if not exists status text not null default 'pending',   -- 'pending' | 'confirmed' | 'rejected'
  add column if not exists decided_at timestamptz,
  add column if not exists decision_note text not null default '';
create index if not exists practical_requests_verifier on public.practical_requests (verifier_id, status);

drop policy if exists "own requests" on public.practical_requests;
drop policy if exists "requests read" on public.practical_requests;
create policy "requests read" on public.practical_requests for select
  using (auth.uid() = user_id or auth.uid() = verifier_id or public.is_admin());
drop policy if exists "requests insert" on public.practical_requests;
create policy "requests insert" on public.practical_requests for insert with check (auth.uid() = user_id);
drop policy if exists "requests withdraw" on public.practical_requests;
create policy "requests withdraw" on public.practical_requests for delete
  using ((auth.uid() = user_id and status = 'pending') or public.is_admin());

-- The chosen verifier (or the Bishop) confirms or rejects a report. Confirming approves that level of mastery.
create or replace function public.decide_request(p_id bigint, p_decision text, p_note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.practical_requests; vname text;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  select * into r from public.practical_requests where id = p_id;
  if r.id is null then raise exception 'report not found'; end if;
  if not (public.is_admin() or r.verifier_id = auth.uid()) then raise exception 'this report was not sent to you'; end if;
  if p_decision not in ('confirmed','rejected') then raise exception 'decision must be confirmed or rejected'; end if;
  update public.practical_requests set status = p_decision, decided_at = now(), decision_note = coalesce(p_note,'') where id = p_id;
  if p_decision = 'confirmed' then
    select coalesce(nullif(name,''), email) into vname from public.profiles where id = auth.uid();
    insert into public.approvals (user_id, item, approved, note, approved_at)
    values (r.user_id, 'practical:' || r.level || ':' || r.activity || ':' || r.part, true, 'Confirmed by ' || coalesce(vname,'an authorized person'), now())
    on conflict (user_id, item) do update set approved = true, note = excluded.note, approved_at = now();
  end if;
  return jsonb_build_object('ok', true, 'status', p_decision);
end $$;

grant execute on function public.is_authorized() to authenticated;
grant execute on function public.authorized_people() to authenticated;
grant execute on function public.decide_request(bigint,text,text) to authenticated;
-- People met in ministry: added by anyone who is at least a Disciple, with a level up to Disciple.
-- A person at Disciple level may claim their record when they create a student account.
-- The record's history of earlier levels is visible to the Bishop only.

create table if not exists public.people (
  id bigserial primary key,
  name text not null,
  level text not null default 'unknown',  -- oppressed | possessed | replaced | unknown | atheist | agnostic | non-christian-heretic | christian-heretic | disciple
  note text not null default '',
  added_by uuid references auth.users(id) on delete set null,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid unique references auth.users(id) on delete set null   -- the student account that claimed this record
);
create table if not exists public.people_history (
  id bigserial primary key,
  person_id bigint not null references public.people(id) on delete cascade,
  level text not null,
  note text not null default '',
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);
alter table public.people enable row level security;
alter table public.people_history enable row level security;

-- Who may add people: the Bishop, anyone he has authorized, and any student whose Disciple (or higher) diploma has been awarded.
create or replace function public.can_add_people() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    public.is_admin()
    or exists (select 1 from public.authorized where user_id = auth.uid())
    or exists (select 1 from public.approvals where user_id = auth.uid() and approved and item in ('diploma:Disciple','diploma:Evangelist','diploma:Pastor','diploma:Prophet','diploma:Bishop'))
  );
$$;

drop policy if exists "people read" on public.people;
create policy "people read" on public.people for select
  using (public.is_admin() or (public.can_add_people() and added_by = auth.uid()) or user_id = auth.uid());
drop policy if exists "people insert" on public.people;
create policy "people insert" on public.people for insert
  with check (public.can_add_people() and added_by = auth.uid() and level in ('oppressed','possessed','replaced','unknown','atheist','agnostic','non-christian-heretic','christian-heretic','disciple'));
drop policy if exists "people update" on public.people;
create policy "people update" on public.people for update
  using (public.is_admin() or (public.can_add_people() and added_by = auth.uid() and user_id is null))
  with check (level in ('oppressed','possessed','replaced','unknown','atheist','agnostic','non-christian-heretic','christian-heretic','disciple'));
drop policy if exists "history bishop only" on public.people_history;
create policy "history bishop only" on public.people_history for select using (public.is_admin());

-- Every change of level is kept in the history (Bishop only).
create or replace function public.people_log() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.level is distinct from old.level or new.note is distinct from old.note then
    insert into public.people_history (person_id, level, note, changed_by) values (new.id, new.level, new.note, auth.uid());
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists people_log on public.people;
create trigger people_log before insert or update on public.people for each row execute procedure public.people_log();

-- The list shown when a new student signs up: every unclaimed name, with only Disciple-level names selectable.
create or replace function public.claimable_people()
returns table (id bigint, name text, claimable boolean) language sql stable security definer set search_path = public as $$
  select id, name, (level = 'disciple') as claimable from public.people where user_id is null order by name;
$$;

-- A new student claims their record. Only a Disciple-level, unclaimed record can be claimed.
create or replace function public.claim_person(p_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.people;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  select * into p from public.people where id = p_id;
  if p.id is null then raise exception 'that name is not in the system'; end if;
  if p.user_id is not null then raise exception 'that name has already been connected to an account'; end if;
  if p.level <> 'disciple' then raise exception 'that name cannot be selected yet'; end if;
  if exists (select 1 from public.people where user_id = auth.uid()) then raise exception 'this account is already connected to a name'; end if;
  update public.people set user_id = auth.uid() where id = p_id;
  update public.profiles set name = p.name, updated_at = now() where id = auth.uid() and (name = '' or name is null);
  return jsonb_build_object('ok', true, 'name', p.name);
end $$;

grant execute on function public.can_add_people() to authenticated;
grant execute on function public.claimable_people() to anon, authenticated;
grant execute on function public.claim_person(bigint) to authenticated;
-- Enrollment built into the site: the request is kept on the student's profile and confirmed by the Bishop.
alter table public.profiles
  add column if not exists phone text not null default '',
  add column if not exists city text not null default '',
  add column if not exists church text not null default '',
  add column if not exists hoped_diploma text not null default '',
  add column if not exists about text not null default '',
  add column if not exists enrolled_at timestamptz;
