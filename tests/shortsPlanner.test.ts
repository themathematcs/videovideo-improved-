import test from "node:test";
import assert from "node:assert/strict";
import { buildShortsFallbackPlan, getShortsTopicIdeas, isContentPillar } from "../shortsPlanner.ts";

test("each supported pillar exposes twelve concrete, non-duplicate ideas", () => {
  for (const pillar of ["tech-ai", "unusual-science", "african-history"] as const) {
    const ideas = getShortsTopicIdeas(pillar);
    assert.equal(ideas.length, 12);
    assert.equal(new Set(ideas.map((idea) => idea.title)).size, 12);
    assert.ok(ideas.every((idea) => idea.hook.length > 15));
    assert.ok(ideas.every((idea) => idea.payoff.length > 15));
  }
  assert.equal(isContentPillar("tech-ai"), true);
  assert.equal(isContentPillar("common-topics"), false);
});

test("African-history fallback begins with a hook and provides rapid visual direction", () => {
  const plan = buildShortsFallbackPlan({
    topic: "How Great Zimbabwe became a trading center",
    pillar: "african-history",
    targetDuration: 30,
  });
  assert.equal(plan.aspect_ratio, "9:16");
  assert.equal(plan.shorts_metadata.pillar, "african-history");
  assert.ok(plan.shorts_metadata.opening_hook.length > 15);
  assert.ok(plan.shorts_metadata.payoff.length > 15);
  assert.ok(plan.scenes.every((scene) => scene.duration >= 2 && scene.duration <= 4));
  assert.ok(plan.scenes.every((scene) => scene.visual_brief.includes("camera")));
  assert.ok(plan.scenes.every((scene) => scene.retention_beat.length > 8));
});

test("fallback durations equal each valid requested length", () => {
  for (const targetDuration of [20, 30, 32]) {
    const plan = buildShortsFallbackPlan({ topic: "Tardigrade survival", pillar: "unusual-science", targetDuration });
    const total = plan.scenes.reduce((sum, scene) => sum + scene.duration, 0);
    assert.ok(plan.scenes.length >= 5 && plan.scenes.length <= 8);
    assert.ok(plan.scenes.every((scene) => scene.duration >= 2 && scene.duration <= 4));
    assert.equal(total, targetDuration);
  }
});

test("fallback rejects targets outside the supported duration range", () => {
  for (const targetDuration of [16, 36, 60, 19.6, 32.4]) {
    assert.throws(
      () => buildShortsFallbackPlan({ topic: "Tardigrade survival", pillar: "unusual-science", targetDuration }),
      (error: unknown) => error instanceof RangeError && error.message.includes("Shorts fallback supports 20–32 seconds"),
    );
  }
});

test("fallback exposes the AutoVideoPlan-compatible top-level fields", () => {
  const plan = buildShortsFallbackPlan({ topic: "How Great Zimbabwe became a trading center", pillar: "african-history", targetDuration: 30 });
  assert.equal(typeof plan.title, "string");
  assert.equal(typeof plan.prompt, "string");
  assert.equal(typeof plan.full_script, "string");
  assert.equal(typeof plan.music_keyword, "string");
  assert.equal(plan.total_duration, 30);
  assert.equal(plan.voiceover_enabled, true);
  assert.equal(typeof plan.subtitles_style, "string");
  assert.equal("music" in plan, false);
});
