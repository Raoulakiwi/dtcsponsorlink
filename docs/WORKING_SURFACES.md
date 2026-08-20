# Working surfaces — certified behavior

Surfaces listed here are **certified**: the user confirmed they work as expected. Agents and humans must not change **behavior** without following the breaking-change protocol in the global rule `protect-working-code`.

**Cosmetic-only** changes (styling, copy, comments) are allowed without listing this file — but must not alter logic, data flow, or contracts.

## How to add an entry

When the user certifies something:

```markdown
| Surface | Evidence | Must keep working | Files / symbols |
|---------|----------|-------------------|-----------------|
| Example flow | User confirmed 2026-08-20 | Describe observable behavior | `path/to/file.ts` → `functionName` |
```

Also retain in Hindsight with tags: `{project}`, `certified`.

**Pre-commit enforcement:** `scripts/check-certified-surfaces.js` reads file paths from the **Files / symbols** and **File** columns (backtick paths like `src/api/auth.ts`). Run `npm run check:certified` before commit. Intentional behavioral changes: `CERTIFIED_OVERRIDE=1 git commit` after completing the test plan.

## Certified surfaces

| Surface | Evidence | Must keep working | Files / symbols |
|---------|----------|-------------------|-------------------|
| *(none yet)* | | | |

## Shared kernels (change only if a named surface above cannot work without it)

| Kernel | File | Why fragile |
|--------|------|-------------|
| | | |

## Breaking change checklist

Copy into PR or chat when certified code must change:

```text
Certified surface(s): ________
Why not a new file: ________
Blast radius (SocratiCode impact): ________
What may break: ________
Full test plan: ________
Tests run + results: ________
```
