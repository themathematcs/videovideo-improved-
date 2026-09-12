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
