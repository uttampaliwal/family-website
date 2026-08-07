import { useQuery } from "@tanstack/react-query";
import type { NlResponse } from "@family/core";
import { api } from "../../lib/api-client.js";

/**
 * Natural-language ("AI") search. The query is parsed locally on the
 * server by a rule-based parser — no external model — and routed to the
 * right dataset, possibly with a direct answer (e.g. a birthday).
 */
export function useNaturalSearch(query: string, enabled: boolean) {
  const q = query.trim();
  return useQuery({
    queryKey: ["search", "nl", q],
    queryFn: () =>
      api.get<NlResponse>(`/search/nl?q=${encodeURIComponent(q)}`),
    enabled: enabled && q.length >= 2,
    staleTime: 60_000,
    retry: false,
  });
}