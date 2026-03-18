-- Enable Vault extensions
-- Supabase manages pgsodium schema automatically
create extension if not exists pgsodium;
-- supabase_vault is pre-installed on Supabase hosted projects

-- Function to retrieve decrypted API credentials for a connection
-- Used by the cron sync job
create or replace function get_connection_secrets(connection_id uuid)
returns table (
  api_key text,
  api_secret text,
  passphrase text
)
language plpgsql
security definer
set search_path = public, vault
as $$
begin
  return query
  select
    dk.decrypted_secret as api_key,
    ds.decrypted_secret as api_secret,
    dp.decrypted_secret as passphrase
  from exchange_connections ec
  left join vault.decrypted_secrets dk on dk.id = ec.api_key_id
  left join vault.decrypted_secrets ds on ds.id = ec.api_secret_id
  left join vault.decrypted_secrets dp on dp.id = ec.passphrase_id
  where ec.id = connection_id;
end;
$$;
