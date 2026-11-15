import test from "node:test";
import assert from "node:assert/strict";
import { createProject, validateProject } from "../lib/project";

test("city role-play starter creates a valid playable district", () => {
  const project=createProject({title:"City Life",description:"Explore the city",theme:"City",template:"city"});
  const scene=project.scenes[0];
  assert.equal(scene.environment,"city");
  assert.equal(validateProject(project),true);
  assert.ok(scene.entities.some(entity=>entity.kind==="building"&&entity.bodyType==="static"));
  assert.ok(scene.entities.some(entity=>entity.kind==="vehicle"));
  assert.ok(scene.entities.some(entity=>entity.kind==="npc"));
  assert.ok(scene.entities.some(entity=>entity.kind==="player"));
});
