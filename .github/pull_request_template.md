## What and why

<!-- One or two sentences. Link the issue: Closes #123 -->

## Checklist

- [ ] Conventional commit title with a workspace scope (`feat(api): ...`)
- [ ] `pnpm check`, `pnpm typecheck` and `pnpm test` pass (re-run tests after `pnpm fix`)
- [ ] Types are derived (Drizzle -> `@orkide/validators`), none hand-written
- [ ] User-facing strings go through Paraglide (en and tr)
- [ ] Errors are `ApiError` problems; public pages stay a pure function of their URL
- [ ] Docs or an ADR in `docs/decisions.md` updated if a decision changed
