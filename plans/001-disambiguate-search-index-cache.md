# Plan 001: Give each search index one unambiguous cache policy

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving on. If a STOP condition occurs, stop and report; do not improvise. When done, update this plan's row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 84efd62..HEAD -- static/_headers scripts/verify.py`
> If either file changed, compare the current code with the excerpts below. Any mismatch affecting route patterns or cache assertions is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug, tests
- **Planned at**: commit `84efd62`, 2026-07-21

## Why this matters

Cloudflare Pages applies every matching `_headers` rule. `/pt-br/index.json` and `/en/index.json` currently match both the localized one-hour rule and the generic five-minute JSON rule, producing two `max-age` directives. Conflicting cache directives have provider/browser-dependent semantics and make search freshness unpredictable. The simplest policy consistent with this small blog is to cache localized HTML, RSS, and search indexes for the same one-hour period and retain long immutable caching only for fingerprinted assets.

## Current state

- `static/_headers:22-33` contains overlapping routes:

```text
/pt-br/*
  Cache-Control: public, max-age=3600, must-revalidate

/en/*
  Cache-Control: public, max-age=3600, must-revalidate

/*.json
  Cache-Control: public, max-age=300, must-revalidate
```

- `scripts/verify.py:346-359` only checks that immutable caching is attached to an approved namespace and that `must-revalidate` occurs somewhere. It does not detect overlapping `Cache-Control` policies.
- The site deliberately uses one small localized full-text index per language (`/pt-br/index.json` and `/en/index.json`). No API responses or personalized data are involved.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Full gate | `./scripts/verify.sh` | exit 0; 52 production and 52 development HTML files verified |
| Diff hygiene | `git diff --check` | exit 0, no output |

## Scope

**In scope**:
- `static/_headers`
- `scripts/verify.py`

**Out of scope**:
- Cloudflare dashboard Cache Rules
- CSS/JS/image cache durations
- Search implementation or index contents
- Deployment documentation (Plan 006)

## Git workflow

- Branch: `advisor/001-search-index-cache`
- One commit: `fix: disambiguate search index caching`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Choose one policy for localized index files

Remove the separate `/*.json` rule from `static/_headers`. Update comments to state that `/pt-br/*` and `/en/*` intentionally cover localized HTML, RSS, and `index.json` with `max-age=3600, must-revalidate`. Do not add route-specific exceptions or dashboard assumptions.

**Verify**: `grep -n "json\|pt-br/\*\|en/\*" static/_headers` → localized routes remain; no separate JSON cache route remains.

### Step 2: Make the policy regression-proof

Extend the cache-policy section in `scripts/verify.py` so it parses routes and their `Cache-Control` values into a mapping. Assert:

1. `/pt-br/*` and `/en/*` each have exactly one cache value;
2. both equal `public, max-age=3600, must-revalidate`;
3. no additional route ending in `.json` or matching JSON defines another `Cache-Control` policy;
4. existing immutable namespace checks continue to pass.

Keep the verifier dependency-free and follow its existing `require(condition, message)` convention.

**Verify**: temporarily duplicate a JSON rule, run `./scripts/verify.sh`, and confirm it fails with a cache-policy-specific message. Revert the temporary mutation, then rerun the gate and confirm success.

### Step 3: Run the full gate

**Verify**:

```bash
./scripts/verify.sh
git diff --check
```

Both commands must exit 0.

## Test plan

- The production/development build gate remains green with one localized cache policy.
- A temporary overlapping JSON cache rule makes the verifier fail.
- Immutable `/css/*`, `/js/*`, and `/assets/*` checks remain intact.

## Done criteria

- [ ] `static/_headers` defines no separate JSON cache policy.
- [ ] The verifier rejects a reintroduced overlapping JSON rule.
- [ ] `./scripts/verify.sh` exits 0.
- [ ] `git diff --check` exits 0.
- [ ] Only in-scope files plus `plans/README.md` are modified.
- [ ] Plan status is updated.

## STOP conditions

- Cloudflare dashboard configuration is required to express the intended policy.
- Another committed consumer requires a five-minute JSON TTL.
- The `_headers` format differs from the current route-plus-indented-header syntax.

## Maintenance notes

Any future cache route added below `/pt-br/*` or `/en/*` must be checked for overlapping `Cache-Control` values. Prefer one clear localized policy over provider-specific precedence assumptions.
