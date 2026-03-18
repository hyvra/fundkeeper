import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />

      {/* Stats cards — 4-column grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded-md" />
            </CardHeader>
            <CardContent>
              <div className="h-7 w-16 bg-muted animate-pulse rounded-md" />
              <div className="mt-1 h-3 w-20 bg-muted animate-pulse rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Getting started checklist */}
      <Card>
        <CardHeader>
          <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-5 w-5 bg-muted animate-pulse rounded-full" />
                <div className="h-4 w-48 bg-muted animate-pulse rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent transactions table */}
      <Card>
        <CardHeader>
          <div className="h-5 w-40 bg-muted animate-pulse rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 border-b pb-3 mb-3">
            <div className="h-4 w-14 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-14 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded-md ml-auto" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
                <div className="h-5 w-16 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-12 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded-md ml-auto" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
