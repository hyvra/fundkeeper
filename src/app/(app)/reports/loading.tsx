import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ReportsLoading() {
  return (
    <div className="space-y-8">
      {/* Header with title + button */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-8 w-36 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Table card */}
      <Card>
        <CardHeader>
          <div className="h-5 w-40 bg-muted animate-pulse rounded-md" />
        </CardHeader>
        <CardContent>
          {/* Table header */}
          <div className="flex gap-4 border-b pb-3 mb-3">
            <div className="h-4 w-14 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
          </div>
          {/* Table rows */}
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-5 w-16 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-40 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-48 bg-muted animate-pulse rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
