# Implementation Plans

Generated on 2026-07-18 against `8292beb`.

| Plan | Title | Priority | Effort | Depends on | Status |
|---|---|---:|---:|---|---|
| 001 | Harden and verify the published FariaBlog | P1 | M | — | TODO |

## Dependency notes

Plan 001 is self-contained.

## Findings considered and rejected

- Future-dated utility pages: rejected because April 2026 is in the past at audit time.
- Missing Git hygiene: rejected for the canonical GitHub repository, which contains `.gitignore` and `.gitmodules`; only the original local snapshot lacks `.git` metadata.
- Remotion vulnerabilities and contradictory video documentation: deferred because `video/` is absent from the canonical repository and cannot be included in its commit without an explicit product decision.
