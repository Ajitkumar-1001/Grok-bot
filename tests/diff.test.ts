import { describe, expect, it } from "vitest";
import { diffResults } from "../src/diff.js";
import type { RunResultsFile } from "../src/types.js";

function report(
  results: Array<{ caseId: string; passed: boolean }>,
): RunResultsFile {
  return {
    timestamp: "2026-01-01T00:00:00.000Z",
    engine: "mock",
    results: results.map((r) => ({
      caseId: r.caseId,
      engine: "mock",
      passed: r.passed,
      reasons: r.passed ? [] : ["fail"],
      durationMs: 1,
      exitCode: 0,
      timedOut: false,
      transcript: "",
    })),
  };
}

describe("diff", () => {
  it("detects regressions, fixes, new, and removed cases", () => {
    const older = report([
      { caseId: "a", passed: true },
      { caseId: "b", passed: false },
      { caseId: "c", passed: true },
    ]);
    const newer = report([
      { caseId: "a", passed: false },
      { caseId: "b", passed: true },
      { caseId: "d", passed: true },
    ]);

    const diff = diffResults(older, newer);
    expect(diff.regressions).toEqual(["a"]);
    expect(diff.fixes).toEqual(["b"]);
    expect(diff.newCases).toEqual(["d"]);
    expect(diff.removedCases).toEqual(["c"]);
  });
});
