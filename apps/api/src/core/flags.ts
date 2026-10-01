import { env } from "cloudflare:workers";

import { ApiError } from "./errors.ts";
import { factory } from "./factory.ts";

/**
 * Every Flagship flag the codebase reads. The registry is the contract with the dashboard:
 * keys must exist in the `orkide` Flagship app, and `fallback` is served whenever evaluation fails.
 * `public` flags are exposed to clients through `GET /api/flags`.
 */
export const flagRegistry = {
  "contact-form": { fallback: true, public: true },
  "hero-scene": { fallback: true, public: true },
  "live-visitors": { fallback: true, public: true },
} as const satisfies Record<
  string,
  { readonly fallback: boolean; readonly public: boolean }
>;

export type FlagKey = keyof typeof flagRegistry;

/** Attributes Flagship can target on (percentage rollouts hash `targetingKey`). */
export interface FlagContext {
  readonly targetingKey?: string;
  readonly locale?: string;
  readonly role?: string;
}

export const isEnabled = (
  key: FlagKey,
  context: FlagContext = {}
): Promise<boolean> =>
  env.FLAGS.getBooleanValue(key, flagRegistry[key].fallback, { ...context });

/** Evaluates every public flag for a client in parallel. */
export const evaluatePublicFlags = async (context: FlagContext = {}) => {
  const keys = (Object.keys(flagRegistry) as FlagKey[]).filter(
    (key) => flagRegistry[key].public
  );
  const values = await Promise.all(keys.map((key) => isEnabled(key, context)));
  return Object.fromEntries(
    keys.map((key, index) => [key, values[index] ?? flagRegistry[key].fallback])
  ) as Record<FlagKey, boolean>;
};

/** Rejects the request with `feature_disabled` when the flag is off — a kill switch per route. */
export const requireFlag = (key: FlagKey) =>
  factory.createMiddleware(async (c, next) => {
    const enabled = await isEnabled(key, {
      locale: c.var.language,
      role: c.var.user?.role ?? undefined,
    });
    if (!enabled) {
      throw new ApiError("feature_disabled");
    }
    await next();
  });
