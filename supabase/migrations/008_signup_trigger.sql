-- Migration 008: Auto-create org + membership on email confirmation
-- Trigger fires when email_confirmed_at goes from null to a value

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_name_val text;
  new_org_id uuid;
BEGIN
  -- Only run when email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD IS NULL) THEN
    org_name_val := COALESCE(NEW.raw_user_meta_data->>'org_name', 'My Fund');

    INSERT INTO public.organizations (name, slug)
    VALUES (org_name_val, NEW.id::text)
    RETURNING id INTO new_org_id;

    INSERT INTO public.org_members (org_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
