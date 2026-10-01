import { env } from "cloudflare:workers";

import { resolveAdminSession } from "./session.ts";
import type { AdminSession } from "./session.ts";

export type { AdminSession, AdminUser } from "./session.ts";

/** The visitor's dashboard session, resolved over the API Service Binding. */
export const getAdminSession = (request: Request): Promise<AdminSession> =>
  resolveAdminSession(request, (input, init) => env.API.fetch(input, init));
