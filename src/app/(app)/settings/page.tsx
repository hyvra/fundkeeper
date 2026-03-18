'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Building2,
  Users,
  Palette,
  Link2,
  Sun,
  Moon,
  Monitor,
  Loader2,
  Check,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'organization' | 'team' | 'appearance' | 'connections'

interface Organization {
  id: string
  name: string
  created_at: string
}

interface TeamMember {
  id: string
  user_id: string
  email: string
  role: string
  created_at: string
  is_current_user: boolean
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'organization', label: 'Organization', icon: <Building2 className="h-4 w-4" /> },
  { id: 'team', label: 'Team', icon: <Users className="h-4 w-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
  { id: 'connections', label: 'Connections', icon: <Link2 className="h-4 w-4" /> },
]

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  member: 'outline',
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('organization')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your organization, team, and preferences.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'organization' && <OrganizationTab />}
      {activeTab === 'team' && <TeamTab />}
      {activeTab === 'appearance' && <AppearanceTab />}
      {activeTab === 'connections' && <ConnectionsTab />}
    </div>
  )
}

function OrganizationTab() {
  const [org, setOrg] = useState<Organization | null>(null)
  const [role, setRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const fetchOrg = useCallback(async () => {
    const res = await fetch('/api/settings/organization')
    if (res.ok) {
      const data = await res.json()
      setOrg(data.organization)
      setRole(data.role)
      setName(data.organization.name)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrg()
  }, [fetchOrg])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    const res = await fetch('/api/settings/organization', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })

    if (res.ok) {
      const data = await res.json()
      setOrg(data.organization)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to save')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!org) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No organization found.
        </CardContent>
      </Card>
    )
  }

  const canEdit = role === 'owner' || role === 'admin'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Name</CardTitle>
          <CardDescription>
            {canEdit
              ? 'Update your organization name.'
              : 'Only owners and admins can edit the organization name.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                maxLength={100}
              />
            </div>
            {canEdit && (
              <Button type="submit" disabled={saving || name.trim() === org.name}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saved && <Check className="h-4 w-4" />}
                {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
              </Button>
            )}
          </form>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(org.created_at).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Your role</dt>
              <dd>
                <Badge variant={ROLE_VARIANTS[role] ?? 'outline'}>
                  {role}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function TeamTab() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    const res = await fetch('/api/settings/team')
    if (res.ok) {
      const data = await res.json()
      setMembers(data.members)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No team members found.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          {members.length} member{members.length !== 1 ? 's' : ''} in your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.email}
                  {member.is_current_user && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={ROLE_VARIANTS[member.role] ?? 'outline'}>
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(member.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme()

  const options = [
    {
      value: 'light',
      label: 'Light',
      description: 'A clean, bright interface',
      icon: <Sun className="h-5 w-5" />,
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: <Moon className="h-5 w-5" />,
    },
    {
      value: 'system',
      label: 'System',
      description: 'Match your device settings',
      icon: <Monitor className="h-5 w-5" />,
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose how Fundkeeper looks for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-lg border p-6 text-center transition-colors',
                  theme === option.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <div className={cn(
                  'rounded-full p-3',
                  theme === option.value
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {option.icon}
                </div>
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ConnectionsTab() {
  const [stats, setStats] = useState<{
    exchanges: number
    wallets: number
    lastSync: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/settings/connections')
    if (res.ok) {
      const data = await res.json()
      setStats(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalConnections = (stats?.exchanges ?? 0) + (stats?.wallets ?? 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connected Sources</CardTitle>
          <CardDescription>
            Overview of your exchange and wallet connections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalConnections === 0 ? (
            <p className="text-sm text-muted-foreground">
              No connections yet. Head to the Connections page to add your first exchange or wallet.
            </p>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Exchanges</dt>
                <dd className="font-medium">{stats?.exchanges ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Wallets</dt>
                <dd className="font-medium">{stats?.wallets ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-medium">{totalConnections}</dd>
              </div>
              {stats?.lastSync && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Last sync</dt>
                  <dd className="font-medium">{new Date(stats.lastSync).toLocaleString()}</dd>
                </div>
              )}
            </dl>
          )}
        </CardContent>
      </Card>

      <div>
        <Button variant="outline" render={<Link href="/connections" />}>
          Manage connections
          <ExternalLink className="h-4 w-4" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
