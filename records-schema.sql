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
