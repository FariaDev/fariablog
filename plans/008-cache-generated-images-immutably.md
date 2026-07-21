# Plan 008: Cache generated responsive images immutably without freezing stable originals

> **Executor instructions**: Preserve public `/images/<original>.webp` URLs. Follow each gate and STOP if Cloudflare route matching cannot distinguish generated variants safely. Update `plans/README.md` when complete.
>
> **Drift check (run first)**: `git diff --stat 84efd62..HEAD -- config.toml layouts/partials/image-resource.html layouts/partials/responsive-image.html static/_headers scripts/verify.py`
> Changes to mounts, resource lookup, image URLs, or cache rules are a STOP condition pending re-vetting.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: Plan 001
- **Category**: performance
- **Planned at**: commit `84efd62`, 2026-07-21

## Why this matters

Hugo's resized image variants are content-addressed, but they share `/images/*` with stable editorial source URLs. The shared rule forces every generated variant to revalidate after one day. Separating generated output into its own namespace permits one-year immutable caching while stable canonical/social image URLs remain revalidated and replaceable.

## Current state

- `config.toml` mounts `static/images` twice: as static public files and as global resources at `assets/images`.
- `layouts/partials/image-resource.html` resolves a content path such as `images/capa-post.webp` through global resources.
- `layouts/partials/responsive-image.html:18-24` creates 360/480/720/1080/1500 WebP variants and emits the original resource as the final srcset candidate.
- Generated URLs currently look like `/images/<name>_hu_<hash>.webp`.
- `static/_headers:15-16` gives all `/images/*` one-day revalidation.
- Stable `/images/<name>.webp` URLs are used by content front matter and Open Graph; they must not change.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Gate | `./scripts/verify.sh` | exit 0 |
| URL audit | build to a temp dir, then `rg -o '/[^" ,]+\.webp' <article>` | stable OG URL plus separated generated variants |
| Hygiene | `git diff --check` | exit 0 |

## Scope

**In scope**:
- `config.toml`
- `layouts/partials/image-resource.html`
- `layouts/partials/responsive-image.html`
- `static/_headers`
- `scripts/verify.py`
- `docs/ARCHITECTURE.md` only for the namespace contract

**Out of scope**:
- Re-encoding source images
- Changing content front matter or canonical `/images/*` URLs
- Cloudflare Images product
- CSS/layout changes
- Image dimensions, quality, or width candidates unless required to avoid an unhashed generated-source URL

## Git workflow

- Branch: `advisor/008-immutable-responsive-images`
- Commit: `perf: cache responsive image variants immutably`
- Do not push unless instructed.

## Steps

### Step 1: Create a dedicated resource namespace

Change the global-resource mount target from `assets/images` to a clearly named generated namespace, e.g. `assets/processed-images`. Update `image-resource.html` so a content path beginning with `images/` resolves the corresponding resource under `processed-images/` while retaining page-resource lookup first.

Stable files must continue to be copied from `static/images` to public `/images/*` by the static mount.

**Verify**: build production and confirm `/images/capa-post.webp` still exists and article `og:image` still uses it.

### Step 2: Emit only content-addressed variants in responsive markup

Ensure `responsive-image.html` emits its fallback and every srcset candidate from resized Hugo outputs in the generated namespace. Do not append the unhashed mounted source resource as a candidate. For images wider than the largest configured candidate, 1500px is the maximum delivery candidate; intrinsic `width`/`height` should still describe the original aspect ratio.

If an existing editorial source is smaller than 360px and therefore cannot receive any resized candidate, STOP and report; do not publish it under immutable caching without a hash.

**Verify**: every article image `src`/`srcset` generated URL contains the generated namespace and a content hash; stable `/images/*` remains only in canonical/OG/source contexts.

### Step 3: Assign namespace-specific cache policies

Add a one-year immutable `_headers` rule for the generated namespace. Keep `/images/*` at one-day revalidation. Avoid overlapping `Cache-Control` route definitions.

**Verify**: extend `scripts/verify.py` to assert:

- generated image candidates use the generated namespace;
- generated namespace has immutable caching;
- stable `/images/*` is not immutable;
- every candidate resolves in production output.

### Step 4: Document and run the gate

Add one short architecture note distinguishing stable editorial URLs from generated responsive variants.

**Verify**: `./scripts/verify.sh && git diff --check` → exit 0.

## Test plan

- Cover image and Markdown image paths both resolve.
- Stable original exists and remains revalidated.
- 360–1500 candidates are hashed/generated and immutable.
- No article references an unhashed file in the generated namespace.
- Production and development builds under both CI Hugo versions pass.

## Done criteria

- [ ] Stable `/images/*` URLs are unchanged.
- [ ] Generated candidates occupy a separate namespace.
- [ ] Only generated candidates receive immutable caching.
- [ ] Verifier enforces namespace and cache invariants.
- [ ] Full gate and diff check pass.
- [ ] Only scoped files plus `plans/README.md` changed.

## STOP conditions

- Any canonical/OG image URL changes.
- Hugo emits an unhashed URL in the generated namespace that must be referenced.
- A source image below 360px has no safe generated fallback.
- Either supported Hugo version handles resource mounts differently.

## Maintenance notes

Never reference the generated namespace manually from content. Authors continue using stable `/images/*`; templates own processing and cache-safe delivery.
