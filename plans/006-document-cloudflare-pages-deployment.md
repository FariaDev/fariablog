# Plan 006: Record the complete Cloudflare Pages deployment contract

> **Executor instructions**: This plan documents actual infrastructure; do not invent dashboard values. Verify them or STOP. Follow all gates and update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 84efd62..HEAD -- docs/DEPLOYMENT.md README.md static/_headers .github/workflows/verify.yml`
> If deployment ownership or hosting target changed, STOP and report.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: Plan 001 (document the final cache policy, not the conflicting one)
- **Category**: docs, dx
- **Planned at**: commit `84efd62`, 2026-07-21

## Why this matters

The repository says the site is deployed but does not record the Cloudflare Pages build command, branch, output directory, Hugo version, cache-purge procedure, or distinction between GitHub verification and deployment. The project recently required manual cache diagnosis, showing that this operational knowledge is not reconstructible from source alone. A maintainer should be able to recreate the Pages project without relying on dashboard memory.

## Current state

- `docs/DEPLOYMENT.md:5-26` covers the local gate, manual page checks, and generic Git rollback only.
- `.github/workflows/verify.yml` verifies pushes/PRs; it does not deploy.
- `static/_headers` is copied by Hugo into the Pages output and carries cache policy.
- Known intended contract to verify against the dashboard:
  - repository `FariaDev/fariablog`;
  - production branch `main`;
  - build command `hugo --gc --minify --environment production`;
  - output directory `public`;
  - Hugo Extended version `0.164.0` (or the exact dashboard value if different);
  - custom domain `fariablog.com`.
- The architecture forbids analytics and third-party scripts; Pages Web Analytics/Zaraz must not be silently enabled.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Local gate | `./scripts/verify.sh` | exit 0 |
| Live smoke | `curl -sSIL https://fariablog.com/pt-br/` | HTTP 200 and intended cache header |
| Tracker smoke | `curl -sSL https://fariablog.com/pt-br/` | no analytics script markers |
| Hygiene | `git diff --check` | exit 0 |

## Scope

**In scope**:
- `docs/DEPLOYMENT.md`
- `README.md` only if it needs a short link to deployment docs

**Out of scope**:
- Changing Cloudflare dashboard settings
- Adding Wrangler or a deployment workflow
- Changing `_headers` (Plans 001 and 008)
- DNS changes, cache purge execution, or GitHub Pages cleanup

## Git workflow

- Branch: `advisor/006-cloudflare-deployment-docs`
- One commit: `docs: record Cloudflare Pages deployment`
- Do not push unless instructed.

## Steps

### Step 1: Verify private dashboard facts

Using authorized Cloudflare access, record the exact project name, Git repository, production branch, build command, output directory, environment variables, and custom domain. Confirm whether Web Analytics, Zaraz, and Speed Brain are enabled.

Do not write account IDs, API tokens, or secrets. If dashboard access is unavailable or any value differs materially from the intended contract above, STOP and report before editing docs.

**Verify**: compare a fresh Pages deployment's commit SHA with `git rev-parse HEAD`; they must match.

### Step 2: Expand deployment documentation

Add sections to `docs/DEPLOYMENT.md` for:

- Cloudflare Pages project settings;
- Git integration and production branch;
- exact build command/output directory/Hugo version;
- statement that GitHub Actions verifies but Cloudflare Pages deploys;
- required/no-longer-required environment variables (never values for secrets);
- `_headers` ownership and cache behavior;
- post-deploy smoke checks for home, search, article, trackers, and cache;
- cache purge procedure and when it is appropriate;
- rollback through a prior Git commit/redeploy;
- explicit note about optional Speed Brain if it remains enabled.

Keep instructions concise and command-oriented.

**Verify**: `rg -n "Cloudflare Pages|main|hugo|public|cache|analytics|rollback" docs/DEPLOYMENT.md` → every operational topic appears.

### Step 3: Link from README if needed

If the README has no deployment pointer, add one sentence linking `docs/DEPLOYMENT.md`. Do not duplicate the full procedure.

**Verify**: Markdown links resolve to committed files.

### Step 4: Run checks

**Verify**: `./scripts/verify.sh && git diff --check` → exit 0.

## Test plan

- A maintainer with a blank Pages project can identify every required field.
- Live smoke commands return HTTP 200 and no forbidden tracker markers.
- No credential/account identifier is committed.

## Done criteria

- [ ] Actual dashboard settings were verified, not guessed.
- [ ] Deployment and verification responsibilities are distinguished.
- [ ] Cache purge and rollback are documented.
- [ ] Privacy-related Cloudflare toggles are documented.
- [ ] Full gate passes.
- [ ] Only scoped docs and `plans/README.md` changed.

## STOP conditions

- No authorized Cloudflare dashboard/API access.
- Live deployment SHA cannot be tied to the documented source commit.
- A secret value appears necessary in documentation.
- Hosting is no longer Cloudflare Pages.

## Maintenance notes

Update this document whenever build settings, Hugo version, branch, domain, or Cloudflare feature toggles change. Dashboard-only configuration is otherwise invisible in code review.
