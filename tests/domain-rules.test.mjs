import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

async function importTsModule(sourcePath, moduleName) {
  const source = await readFile(sourcePath, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false
    }
  }).outputText;
  const outPath = join(tmpdir(), moduleName);
  await import("node:fs/promises").then((fs) => fs.writeFile(outPath, js, "utf8"));
  return import(pathToFileURL(outPath).href + `?v=${Date.now()}`);
}

const rules = await importTsModule(
  new URL("../src/domain/rules/energyBudgetRules.ts", import.meta.url),
  "energyBudgetRules.test-runtime.mjs"
);

function task(id, energyCost) {
  return {
    id,
    title: id,
    category: "study",
    estimatedMinutes: 30,
    energyCost,
    completed: false,
    placement: "auto"
  };
}

// Unit test: energy budget calculation.
assert.equal(
  rules.calculateEnergyBudget({ fatigue: 4, availableHours: 5, mood: "normal" }),
  95,
  "normal condition should calculate a predictable energy budget"
);

assert.equal(
  rules.calculateEnergyBudget({ fatigue: 10, availableHours: 0, mood: "stressed" }),
  10,
  "energy budget should never go below the minimum"
);

// Unit test: total cost and status.
assert.equal(rules.getTotalEnergyCost([task("a", 20), task("b", 15)]), 35);
assert.equal(rules.getEnergyStatus(60, [task("a", 20), task("b", 15)]), "safe");
assert.equal(rules.getEnergyStatus(40, [task("a", 20), task("b", 15)]), "caution");
assert.equal(rules.getEnergyStatus(30, [task("a", 20), task("b", 15)]), "overload");

// Integration-style test: recommendation flow from tasks to split result.
const split = rules.splitTasksByEnergyBudget(50, [task("assignment", 25), task("project", 20), task("deep-study", 15)]);

assert.deepEqual(
  split.recommendedTasks.map((item) => item.id),
  ["assignment", "project"],
  "tasks inside the energy budget should be recommended"
);
assert.deepEqual(
  split.postponedTasks.map((item) => item.id),
  ["deep-study"],
  "tasks over the energy budget should be postponed"
);
assert.equal(split.remainingEnergy, 5);

console.log("Energy Budget domain unit/integration tests passed.");
