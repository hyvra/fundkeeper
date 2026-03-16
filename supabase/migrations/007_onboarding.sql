-- Migration 007: Onboarding state
-- Track whether an organization has completed initial setup

alter table public.organizations
  add column onboarding_completed_at timestamptz;
