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

## Review-fix round

Added RED tests covering target durations 16, 30, 36, and 60 seconds and asserting five-to-eight scenes, two-to-four-second scene durations, bounded total duration, and direct `AutoVideoPlan`-compatible top-level fields.

### RED

Command:

```text
node --experimental-strip-types --test tests/shortsPlanner.test.ts
```

Result: tests 1–2 passed; tests 3–4 failed as intended. The duration assertion failed because the previous planner emitted five-second scenes, and the renderer-shape assertion failed because `title` was `undefined`.

### GREEN

Implemented an eight-scene, 16–32-second safe envelope (each scene is always 2–4 seconds), and added `title`, `prompt`, `full_script`, `music_keyword`, `total_duration`, `voiceover_enabled`, and `subtitles_style`. Removed the custom `music` object.

Command:

```text
node --experimental-strip-types --test tests/shortsPlanner.test.ts
npx tsc --noEmit --pretty false
```

Result:

```text
1..4
# tests 4
# pass 4
# fail 0
```

TypeScript lint completed with no diagnostics. `npm test` remains blocked by the host-level `tsx`/`uv_os_get_passwd ... ENOMEM` issue documented above; the built-in Node runner is green.

### Self-review

The fallback now returns only renderer-compatible top-level fields plus the existing shorts metadata, keeps every scene within the renderer’s duration cap, and caps impossible 36–60 second requests at the maximum eight-scene safe envelope rather than producing invalid durations or silently dropping scenes.
