# Plan 002: Enforce one-to-one translation parity for every post

> **Executor instructions**: Follow every step and verification gate. Do not improvise past a STOP condition. Update this plan's status in `plans/README.md` when complete.
>
> **Drift check (run first)**: `git diff --stat 84efd62..HEAD -- content/en/posts content/pt-br/posts scripts/verify.py`
> If post front matter or verifier structure changed, compare it with this plan before proceeding. A changed front-matter format is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests, correctness
- **Planned at**: commit `84efd62`, 2026-07-21

## Why this matters

Bilingual publishing is a stated product feature, and the header/SEO templates rely on Hugo's translation relationships. Today all five posts are paired, but the verification gate never checks this invariant. A missing, blank, or duplicated `translationKey` would silently remove language links and hreflang alternates while both language builds still pass.

## Current state

- Each post uses TOML front matter delimited by `+++`.
- Representative pair:
  - `content/en/posts/reading-any-book-is-better-than-reading-none.md:8`: `translationKey = "reading-any-book"`
  - `content/pt-br/posts/ler-qualquer-livro-e-melhor-que-nao-ler-nenhum.md:8`: the same key.
- `scripts/verify.py:247-314` validates home metadata, search indexes, RSS, and the root 404, but does not inspect source translation keys or representative article alternate links.
- Existing verifier conventions: Python standard library only, `require(condition, message)`, and deterministic failure messages prefixed by `verify:`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Full gate | `./scripts/verify.sh` | exit 0 |
| Diff hygiene | `git diff --check` | exit 0 |

## Scope

**In scope**:
- `scripts/verify.py`

**Out of scope**:
- Editing article prose or front matter
- Requiring translations for books/contact/archive/search pages
- Comparing translated titles, descriptions, tags, or dates
- Machine translation or content generation

## Git workflow

- Branch: `advisor/002-translation-parity`
- One commit: `test: enforce post translation parity`
- Do not push unless instructed.

## Steps

### Step 1: Parse post front matter deterministically

Add a helper in `scripts/verify.py` that reads only the leading TOML block between the first pair of `+++` delimiters and parses it with the already-imported `tomllib`. Do not parse Markdown bodies. Return the source path and parsed mapping. Fail clearly on missing delimiters or invalid TOML.

**Verify**: `python3 -m py_compile scripts/verify.py` → exit 0.

### Step 2: Assert translation-key invariants

For `content/en/posts/*.md` and `content/pt-br/posts/*.md`, assert:

- every post has a non-empty string `translationKey`;
- each key occurs exactly once per language;
- the set of English keys equals the set of Portuguese keys;
- failure messages identify the missing/duplicated key and language, not article contents.

Do not require filenames or titles to match; `translationKey` is the canonical pairing contract.

**Verify**: temporarily remove one `translationKey`, run `./scripts/verify.sh`, and confirm a translation-specific failure. Restore the source file exactly.

### Step 3: Assert generated alternate links

For one generated article per translation key, map built pages by finding a source key's generated URL in that language's `index.json`. Assert each article's parsed `<link rel="alternate">` collection contains the counterpart language. Reuse `prod_docs`; do not make network requests.

If reliable source-key-to-generated-URL mapping cannot be derived without duplicating Hugo slug rules, STOP and report. The source-level parity assertions are still required, but do not guess URL construction.

**Verify**: `./scripts/verify.sh` → exit 0 with the existing verified-page summary.

## Test plan

- Baseline: five unique keys in each locale pass.
- Missing key: fails.
- Duplicate key in one locale: fails.
- Key present only in English: fails.
- Key present only in Portuguese: fails.
- Generated alternate links point to the paired locale if Step 3 is feasible without slug duplication.

## Done criteria

- [ ] All post translation keys are validated one-to-one.
- [ ] At least the missing and duplicate regression cases were manually proven to fail.
- [ ] No content files remain modified.
- [ ] `./scripts/verify.sh` exits 0.
- [ ] `git diff --check` exits 0.
- [ ] Only `scripts/verify.py` and `plans/README.md` are modified.

## STOP conditions

- Post front matter is no longer TOML.
- The executor would need to infer translations from titles or filenames.
- Generated alternate-link testing requires reimplementing Hugo URL logic.

## Maintenance notes

New posts must land as a bilingual pair or intentionally change this policy first. If untranslated drafts become a product requirement, update the invariant explicitly rather than weakening failures ad hoc.
