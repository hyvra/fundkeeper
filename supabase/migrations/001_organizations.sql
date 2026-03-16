-- Migration 001: Organizations and Members
-- Fundkeeper crypto fund back-office

-- Organizations table
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Organization members
create table public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique(org_id, user_id)
);

-- Indexes
create index idx_org_members_user on public.org_members(user_id);
create index idx_org_members_org on public.org_members(org_id);

-- Enable RLS
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;

-- RLS: Organizations visible to members
create policy "Users can view their organizations"
  on public.organizations for select
  using (
    id in (
      select org_id from public.org_members
      where user_id = auth.uid()
    )
  );

create policy "Owners can update their organizations"
  on public.organizations for update
  using (
    id in (
      select org_id from public.org_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

create policy "Authenticated users can create organizations"
  on public.organizations for insert
  with check (auth.uid() is not null);

-- RLS: Org members visible to fellow members
create policy "Members can view fellow members"
  on public.org_members for select
  using (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid()
    )
  );

create policy "Owners can manage members"
  on public.org_members for all
  using (
    org_id in (
      select org_id from public.org_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "Users can add themselves as owner of new org"
  on public.org_members for insert
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and not exists (
      select 1 from public.org_members
      where org_id = org_members.org_id
    )
  );

-- Shared updated_at trigger function (used by all tables)
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_organizations_updated
  before update on public.organizations
  for each row execute function public.update_updated_at();
