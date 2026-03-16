import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function CostBasisLoading() {
  return (
    <div className="space-y-8">
      {/* Header with title + button */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-8 w-28 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Summary cards — 4-column grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
            </CardHeader>
            <CardContent>
              <div className="h-7 w-20 bg-muted animate-pulse rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Open Lots table */}
      <Card>
        <CardHeader>
          <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 border-b pb-3 mb-3">
            <div className="h-4 w-14 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-18 bg-muted animate-pulse rounded-md ml-auto" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-14 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-4 w-12 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded-md ml-auto" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
                <div className="h-5 w-12 bg-muted animate-pulse rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Disposals table */}
      <Card>
        <CardHeader>
          <div className="h-5 w-40 bg-muted animate-pulse rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 border-b pb-3 mb-3">
            <div className="h-4 w-14 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-14 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-18 bg-muted animate-pulse rounded-md ml-auto" />
            <div className="h-4 w-18 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-18 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-4 w-12 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded-md ml-auto" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded-md" />
                <div className="h-5 w-12 bg-muted animate-pulse rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
