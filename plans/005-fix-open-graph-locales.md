# Plan 005: Emit valid language-specific Open Graph locales

> **Executor instructions**: Follow the steps and gates exactly. Update `plans/README.md` when complete. Stop if Hugo's active-language params do not behave as documented by the current templates.
>
> **Drift check (run first)**: `git diff --stat 84efd62..HEAD -- config.toml layouts/partials/head.html scripts/verify.py`
> Any change to locale params or metadata generation requires re-vetting before implementation.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug, seo, tests
- **Planned at**: commit `84efd62`, 2026-07-21

## Why this matters

The repository already defines `pt-BR` and `en-US` locale params, but Open Graph metadata emits the short Hugo language codes `pt-br` and `en`. Open Graph consumers conventionally expect locale values in `language_TERRITORY` form such as `pt_BR` and `en_US`. Using the configured locale source avoids metadata drift and gives social previews the intended regional language.

## Current state

- `layouts/partials/head.html:25`:

```go-html-template
<meta property="og:locale" content="{{ .Language.Lang }}">
```

- `config.toml:39` defines `locale = "pt-BR"`.
- `config.toml:53` defines `locale = "en-US"`.
- `scripts/verify.py:255-260` validates descriptions but not `og:locale`.
- Metadata tests use parsed generated HTML, not text snapshots; continue that pattern.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Gate | `./scripts/verify.sh` | exit 0 |
| Inspect | build via gate, or use verifier assertions | PT emits `pt_BR`; EN emits `en_US` |
| Hygiene | `git diff --check` | exit 0 |

## Scope

**In scope**:
- `layouts/partials/head.html`
- `scripts/verify.py`

**Out of scope**:
- Changing Hugo language codes or URL prefixes
- hreflang values (BCP 47 hyphenated values are correct there)
- Translating titles/descriptions
- Additional Open Graph fields

## Git workflow

- Branch: `advisor/005-open-graph-locale`
- One commit: `fix: emit regional Open Graph locales`
- Do not push unless instructed.

## Steps

### Step 1: Use the configured active locale

In `head.html`, derive Open Graph locale from the active language's `.Site.Params.locale`, replacing `-` with `_` for Open Graph only. Keep hreflang on `.Language.Lang`; do not globally transform locale syntax.

Fail visibly at build time rather than silently falling back if `locale` is missing. Both configured languages already define it.

**Verify**: `./scripts/verify.sh` → build succeeds.

### Step 2: Add generated-metadata assertions

Extend the existing language metadata loop in `scripts/verify.py` to derive expected OG locale from `config["languages"][language]["params"]["locale"]` by replacing `-` with `_`. Assert exact `og:locale` on both production homes and at least one representative article per language.

Use the existing `meta_value` helper and generated document parsers.

**Verify**: temporarily revert the template to `.Language.Lang`; the gate must fail with an `og:locale`-specific message. Restore the fix.

### Step 3: Run all checks

**Verify**: `./scripts/verify.sh && git diff --check` → exit 0.

## Test plan

- Portuguese home/article: `pt_BR`.
- English home/article: `en_US`.
- hreflang remains `pt-br` and `en`, not underscore variants.
- Existing description/canonical/JSON-LD checks still pass.

## Done criteria

- [ ] Open Graph locale comes from configured locale params.
- [ ] Verifier covers both languages and representative article pages.
- [ ] hreflang output is unchanged.
- [ ] Full gate and diff check pass.
- [ ] Only in-scope files plus `plans/README.md` are modified.

## STOP conditions

- `.Site.Params.locale` is not language-specific in the active Hugo context.
- A supported language lacks the locale param.
- The change would require altering URL language codes.

## Maintenance notes

Every future language must define `params.locale`. Keep BCP 47 hyphens for HTML language/hreflang and transform to underscores only at the Open Graph boundary.
