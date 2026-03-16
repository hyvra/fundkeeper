import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AppNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-5xl font-bold text-muted-foreground">404</p>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Page not found</h2>
            <p className="text-sm text-muted-foreground">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>
          <Button variant="outline" render={<Link href="/dashboard" />}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
