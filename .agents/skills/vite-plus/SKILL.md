---
name: vite-plus
description: Routes toolchain work through the `vp` CLI (Vite+). Use when installing deps, running check/test/dev/build, choosing `vp` vs `vp run`, or diagnosing setup/runtime/package-manager issues.
---

# Vite+

Use `vp` for runtime, packages, and frontend tooling (Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, Vite Task). Vite+ ≠ Vite; `vp dev` / `vp build` invoke Vite.

Docs: `node_modules/vite-plus/docs` or https://viteplus.dev/guide/. Discover commands with `vp help` / `vp <command> --help`.

## `vp` vs `vp run`

| Form            | Runs                                           |
| --------------- | ---------------------------------------------- |
| `vp <name>`     | Built-in                                       |
| `vp run <name>` | `package.json` script or `vite.config.ts` task |

Scripts cannot overwrite built-ins — `vp dev` and `vp run dev` may differ. Read those files first; use `vp run <name>` when a script or task defines that name.

## Validate

Copy and track:

```
- [ ] vp install   (after pull / before start)
- [ ] vp check     (format, lint, types)
- [ ] vp test
- [ ] vp run <script> for any project validation scripts/tasks
```

**Done when:** deps installed for current tree; `vp check` and `vp test` have been run; every needed project script/task ran via `vp run`.

## Diagnose env

When setup, runtime, or package-manager behavior looks wrong: run `vp env doctor` and include its output when asking for help.

**Done when:** doctor has been run and its output is in the handoff.
