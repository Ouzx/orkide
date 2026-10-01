import { m } from "@orkide/i18n/messages";
import { Button } from "@orkide/ui/components/button";
import { Skeleton } from "@orkide/ui/components/skeleton";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { RotateCcw, TriangleAlert } from "lucide-react";
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
  <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="mt-1 text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
  </header>
);

const LoadError = ({
  resetErrorBoundary,
}: {
  readonly resetErrorBoundary: () => void;
}) => {
  const { options } = useAdmin();
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-2xl border border-dashed glass p-10 text-center"
    >
      <TriangleAlert aria-hidden="true" className="size-6 text-destructive" />
      <p className="text-muted-foreground">{m.admin_load_error({}, options)}</p>
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
  <p className="rounded-2xl border border-dashed glass p-10 text-center text-muted-foreground">
    {children}
  </p>
);

/** Glass surface with an optional heading (plain elements: shadcn `Card` does not take `glass`). */
export const Panel = ({
  title,
  children,
}: {
  readonly title?: string;
  readonly children: ReactNode;
}) => (
  <section className="space-y-4 rounded-2xl border glass p-5">
    {title ? <h2 className="font-medium">{title}</h2> : null}
    {children}
  </section>
);

/** A headline number: label, value and an optional footnote. `rating` tints the value. */
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
  <div className="space-y-1 rounded-2xl border glass p-5">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p
      className="text-3xl font-semibold tabular-nums data-[rating=fair]:text-chart-4 data-[rating=good]:text-chart-3 data-[rating=poor]:text-destructive"
      data-rating={rating}
    >
      {children}
    </p>
    {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
  </div>
);
