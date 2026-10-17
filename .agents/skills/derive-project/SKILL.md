---
name: derive-project
description: Create an independent application from Orkide with shared Git history, upstream updates, optional authorized local dev settings, and isolated Cloudflare resources. Use when starting an Orkide-derived sample or product, or preparing its first deployment.
---

# Derive an Orkide project

Keep Orkide as the maintained upstream and give the derived app its own repository and deployment lifecycle. Preserve the existing monorepo layout so upstream changes remain practical to merge.

Run the phases the user requested. A disposable local example needs no GitHub repository, Cloudflare resources, or deployment. Copying local settings requires authorization for those files; connecting builds, provisioning resources, data migration, and deployment require authorization within the current task. Reuse existing authorization instead of asking again.

## 1. Resolve the source and destination

- Locate the current Orkide checkout; paths may have moved. Read its `AGENTS.md`, `docs/operations.md`, `docs/decisions.md`, package scripts, and both `apps/*/wrangler.jsonc` files.
- Inspect Git status, the selected base branch/commit, shallow status, and remotes. Default to the source's main branch unless the user selected another ref. Preserve uncommitted source changes; explain that a clone includes committed work only.
- Resolve the upstream from the source's canonical remote, usually `origin`. Never print or store credentials embedded in a remote URL; use a credential-free URL and the existing credential manager.
- Create a clearly named sibling of Orkide in the requested parent directory. Reject an occupied destination rather than deleting or overwriting it. For an existing product, inspect its history and agree on the integration before replacing any files or remotes.
- A source checkout must have complete history. Do not substitute an archive, a shallow clone, `git init`, or GitHub's `Use this template`: the latter starts new history.
- Respect the current writable roots. If moving the workspace made the destination fall outside them, request the narrow filesystem escalation for the already authorized operation; never bypass a rejected approval review.

## 2. Create an independent repository

Use an ordinary full-history clone, with no submodule, worktree, shared object store, or symlink to the source. A local clone preserves unpushed commits reachable from the selected source branch. Keep `apps/api`, `apps/web`, `packages/*` and existing `@orkide/*` package names initially.

The variables below are task-specific values resolved in phase 1, not values to invent. `DERIVE_UPSTREAM` is Orkide's credential-free canonical URL; `DERIVE_BASE` is the selected branch.

```bash
git clone --no-hardlinks --origin upstream --branch "$DERIVE_BASE" "$DERIVE_SOURCE" "$DERIVE_DEST"
git -C "$DERIVE_DEST" remote set-url upstream "$DERIVE_UPSTREAM"
git -C "$DERIVE_DEST" branch --unset-upstream
git -C "$DERIVE_DEST" config remote.upstream.pushurl DISABLED
git -C "$DERIVE_DEST" config remote.pushDefault origin
```

This example assumes a named source branch. For an explicitly selected tag or commit, clone the complete repository and create the product branch at that ref before configuring its tracking; do not change the source's branch.

Leave `origin` absent until the user supplies or authorizes a product repository. Do not point it at Orkide. When an authorized product remote exists, add it as `origin` and track `origin/main` after the initial push. Keep upstream's disabled push URL unless the user explicitly requests contributing to Orkide.

Add product features in the existing feature modules and put generally reusable fixes in Orkide. Avoid wholesale path or package renaming just for branding. Product identity also appears in `apps/web/astro.config.ts`, `apps/web/src/shared/site.ts`, `packages/auth/src/options.ts`, translations, and media; adapt those when customization is requested.

## 3. Optional local development settings

Ignored files are not cloned. `apps/api/.dev.vars` is required by `apps/api/scripts/require-dev-vars.ts` before `pnpm dev` or preview can start.

When the user authorizes transferring existing values:

1. Check the named source file exists without displaying its contents. If absent, report the filename and ask where the existing values are; do not invent real credentials.
2. Check the destination is ignored with `git check-ignore` and is absent from `git ls-files` before copying. Check both file paths resolve to the intended repositories; do not follow an unexpected symlink.
3. Use exclusive destination creation so a file appearing meanwhile cannot be overwritten. If the destination exists, compare silently: keep an identical file; for different contents, preserve it and obtain the user's choice.
4. Copy the authorized file verbatim. Preserve existing restrictive permissions; remove group/other access if the source was broader. Never print, log, diff, hash for display, commit, or relay any values.
5. Verify byte equality without printing data, restrictive permissions, and ignored/untracked status. Check other local env filenames only when the requested dev flow needs them; never bulk-copy `.env*`, credential stores, `.wrangler` state, or build outputs.
6. Report filenames and the result only. Run the existing required-vars preflight from `apps/api` when verifying local setup. Do not silently rewrite copied values. If needed, propose development settings for `ENVIRONMENT` and the local `BETTER_AUTH_URL` separately.

Without permission to copy secrets, use `.dev.vars.example` as the variable-name reference and obtain appropriate local values. Copied credentials authorize neither source production access nor reuse as product production secrets.

Install with the repository's pinned Node/pnpm versions when local setup is requested. Apply `db:migrate:local` to the clone's own local D1 before running a fresh app. Keep local test/demo seeds local. Start `pnpm dev` only when requested.

The Vite plugin can copy `.dev.vars` into the API build output. Keep real local secrets out of uploaded/shared build caches and production builds; use a clean production checkout with runtime secrets configured on the product Worker.

## 4. Prepare the product's Cloudflare setup

For Cloudflare provisioning or deployment, read [references/cloudflare.md](references/cloudflare.md). It explains which product boundaries must be isolated and why. Prefer an available, connected and authorized Cloudflare MCP; otherwise use your Cloudflare knowledge and normal Cloudflare tools. Never change Orkide's production setup while initializing a product. A disposable local example needs no Cloudflare setup.

## 5. Keep upstream updates reviewable

In the product repo, fetch `upstream` and merge its selected branch into a product integration branch, such as `codex/upstream-sync`. Base it on the current product main branch, resolve conflicts, perform the requested checks, and review a PR before merging into a branch with automatic deployment.

Use a merge commit for recurring upstream integration. Squashing the integration discards upstream ancestry from product main; rebasing published product history changes commit identities. Preserve product resources, origins and secrets while resolving config changes. Inspect migration ordering and generated snapshots; keep already applied migrations immutable.

Orkide's current Workers Builds deploy from main and apply remote API migrations before deployment. GitHub CI verifies separately and does not inherently block those builds. Shared package updates may deploy API and web in parallel; changes must remain compatible during that interval. Recheck the product resource map on every upstream update affecting deployment.

## 6. Verify and report

For a fresh local clone:

- Compare the selected source commit, tree, and reachable history with the clone before customization; confirm it is not shallow.
- Check that `.git` is an independent directory and `.git/objects/info/alternates` is absent. `git fsck --full --no-dangling` can check object integrity without listing inherited unused objects.
- Confirm `upstream` is the canonical Orkide URL, upstream push is disabled, and `origin` is absent or points only to the authorized product repo.
- Check tracked status of both source and product. Report existing changes separately; source files, remotes, and deployment settings must be preserved.
- For a copied env file, report only its filename, copy/preflight result, and ignored status.
- For Cloudflare work, complete the reference's product-specific preflight and report provisioned resource names, executed checks, and remaining setup without secrets.

Do not run broad application tests for a clone or skill/documentation-only change. If the task includes application edits or verification, run checks appropriate to those changes.
