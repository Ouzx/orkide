import type { Session } from "@orkide/auth";
import { isRole } from "@orkide/auth/permissions";
import type { Role } from "@orkide/auth/permissions";

/** The signed-in admin as the dashboard needs it: Better Auth's user, narrowed to a known role. */
export type AdminUser = Pick<Session["user"], "email" | "id" | "name"> & {
  readonly image: string | null;
  readonly role: Role;
};

/** What the session check found: a dashboard user, nobody, or an API that asked us to slow down. */
export type AdminSession =
  | { readonly status: "anonymous" }
  | { readonly status: "rate-limited"; readonly retryAfter: number }
  | { readonly status: "ok"; readonly user: AdminUser };

type SessionFetcher = (input: string, init: RequestInit) => Promise<Response>;

const RATE_LIMITED = 429;
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 250;
const MAX_DELAY_MS = 2000;
const DEFAULT_RETRY_AFTER_SECONDS = 5;
const MS_PER_SECOND = 1000;

/** Seconds from a `Retry-After` header (delta-seconds form); falls back when absent or malformed. */
const parseRetryAfter = (value: string | null): number => {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0
    ? Math.ceil(seconds)
    : DEFAULT_RETRY_AFTER_SECONDS;
};

const sleep = (ms: number): Promise<void> =>
  // oxlint-disable-next-line promise/avoid-new -- a timer has no promise-returning platform API.
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Asks the API for the session, quietly retrying a 429 with backoff that honours `Retry-After`. */
const fetchSession = async (
  fetcher: SessionFetcher,
  cookie: string,
  attempt = 0
): Promise<Response> => {
  const response = await fetcher("http://localhost/api/auth/get-session", {
    headers: { cookie },
  });
  if (response.status !== RATE_LIMITED || attempt >= MAX_RETRIES) {
    return response;
  }
  const hinted = Number(response.headers.get("retry-after")) * MS_PER_SECOND;
  const backoff = BASE_DELAY_MS * 2 ** attempt;
  await sleep(Math.min(Math.max(hinted || 0, backoff), MAX_DELAY_MS));
  return fetchSession(fetcher, cookie, attempt + 1);
};

/**
 * Resolves the visitor's session by asking the API (over the Service Binding) with their cookie.
 * Anonymous visitors and users without a dashboard role are `anonymous`; a 429 that survives the
 * retries is `rate-limited` so a valid user is told to wait instead of being sent to sign-in.
 */
export const resolveAdminSession = async (
  request: Request,
  fetcher: SessionFetcher
): Promise<AdminSession> => {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return { status: "anonymous" };
  }
  const response = await fetchSession(fetcher, cookie);
  if (response.status === RATE_LIMITED) {
    return {
      retryAfter: parseRetryAfter(response.headers.get("retry-after")),
      status: "rate-limited",
    };
  }
  if (!response.ok) {
    return { status: "anonymous" };
  }
  const payload = await response.json<Session | null>();
  const user = payload?.user;
  if (!(user && isRole(user.role))) {
    return { status: "anonymous" };
  }
  return {
    status: "ok",
    user: {
      email: user.email,
      id: user.id,
      image: user.image ?? null,
      name: user.name,
      role: user.role,
    },
  };
};
