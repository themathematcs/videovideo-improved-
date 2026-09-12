# Task 1 report: Shorts planning domain module

## Result

Implemented `shortsPlanner.ts` with the three supported content pillars, twelve concrete topic ideas per pillar, factual-verification notes, a type guard, defensive topic-bank copies, and a deterministic retention-first fallback plan compatible with the existing scene fields (`aspect_ratio`, `scenes`, `duration`, `search_keywords`, `transition`, subtitles/narration).

Added `tests/shortsPlanner.test.ts` with the topic-bank and African-history fallback contract tests. Added the requested stable package test script:

```json
"test": "tsx --test tests/**/*.test.ts"
```

## TDD evidence

### RED: topic-bank test before production module

Command:

```text
npx tsx --test tests/shortsPlanner.test.ts
```

The test could not reach module resolution because this host's Node process failed before loading the test:

```text
SystemError [ERR_SYSTEM_ERROR]: A system error occurred: uv_os_get_passwd returned ENOMEM (not enough memory)
```

The command was retried with the same host-level failure. The test was written before `shortsPlanner.ts`.

### GREEN: module tests

The same tests were run with Node 22's built-in TypeScript stripping because the `tsx` launcher remained blocked by the host-level ENOMEM error:

```text
node --experimental-strip-types --test tests/shortsPlanner.test.ts
```

Output:

```text
TAP version 13
# Subtest: each supported pillar exposes twelve concrete, non-duplicate ideas
ok 1 - each supported pillar exposes twelve concrete, non-duplicate ideas
# Subtest: African-history fallback begins with a hook and provides rapid visual direction
ok 2 - African-history fallback begins with a hook and provides rapid visual direction
1..2
# tests 2
# pass 2
# fail 0
```

TypeScript verification also passed:

```text
npx tsc --noEmit --pretty false
```

`npm test` invokes the requested `tsx` script but is currently blocked by the same `uv_os_get_passwd ... ENOMEM` host error; the built-in Node test run above is the passing equivalent.

