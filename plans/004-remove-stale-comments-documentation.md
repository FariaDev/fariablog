# Plan 004: Remove the obsolete comments promise from architecture documentation

> **Executor instructions**: Follow this plan exactly. This is a documentation correction, not a feature restoration. Update the row in `plans/README.md` when complete.
>
> **Drift check (run first)**: `git diff --stat 84efd62..HEAD -- docs/ARCHITECTURE.md README.md layouts assets config.toml`
> If a comments implementation has been reintroduced, STOP and report instead of deleting documentation.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `84efd62`, 2026-07-21

## Why this matters

The architecture document says comments load after consent, but the Disqus integration, configuration, templates, and client code were removed. This is an inaccurate privacy and product contract. Future maintainers could waste time preserving or debugging a feature that no longer exists.

## Current state

- `docs/ARCHITECTURE.md:54` says: `comentários carregados apenas após consentimento`.
- `layouts/posts/single.html` has no comments section.
- `assets/js/article.js` implements only link/code copying and heading anchors.
- `config.toml` has no comments provider configuration.
- README no longer advertises comments.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Search | `rg -ni "comment|comentário|disqus" README.md docs config.toml layouts assets i18n` | no product claim or integration remains |
| Gate | `./scripts/verify.sh` | exit 0 |
| Hygiene | `git diff --check` | exit 0 |

## Scope

**In scope**:
- `docs/ARCHITECTURE.md`

**Out of scope**:
- Adding or restoring comments
- Editing article prose that happens to discuss comments as a subject
- Privacy policy work
- Any source template or JavaScript change

## Git workflow

- Branch: `advisor/004-remove-comments-doc`
- One commit: `docs: remove obsolete comments claim`
- Do not push unless instructed.

## Steps

### Step 1: Remove only the obsolete principle

Delete the comments-consent bullet from `docs/ARCHITECTURE.md`. Preserve the surrounding principles and formatting. Do not replace it with a claim that comments are permanently forbidden; the architecture only needs to describe current behavior.

**Verify**: `rg -ni "comment|comentário|disqus" docs/ARCHITECTURE.md` → no matches.

### Step 2: Confirm documentation and implementation agree

Search source/documentation for stale integration references. Exclude article prose only if a legitimate article uses the word in its subject matter.

**Verify**:

```bash
rg -ni "disqus|data-comments|load_comments|comentários carregados" README.md docs config.toml layouts assets i18n
```

Expected: no matches.

### Step 3: Run standard checks

**Verify**: `./scripts/verify.sh && git diff --check` → exit 0.

## Test plan

No new automated test is warranted for a one-line documentation correction. Existing build/gate must remain green.

## Done criteria

- [ ] Architecture no longer claims comments exist.
- [ ] No implementation-facing Disqus/comments reference remains.
- [ ] `./scripts/verify.sh` exits 0.
- [ ] Only `docs/ARCHITECTURE.md` and `plans/README.md` are modified.
- [ ] Plan status is updated.

## STOP conditions

- Comments code/config has returned since commit `84efd62`.
- The product owner wants comments restored rather than the docs corrected.

## Maintenance notes

If comments are introduced later, document the provider, third-party request behavior, consent boundary, and no-JavaScript fallback in the same change.
