import { useQuery } from "@tanstack/react-query";
import type { SearchResponse } from "@family/core";
import { api } from "../../lib/api-client.js";

/**
 * Global search across every family dataset. Enabled once the query has at
 * least 2 letters; server caps each group so the dropdown stays snappy.
 */
export function useGlobalSearch(query: string, enabled: boolean, limit = 5) {
  const q = query.trim();
  return useQuery({
    queryKey: ["search", q, limit],
    queryFn: () =>
      api.get<SearchResponse>(`/search?q=${encodeURIComponent(q)}&limit=${limit}`),
    enabled: enabled && q.length >= 2,
    staleTime: 60_000,
  });
}