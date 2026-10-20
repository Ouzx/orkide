import { m } from "@orkide/i18n/messages";
import { Button } from "@orkide/ui/kit/button";
import { Skeleton } from "@orkide/ui/kit/skeleton";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { useAdmin } from "../context.tsx";

export const PageHeader = ({
  title,
  description,
  actions,
}: {
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
}) => (
  <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
    <div className="min-w-0">
      <h1 className="o-title text-section">{title}</h1>
      {description ? (
        <p className="mt-2 mb-0 max-w-[40em] text-ink-2">{description}</p>
      ) : null}
    </div>
    {actions ? (
      <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
    ) : null}
  </header>
);

const LoadError = ({
  resetErrorBoundary,
}: {
  readonly resetErrorBoundary: () => void;
}) => {
  const { options } = useAdmin();
  return (
    <div role="alert" className="o-card grid justify-items-start gap-4 p-5">
      <span className="o-badge" data-tone="danger">
        {m.admin_fault({}, options)}
      </span>
      <p className="m-0 text-ink-2">{m.admin_load_error({}, options)}</p>
      <Button variant="outline" onClick={resetErrorBoundary}>
        <RotateCcw aria-hidden="true" />
        {m.admin_retry({}, options)}
      </Button>
    </div>
  );
};

export const LoadingSkeleton = () => (
  <div className="space-y-3" aria-busy="true">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-2/3" />
  </div>
);

/**
 * Suspense + error boundary for a data-driven region: `useSuspenseQuery` inside suspends to the
 * skeleton; a failed query renders a retry that also resets React Query's error state.
 */
export const QueryBoundary = ({
  children,
  fallback,
}: {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}) => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary onReset={reset} FallbackComponent={LoadError}>
        <Suspense fallback={fallback ?? <LoadingSkeleton />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);

export const EmptyRow = ({ children }: { readonly children: ReactNode }) => (
  <div className="o-empty">
    <p>{children}</p>
  </div>
);

/** A card on the drafting table, with an optional heading. */
export const Panel = ({
  title,
  children,
}: {
  readonly title?: string;
  readonly children: ReactNode;
}) => (
  <section className="o-card space-y-4 p-5">
    {title ? <h2 className="o-card-title">{title}</h2> : null}
    {children}
  </section>
);

/** Which ink a rating's dot takes. */
const RATING_TONE = { fair: "warn", good: "ok", poor: "mark" } as const;

/** A reading: label, its value and an optional footnote. `rating` colours its dot. */
export const StatTile = ({
  label,
  children,
  hint,
  rating,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly hint?: string;
  readonly rating?: "good" | "fair" | "poor";
}) => (
  <div className="o-stat">
    <div className="flex items-center justify-between gap-2">
      <p className="o-label m-0">{label}</p>
      <span
        className="o-dot"
        data-tone={rating ? RATING_TONE[rating] : "ok"}
        aria-hidden="true"
      />
    </div>
    <p className="o-stat-value">{children}</p>
    {hint ? <p className="m-0 font-mono text-xs text-ink-2">{hint}</p> : null}
  </div>
);
