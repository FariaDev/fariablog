# Plan 007: Add behavioral tests for client-side search

> **Executor instructions**: This plan intentionally adds test-only Node tooling while keeping production runtime dependency-free. Follow the architecture and gates exactly. Stop rather than substituting a framework. Update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 84efd62..HEAD -- assets/js/search.js layouts/_default/search.html layouts/partials/search-result-template.html layouts/partials/head.html scripts/verify.sh .github/workflows/verify.yml README.md`
> Any behavioral or loading change in these files is a STOP condition until the plan is re-vetted.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: Plan 003 (Node version contract)
- **Category**: tests, dx
- **Planned at**: commit `84efd62`, 2026-07-21

## Why this matters

Search is a primary navigation feature, but the gate only checks generated asset names and JavaScript syntax. Fetch failures, stale-query races, URL query initialization, clear behavior, result rendering, and Fuse integration can all break while CI remains green. Behavioral coverage should stay small and test-only so the production site retains its no-framework, route-scoped JavaScript design.

## Current state

- `assets/js/search.js:31-40` caches the index fetch.
- `assets/js/search.js:62-89` renders Fuse results.
- `assets/js/search.js:91-110` handles empty, success, stale-query, and error states.
- `assets/js/search.js:112-123` handles input, clear, and `?q=` initialization.
- `scripts/verify.sh:29` runs `node --check` only.
- No `package.json`, lockfile, or browser-test dependency exists.
- Production search scripts are minified/fingerprinted by Hugo in `layouts/partials/head.html:76-82`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install test deps | `npm ci` | exit 0 |
| JS tests | `npm test` | all search tests pass |
| Full gate | `./scripts/verify.sh` | exit 0 |
| Hygiene | `git diff --check` | exit 0 |

## Scope

**In scope**:
- `package.json` (create)
- `package-lock.json` (create)
- `tests/search.test.mjs` (create)
- `assets/js/search.js`
- `scripts/verify.sh`
- `.github/workflows/verify.yml`
- `README.md`

**Out of scope**:
- Changing search ranking weights or indexed fields
- Replacing Fuse
- End-to-end browser infrastructure or Playwright
- Article/theme tests
- Production dependencies or a client framework

## Git workflow

- Branch: `advisor/007-search-tests`
- Commit logical units with conventional messages, ending with `test: cover search behavior`.
- Do not push unless instructed.

## Steps

### Step 1: Add a minimal test-only DOM dependency

Create `package.json` with:

- `private: true`;
- no runtime `dependencies`;
- a `test` script using Node's built-in runner: `node --test tests/*.test.mjs`;
- one pinned `devDependency` on a lightweight DOM implementation such as `happy-dom` compatible with the Node minimum from Plan 003.

Generate and commit `package-lock.json` with `npm install --package-lock-only` or `npm install`. Do not add bundlers, linters, or a production package script.

**Verify**: `npm ci && npm test` → installation succeeds and the initial test harness runs.

### Step 2: Make search initialization testable without changing production behavior

Refactor `assets/js/search.js` so its initializer is a named exported function receiving dependencies with defaults:

- root/document;
- `fetch`;
- Fuse constructor;
- current URL/search params.

The production module must still initialize itself exactly once when loaded by the search page. Keep the existing DOM data-attribute contract and route-scoped load.

Because the file becomes an ES module, update `layouts/partials/head.html` to use Hugo `js.Build` so imports/exports are bundled into one fingerprinted search artifact, then emit it with `type="module"`. Preserve Fuse loading order; if a bundled module cannot reliably see the classic Fuse global, STOP and report instead of changing search libraries.

**Verify**: `./scripts/verify.sh` → generated search page still contains Fuse and one scoped search bundle; home/article remain unchanged.

### Step 3: Add behavioral tests

In `tests/search.test.mjs`, construct the minimum real DOM matching `layouts/_default/search.html` and `search-result-template.html`. Mock Fuse deterministically; tests are for controller/DOM behavior, not Fuse's ranking algorithm. Cover:

1. empty input: full entries visible, results hidden, clear hidden, empty status;
2. successful query: one fetch, matching result link/title/summary/date rendered, entries hidden;
3. no matches: localized no-results status;
4. fetch rejection: error status and fallback entries remain visible;
5. `?q=` initialization triggers search;
6. clear resets input/results and focuses input;
7. race: query changes before the first fetch resolves; stale query does not render;
8. repeated queries reuse the index fetch and Fuse engine.

Use fresh DOM/module/controller state per test. Do not make real network requests.

**Verify**: `npm test` → at least eight named tests pass.

### Step 4: Integrate with local and CI gates

- Add `npm test` to `scripts/verify.sh` after syntax checks.
- In `.github/workflows/verify.yml`, run `npm ci` before the gate and enable npm caching through the checkout/setup mechanism only if it does not add another third-party action. The gate must not run `npm install` implicitly.
- Update README prerequisites/setup: Node/npm are test-only; run `npm ci` once before `./scripts/verify.sh`.

**Verify**: clean `node_modules`, run `npm ci && ./scripts/verify.sh` → all builds and tests pass.

## Test plan

The eight cases in Step 3 are mandatory. Use generated/template data attributes as the public DOM contract. Tests must not assert hashed filenames or incidental copy beyond labels supplied by fixture data.

## Done criteria

- [ ] Production has no new runtime dependency or extra search request.
- [ ] `package-lock.json` is committed and reproducible.
- [ ] At least eight search behavior tests pass.
- [ ] CI installs test dependencies and runs them in both Hugo matrix jobs.
- [ ] Home still loads no external JS; article still excludes Fuse.
- [ ] `./scripts/verify.sh` and `git diff --check` pass.
- [ ] Only scoped files plus `plans/README.md` changed.

## STOP conditions

- Hugo 0.148.1 cannot bundle the module with `js.Build`.
- Fuse execution order becomes nondeterministic.
- The proposed DOM dependency requires Node newer than the documented minimum.
- Testing requires changing ranking/product behavior.

## Maintenance notes

Keep DOM tests centered on user-visible state transitions. Do not grow this into a general frontend toolchain unless another interactive feature independently justifies it.
