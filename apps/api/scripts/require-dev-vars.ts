/**
 * Fails fast, with instructions, when the local secrets file is missing or incomplete. Without it
 * the Worker throws a ZodError while booting (`@orkide/auth` validates its environment at load),
 * which surfaces as an opaque "Workers runtime failed to start".
 *
 * Production builds do not need this file: deployed Workers get secrets from Cloudflare.
 * Usage: `node scripts/require-dev-vars.ts [path-to-.dev.vars]` (defaults to the source file).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const required = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
] as const;

const file = path.resolve(
  process.argv[2] ?? path.resolve(import.meta.dirname, "../.dev.vars")
);

const fail = (reason: string): never => {
  process.stderr.write(
    `${reason}\nCreate apps/api/.dev.vars from apps/api/.dev.vars.example (BETTER_AUTH_SECRET needs 32+ characters; any value works locally, GitHub and Resend values may be placeholders) and rebuild with \`pnpm build\`. See docs/operations.md, "Local setup".\n`
  );
  process.exit(1);
};

if (!existsSync(file)) {
  fail(`Missing ${file}.`);
}

const values = new Map(
  readFileSync(file, "utf-8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      return [
        line.slice(0, separator).trim(),
        line.slice(separator + 1).trim(),
      ] as const;
    })
);
const missing = required.filter((key) => !values.get(key));
if (missing.length > 0) {
  fail(`${file} has no value for: ${missing.join(", ")}.`);
}
