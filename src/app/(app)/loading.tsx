import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function AppLoading() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />

      {/* Summary cards — matches dashboard 4-column grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
            </CardHeader>
            <CardContent>
              <div className="h-7 w-16 bg-muted animate-pulse rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content card */}
      <Card>
        <CardHeader>
          <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted animate-pulse rounded-md" style={{ width: `${85 - i * 10}%` }} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
