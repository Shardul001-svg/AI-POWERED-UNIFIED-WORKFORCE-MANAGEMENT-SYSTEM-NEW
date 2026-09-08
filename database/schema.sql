create extension if not exists pgcrypto;

do $$ begin
  create type public.profile_role as enum ('ADMIN', 'HR', 'EMPLOYEE', 'CANDIDATE');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.employee_status as enum ('ACTIVE', 'INACTIVE');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.candidate_status as enum ('APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'REJECTED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.interview_status as enum ('SCHEDULED', 'COMPLETED', 'CANCELLED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.request_type as enum ('LEAVE', 'HR_QUERY', 'DOCUMENT', 'OTHER');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.request_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.task_status as enum ('TODO', 'IN_PROGRESS', 'COMPLETED');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  role public.profile_role not null,
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  employee_code text not null unique,
  phone text,
  department text not null,
  position text not null,
  joining_date date not null,
  status public.employee_status not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  position_applied text not null,
  experience integer not null default 0 check (experience >= 0),
  status public.candidate_status not null default 'APPLIED',
  created_at timestamptz not null default now()
);

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  interviewer uuid references public.profiles(id) on delete set null,
  interview_date date not null,
  interview_time time not null,
  status public.interview_status not null default 'SCHEDULED',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  type public.request_type not null,
  title text not null,
  description text,
  status public.request_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id) on delete set null,
  related_type text,
  related_id uuid,
  status public.task_status not null default 'TODO',
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists employees_profile_id_idx on public.employees(profile_id);
create index if not exists employees_department_idx on public.employees(department);
create index if not exists candidates_status_idx on public.candidates(status);
create index if not exists interviews_candidate_id_idx on public.interviews(candidate_id);
create index if not exists interviews_date_idx on public.interviews(interview_date);
create index if not exists requests_employee_id_idx on public.requests(employee_id);
create index if not exists requests_status_idx on public.requests(status);
create index if not exists tasks_assigned_to_idx on public.tasks(assigned_to);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists notifications_profile_id_idx on public.notifications(profile_id);
create index if not exists notifications_unread_idx on public.notifications(profile_id, is_read);
create index if not exists activities_profile_id_idx on public.activities(profile_id);
create index if not exists activities_created_at_idx on public.activities(created_at desc);