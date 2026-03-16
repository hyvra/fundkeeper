-- Migration 009: Fix infinite recursion in org_members RLS policies
-- Self-referencing policies on org_members caused infinite recursion.
-- Use security definer functions to break the cycle.

CREATE OR REPLACE FUNCTION public.get_user_org_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT org_id FROM org_members WHERE user_id = uid;
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(uid uuid, oid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = uid AND org_id = oid AND role IN ('owner', 'admin')
  );
$$;

-- Replace recursive SELECT policy
DROP POLICY IF EXISTS "Members can view fellow members" ON org_members;
CREATE POLICY "Members can view fellow members"
  ON org_members FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Replace recursive ALL policy with specific write policies
DROP POLICY IF EXISTS "Owners can manage members" ON org_members;

CREATE POLICY "Owners can update members"
  ON org_members FOR UPDATE
  USING (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Owners can delete members"
  ON org_members FOR DELETE
  USING (public.is_org_admin(auth.uid(), org_id));
