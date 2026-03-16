import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ConnectionsLoading() {
  return (
    <div className="space-y-8">
      {/* Header with title + buttons */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-8 w-28 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      {/* Section heading */}
      <div className="space-y-4">
        <div className="h-6 w-24 bg-muted animate-pulse rounded-md" />

        {/* Card grid — matches 3-column layout */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-5 w-24 bg-muted animate-pulse rounded-md" />
                <div className="h-5 w-14 bg-muted animate-pulse rounded-md" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-40 bg-muted animate-pulse rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Second section */}
      <div className="space-y-4">
        <div className="h-6 w-20 bg-muted animate-pulse rounded-md" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-5 w-24 bg-muted animate-pulse rounded-md" />
                <div className="h-5 w-14 bg-muted animate-pulse rounded-md" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-3 w-full bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-28 bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-36 bg-muted animate-pulse rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
