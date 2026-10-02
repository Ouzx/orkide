#!/bin/bash
# SessionStart hook: makes a Claude Code on the web (cloud) session able to run `pnpm dev` and `pnpm test`.
# Does nothing locally (CLAUDE_CODE_REMOTE is only "true" in cloud VMs).
# Cloud VMs ship Node 20-22; this repo needs Node >= 24 (.node-version), so Node is fetched from nodejs.org.
# Secrets never live here: apps/api/.dev.vars is written from environment variables, falling back to the
# same throwaway placeholders CI uses (.github/actions/local-stack/action.yml).
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

want="$(tr -d '[:space:]' < .node-version)"
if [ "$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null)" != "$want" ]; then
  node_home="$HOME/.local/node-$want"
  if [ ! -x "$node_home/bin/node" ]; then
    mkdir -p "$node_home"
    version="$(curl -fsSL "https://nodejs.org/dist/latest-v$want.x/SHASUMS256.txt" | grep -o "node-v[0-9.]*-linux-x64.tar.xz" | head -1)"
    curl -fsSL "https://nodejs.org/dist/latest-v$want.x/$version" | tar -xJ -C "$node_home" --strip-components=1 || exit 0
  fi
  export PATH="$node_home/bin:$PATH"
  [ -n "$CLAUDE_ENV_FILE" ] && echo "export PATH=\"$node_home/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi

# The pnpm version is pinned by package.json "packageManager"; corepack activates it.
corepack enable >/dev/null 2>&1 || npm install -g corepack pnpm >/dev/null 2>&1

[ -d node_modules ] || pnpm install --frozen-lockfile || exit 0

dev_vars=apps/api/.dev.vars
if [ ! -f "$dev_vars" ]; then
  cat > "$dev_vars" <<VARS
ENVIRONMENT=${ENVIRONMENT:-development}
LOG_LEVEL=${LOG_LEVEL:-warn}
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:-cloud-only-secret-cloud-only-secret-000}
BETTER_AUTH_URL=${BETTER_AUTH_URL:-http://localhost:4321}
TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET_KEY:-1x0000000000000000000000000000000AA}
RESEND_API_KEY=${RESEND_API_KEY:-re_cloud_placeholder}
GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID:-cloud-placeholder}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET:-cloud-placeholder}
ANALYTICS_API_TOKEN=${ANALYTICS_API_TOKEN:-}
VARS
fi

# Fresh containers start with an empty local D1; apply pending migrations (idempotent) so `pnpm dev` serves pages.
pnpm --filter @orkide/api db:migrate:local >/dev/null 2>&1 || true
exit 0
