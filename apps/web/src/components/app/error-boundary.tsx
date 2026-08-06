import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, Home, RefreshCcw, RotateCcw } from "lucide-react";
import { Button } from "@family/ui";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[error-boundary]", error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="grid min-h-dvh place-items-center bg-background p-4"
      >
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-error/10 text-error">
            <AlertCircle className="size-7" />
          </span>
          <div className="space-y-1.5">
            <h1 className="font-display text-xl font-bold">
              Something went wrong
            </h1>
            <p className="text-sm text-muted">
              This was unexpected and on us — your data is safe. Try again, or
              head back home.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Button onClick={this.reset}>
              <RotateCcw />
              Try again
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCcw />
              Reload page
            </Button>
            <Button asChild variant="ghost">
              <Link to="/">
                <Home />
                Go home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}