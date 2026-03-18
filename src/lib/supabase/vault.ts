import { createAdminClient } from './admin'

/**
 * Store a secret in Supabase Vault and return the secret UUID.
 */
export async function storeSecret(name: string, secret: string): Promise<string> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('vault.create_secret', {
    new_secret: secret,
    new_name: name,
  })
  if (error) throw new Error(`Vault store failed: ${error.message}`)
  return data as string
}

/**
 * Retrieve a decrypted secret from Supabase Vault by its UUID.
 */
export async function getSecret(secretId: string): Promise<string> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('vault.decrypted_secrets')
    .select('decrypted_secret')
    .eq('id', secretId)
    .single()
  if (error) throw new Error(`Vault retrieve failed: ${error.message}`)
  return data.decrypted_secret
}

/**
 * Delete a secret from Supabase Vault by its UUID.
 */
export async function deleteSecret(secretId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.rpc('vault.delete_secret', {
    secret_id: secretId,
  })
  if (error) throw new Error(`Vault delete failed: ${error.message}`)
}
