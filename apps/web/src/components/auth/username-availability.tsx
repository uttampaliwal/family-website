import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../i18n/index.js";
import { api } from "../../lib/api-client.js";

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "unavailable"; issues?: string[] };

export function UsernameAvailability({
  username,
  onResult,
}: {
  username: string;
  onResult: (result: { checking: boolean; available: boolean }) => void;
}) {
  const { t } = useI18n();
  const [state, setState] = useState<CheckState>({ status: "idle" });
  const checkedValue = useRef<string | null>(null);

  useEffect(() => {
    const value = username.trim().toLowerCase();
    if (value.length < 3) {
      checkedValue.current = null;
      setState({ status: "idle" });
      onResult({ checking: false, available: true });
      return;
    }
    if (value === checkedValue.current) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setState({ status: "checking" });
      onResult({ checking: true, available: true });
      try {
        const res = await api.get<{
          valid: boolean;
          available: boolean;
          issues?: string[];
        }>(`/auth/check-username?username=${encodeURIComponent(value)}`);
        if (cancelled) return;
        checkedValue.current = value;
        if (!res.valid || !res.available) {
          setState({ status: "unavailable", issues: res.issues });
          onResult({ checking: false, available: false });
        } else {
          setState({ status: "available" });
          onResult({ checking: false, available: true });
        }
      } catch {
        if (cancelled) return;
        setState({ status: "idle" });
        onResult({ checking: false, available: true });
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, onResult]);

  if (state.status === "idle") return null;

  return (
    <p className="flex items-center gap-1.5 text-xs" aria-live="polite">
      {state.status === "checking" && (
        <>
          <Loader2 className="size-3.5 animate-spin text-muted" />
          <span className="text-muted">{t("register.availability.checking")}</span>
        </>
      )}
      {state.status === "available" && (
        <>
          <CheckCircle2 className="size-3.5 text-success" />
          <span className="font-medium text-success">{t("register.availability.available")}</span>
        </>
      )}
      {state.status === "unavailable" && (
        <>
          <XCircle className="size-3.5 text-error" />
          <span className="font-medium text-error">
            {state.issues?.[0] ?? t("register.availability.taken")}
          </span>
        </>
      )}
    </p>
  );
}