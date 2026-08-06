import { Badge, Button, Card, CardContent, Skeleton } from "@family/ui";
import { useQuery } from "@tanstack/react-query";
import { Activity, Database, RefreshCw } from "lucide-react";
import { api } from "../lib/api-client.js";

interface HealthResponse {
  status: "ok" | "degraded";
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  db: { connected: boolean; ping: boolean };
}

export function HealthPage() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<HealthResponse>("/health-check"),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Activity className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold">System health</h1>
          <p className="text-sm text-muted">Status of the Family Portal API</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-5 p-6">
          {isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : isError || !data ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-error">Could not reach the API.</p>
              <Button variant="outline" onClick={() => void refetch()}>
                <RefreshCw /> Retry
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Service</span>
                <Badge variant={data.status === "ok" ? "success" : "warning"}>
                  {data.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API</span>
                <span className="font-mono text-sm">
                  {data.service} v{data.version}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <span className="flex items-center gap-1.5 text-sm">
                  <Database className="size-4 text-muted" />
                  {data.db.connected ? "connected" : "disconnected"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uptime</span>
                <span className="font-mono text-sm">{data.uptimeSeconds}s</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={isFetching ? "animate-spin" : ""} />
                Refresh
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
