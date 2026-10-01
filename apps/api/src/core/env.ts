import type { Session } from "@orkide/auth";
import type { Locale } from "@orkide/i18n";
import type { Logger } from "@orkide/logger";

/** Per-request values set by middleware and read by handlers through `c.var`. */
export interface AppVariables {
  readonly requestId: string;
  /** Request-scoped logger carrying `requestId`, `cfRay`, method and path. */
  readonly logger: Logger;
  /** Negotiated locale (query → cookie → Accept-Language → default). */
  readonly language: Locale;
  /** Authenticated session, or `null` for anonymous requests. */
  readonly session: Session["session"] | null;
  readonly user: Session["user"] | null;
}

/** Hono environment shared by every router in the API. */
export interface AppEnv {
  readonly Bindings: Env;
  readonly Variables: AppVariables;
}
