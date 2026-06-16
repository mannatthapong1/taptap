-- Run this in Supabase SQL Editor

create table seeker_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  name text not null default '',
  photo_url text,
  skills text[] default '{}',
  availability jsonb default '[]',
  location_text text default '',
  lat float,
  lng float,
  profile_score int default 0,
  rating_avg float default 0,
  rating_count int default 0,
  created_at timestamptz default now()
);

create table employer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  name text not null default '',
  company_name text default '',
  photo_url text,
  location_text text default '',
  lat float,
  lng float,
  rating_avg float default 0,
  rating_count int default 0,
  created_at timestamptz default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid references employer_profiles(id) on delete cascade,
  title text not null,
  description text default '',
  location_text text default '',
  lat float,
  lng float,
  pay_amount numeric not null,
  pay_type text check (pay_type in ('hourly','daily','monthly','fixed')) default 'daily',
  schedule jsonb default '[]',
  skills_needed text[] default '{}',
  urgent boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

create table swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid references auth.users(id) on delete cascade,
  target_id uuid not null,
  target_type text check (target_type in ('job','seeker')),
  direction text check (direction in ('left','right','save')),
  created_at timestamptz default now(),
  unique(swiper_id, target_id)
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid references seeker_profiles(id) on delete cascade,
  employer_id uuid references employer_profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete cascade,
  status text check (status in ('pending','matched','accepted','completed','cancelled')) default 'pending',
  seeker_rated boolean default false,
  employer_rated boolean default false,
  created_at timestamptz default now(),
  unique(seeker_id, job_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  content text not null,
  type text check (type in ('text','system')) default 'text',
  created_at timestamptz default now()
);

create table ratings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  rater_id uuid references auth.users(id) on delete cascade,
  ratee_id uuid references auth.users(id) on delete cascade,
  stars int check (stars between 1 and 5),
  comment text default '',
  created_at timestamptz default now(),
  unique(match_id, rater_id)
);

-- Enable Realtime
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table matches;

-- RLS
alter table seeker_profiles enable row level security;
alter table employer_profiles enable row level security;
alter table jobs enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;
alter table ratings enable row level security;

create policy "users manage own seeker profile" on seeker_profiles for all using (auth.uid() = user_id);
create policy "anyone reads seeker profiles" on seeker_profiles for select using (true);
create policy "users manage own employer profile" on employer_profiles for all using (auth.uid() = user_id);
create policy "anyone reads employer profiles" on employer_profiles for select using (true);
create policy "employers manage own jobs" on jobs for all using (auth.uid() = (select user_id from employer_profiles where id = employer_id));
create policy "anyone reads active jobs" on jobs for select using (active = true);
create policy "users manage own swipes" on swipes for all using (auth.uid() = swiper_id);
create policy "match participants read matches" on matches for select using (
  auth.uid() = (select user_id from seeker_profiles where id = seeker_id) or
  auth.uid() = (select user_id from employer_profiles where id = employer_id)
);
create policy "match participants manage messages" on messages for all using (
  auth.uid() = sender_id or
  auth.uid() in (
    select sp.user_id from matches m
    join seeker_profiles sp on sp.id = m.seeker_id where m.id = match_id
    union
    select ep.user_id from matches m
    join employer_profiles ep on ep.id = m.employer_id where m.id = match_id
  )
);
create policy "users manage own ratings" on ratings for all using (auth.uid() = rater_id);
