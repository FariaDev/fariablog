# Plan 003: Make the local verification toolchain explicit and enforceable

> **Executor instructions**: Execute step by step, run every gate, and stop rather than guessing version policy. Update the plan status in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 84efd62..HEAD -- README.md scripts/verify.sh .github/workflows/verify.yml`
> If the required commands or CI matrix changed, STOP and report the drift.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx, docs
- **Planned at**: commit `84efd62`, 2026-07-21

## Why this matters

The README tells contributors to run `./scripts/verify.sh` but lists only Git and Hugo as prerequisites. The script also requires Python's `tomllib` and Node syntax checks, while the CI matrix implies a Hugo compatibility range that is not explained. A fresh clone can therefore fail before verification starts with no documented version contract.

## Current state

- `README.md:33-36` lists Git and Hugo Extended only.
- `scripts/verify.sh:7-16` checks command presence and Hugo Extended, but not Python/Node/Hugo versions.
- `scripts/verify.py` imports `tomllib`, requiring Python 3.11+ without a fallback dependency.
- `.github/workflows/verify.yml:14-16` tests Hugo Extended `0.148.1` and `0.164.0`.
- The repository intentionally has no package manager for runtime code; do not add one in this plan.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Versions | `hugo version; python3 --version; node --version` | Hugo Extended, Python >=3.11, Node >=18 |
| Full gate | `./scripts/verify.sh` | exit 0 |
| Diff hygiene | `git diff --check` | exit 0 |

## Scope

**In scope**:
- `README.md`
- `scripts/verify.sh`

**Out of scope**:
- Changing `.github/workflows/verify.yml` matrix
- Adding package manifests, version managers, containers, or install scripts
- Upgrading Hugo or Node
- Search behavior tests (Plan 007)

## Git workflow

- Branch: `advisor/003-toolchain-contract`
- One commit: `docs: define verification toolchain`
- Do not push unless instructed.

## Steps

### Step 1: Document minimum and recommended versions

Update the README prerequisites to distinguish development from full verification:

- Git;
- Hugo Extended: minimum supported `0.148.1`, recommended/tested `0.164.0`;
- Python `3.11+` for `tomllib` verification;
- Node.js `18+` for JavaScript syntax/tests.

State that CI runs the full gate against both supported Hugo endpoints. Do not imply every intermediate Hugo release is individually tested.

**Verify**: `grep -n "0.148.1\|0.164.0\|Python\|Node" README.md` → all four contracts appear.

### Step 2: Add actionable version guards

In `scripts/verify.sh`, after command-presence checks:

- parse `python3` major/minor and fail below 3.11 with an explicit message;
- parse Node's major version and fail below 18;
- retain the Hugo Extended check;
- check the parsed Hugo semantic version is at least 0.148.1, while allowing later versions.

Use shell/Python one-liners already available; do not add dependencies. Error messages must print the required minimum and detected version.

**Verify**: run `bash -n scripts/verify.sh` → exit 0. Run `./scripts/verify.sh` on the supported local toolchain → exit 0.

### Step 3: Reconcile wording with CI

Ensure README wording and script minima agree exactly with `.github/workflows/verify.yml`. Do not modify CI in this plan.

**Verify**: manually compare the three files, then run `git diff --check` → exit 0.

## Test plan

- Current supported versions pass.
- The version-comparison helpers are exercised with synthetic values below/equal/above the threshold if factored into functions.
- Error output names the missing/old tool.
- Hugo non-Extended still fails as before.

## Done criteria

- [ ] README lists every tool required by the gate.
- [ ] Minimum/recommended Hugo versions match CI.
- [ ] Python <3.11, Node <18, Hugo <0.148.1, and non-Extended Hugo produce clear failures.
- [ ] `./scripts/verify.sh` exits 0 locally.
- [ ] `git diff --check` exits 0.
- [ ] Only in-scope files and `plans/README.md` are modified.

## STOP conditions

- CI matrix has changed from 0.148.1/0.164.0.
- Supporting older Python would require adding a dependency.
- Cloudflare Pages is proven to require a different Hugo minimum; report the mismatch for a policy decision.

## Maintenance notes

Whenever CI changes a runtime endpoint, update README and local guards in the same change. Keep build/runtime dependencies out of this plan unless the project deliberately adopts a package manager later.
