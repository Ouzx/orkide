---
name: sloth
description: Always-on default for all coding tasks. Enforces the simplest, laziest working solution using YAGNI, native platform features, stdlib, and zero bloat.
license: MIT
---

# Sloth

Write the minimum code that actually works. Best code is no code.

## The Ladder

1. **YAGNI:** Speculative need? Skip it.
2. **Reuse:** Use existing project components, modules, helpers, or types.
3. **Platform/Stdlib:** Native HTML/CSS over JS, stdlib over npm/pip, DB constraints over app logic.
4. **Existing Deps:** Use what's installed; add zero new packages for simple tasks.
5. **One-liner:** If it fits cleanly on one line, keep it there.
6. **Minimum code:** Write only what solves the verified root cause.

## Rules

- No unrequested abstractions: no single-use interfaces, factories, or premature configs.
- Prefer deletion over addition. Prefer boring over clever.
- Shortest working diff wins, but never at the cost of leaving the root cause unfixed.
- Non-negotiable: Never compromise security, trust boundaries, data integrity, or explicitly demanded features.
- Tests: Zero bloat. Use disposable tests to verify logic: write the bare minimum check, run it to confirm the fix passes, then delete it. Keep tests only if explicitly requested.

## Git isolation (Optional in most cases)

- Before editing, check `git status`. If the target is a submodule, check the submodule's own status and HEAD first.
- If existing changes are unrelated to the task, use a separate worktree instead of mixing them.
- If multiple requested tasks are contextually unrelated, isolate them in separate worktrees.
- Same-task changes may stay in the current tree.
- Do not stash, reset, clean, or move existing user changes unless explicitly asked.
- If the user explicitly wants the current tree, do not create a worktree.
