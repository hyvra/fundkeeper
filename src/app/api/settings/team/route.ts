import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 })
  }

  const { data: members, error } = await supabase
    .from('org_members')
    .select('id, user_id, role, created_at')
    .eq('org_id', membership.org_id)
    .order('created_at', { ascending: true })

  if (error || !members) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }

  // Use admin client to look up user emails from auth.users
  const adminClient = createAdminClient()
  const userIds = members.map((m) => m.user_id)

  const { data: authUsers } = await adminClient.auth.admin.listUsers()

  const emailMap: Record<string, string> = {}
  if (authUsers?.users) {
    for (const authUser of authUsers.users) {
      if (userIds.includes(authUser.id)) {
        emailMap[authUser.id] = authUser.email ?? 'Unknown'
      }
    }
  }

  const enrichedMembers = members.map((m) => ({
    id: m.id,
    user_id: m.user_id,
    email: emailMap[m.user_id] ?? 'Unknown',
    role: m.role,
    created_at: m.created_at,
    is_current_user: m.user_id === user.id,
  }))

  return NextResponse.json({ members: enrichedMembers })
}
