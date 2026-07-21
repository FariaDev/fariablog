# Plan 009: Pin CI actions to reviewed immutable commits

> **Executor instructions**: Resolve and review official action SHAs; never guess a SHA. Follow all gates and update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 84efd62..HEAD -- .github/workflows/verify.yml package.json package-lock.json`
> If workflow steps or test setup changed, especially from Plan 007, reconcile before editing. Unexplained workflow drift is a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: Plan 007 (if Plan 007 modifies the workflow, pin after it lands)
- **Category**: security, dx
- **Planned at**: commit `84efd62`, 2026-07-21

## Why this matters

The verification workflow executes third-party GitHub Actions using mutable major-version tags. If a tag is moved or the upstream project is compromised, CI behavior can change without a repository diff. Pinning reviewed commits makes workflow execution reproducible while comments preserve the human-readable release line.

## Current state

`.github/workflows/verify.yml` currently contains:

```yaml
- uses: actions/checkout@v4
- uses: peaceiris/actions-hugo@v3
```

The job has only `contents: read`, runs on pushes and pull requests, and then executes `./scripts/verify.sh`. The repository uses conventional commit messages.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Resolve tag | `git ls-remote <official-repo-url> 'refs/tags/<tag>*'` | official tag and dereferenced commit shown |
| YAML sanity | `python3 -c 'import pathlib; print(pathlib.Path(".github/workflows/verify.yml").read_text())'` | workflow readable |
| Gate | `./scripts/verify.sh` | exit 0 |
| Hygiene | `git diff --check` | exit 0 |

## Scope

**In scope**:
- `.github/workflows/verify.yml`

**Out of scope**:
- Changing workflow triggers, permissions, matrix, runner, or job structure
- Adding actions or Dependabot
- Cloudflare deployment
- `persist-credentials` policy

## Git workflow

- Branch: `advisor/009-pin-actions`
- One commit: `ci: pin verification actions`
- Do not push unless instructed.

## Steps

### Step 1: Resolve official commits

From the official repositories only:

- resolve the current reviewed `actions/checkout` v4 release commit;
- resolve the current reviewed `peaceiris/actions-hugo` v3 release commit.

Use `git ls-remote` and dereference annotated tags where necessary. Cross-check the release page/repository ownership. Record no credentials or private account data.

**Verify**: each chosen revision is exactly 40 lowercase hexadecimal characters and belongs to the intended upstream history.

### Step 2: Replace mutable tags

Change each `uses:` value to the immutable commit SHA and append a comment containing the reviewed semantic release, for example:

```yaml
uses: owner/action@<40-char-sha> # vX.Y.Z
```

Do not pin to a branch, abbreviated SHA, or unverified commit.

**Verify**:

```bash
rg -n 'uses:.*@(v[0-9]+|main|master)$' .github/workflows/verify.yml
```

Expected: no matches.

### Step 3: Validate locally and in CI

Run the local gate. Then, after review/push by the operator, confirm the GitHub Actions run starts and passes with the pinned actions.

**Verify**: `./scripts/verify.sh && git diff --check` → exit 0; remote workflow green after push.

## Test plan

No application test changes. Validation is workflow syntax plus a successful real GitHub Actions run, because local execution cannot emulate `uses:` resolution.

## Done criteria

- [ ] Every `uses:` reference is a full immutable SHA.
- [ ] Each pin has a human-readable release comment.
- [ ] Upstream ownership/history was checked.
- [ ] Local gate passes.
- [ ] Remote CI passes after push.
- [ ] Only workflow and plan status changed.

## STOP conditions

- An upstream tag resolves ambiguously or cannot be verified.
- The action repository is archived/compromised.
- Plan 007 has unmerged workflow changes.
- A pin requires changing workflow behavior to pass.

## Maintenance notes

Pinned actions require deliberate updates. Review release notes and replace both SHA and version comment together; never update only the comment.
