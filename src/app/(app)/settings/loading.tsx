import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Page title + description */}
      <div className="space-y-2">
        <div className="h-8 w-32 bg-muted animate-pulse rounded-md" />
        <div className="h-4 w-80 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b pb-px">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2">
            <div className="h-4 w-4 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
          </div>
        ))}
      </div>

      {/* Content area */}
      <Card>
        <CardHeader>
          <div className="h-5 w-40 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-12 bg-muted animate-pulse rounded-md" />
              <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
            </div>
            <div className="h-9 w-16 bg-muted animate-pulse rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
