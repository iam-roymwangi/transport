import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-4 w-96 max-w-full bg-slate-200/70 dark:bg-slate-800/70 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden border border-slate-200/80 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-3 w-32 bg-slate-200/60 dark:bg-slate-800/60 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-3.5 w-72 max-w-full bg-slate-200/60 dark:bg-slate-800/60 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
              <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <Spinner className="w-5 h-5 text-primary absolute" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Loading page content...
              </p>
              <p className="text-xs text-muted-foreground">
                Retrieving transport and schedule records
              </p>
            </div>
          </div>

          {/* Shimmering Table Rows */}
          <div className="space-y-3 pt-4 border-t">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="flex items-center gap-4 py-2">
                <div className="h-4 w-36 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-pulse" />
                <div className="h-4 w-28 bg-slate-200/60 dark:bg-slate-800/60 rounded animate-pulse" />
                <div className="h-4 w-32 bg-slate-200/50 dark:bg-slate-800/50 rounded animate-pulse" />
                <div className="h-4 flex-1 bg-slate-200/40 dark:bg-slate-800/40 rounded animate-pulse hidden md:block" />
                <div className="h-6 w-20 bg-slate-200/70 dark:bg-slate-800/70 rounded-full animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
