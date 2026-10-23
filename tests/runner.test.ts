import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { mockAdapter } from "../src/adapters/mock.js";
import { loadCases } from "../src/loader.js";
import { assertSafeRelativePath, runCase, runCases } from "../src/runner.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES_DIR = path.join(ROOT, "cases");

describe("runner", () => {
  it("rejects absolute fixture paths", () => {
    expect(() => assertSafeRelativePath("/etc/passwd")).toThrow(/absolute/);
  });

  it("rejects path traversal with ..", () => {
    expect(() => assertSafeRelativePath("../secret")).toThrow(/\.\./);
    expect(() => assertSafeRelativePath("foo/../../secret")).toThrow(/\.\./);
  });

  it("mock run of starter cases passes", async () => {
    const cases = await loadCases(CASES_DIR);
    const results = await runCases(cases, mockAdapter, 5_000);
    expect(results.length).toBeGreaterThanOrEqual(8);
    for (const r of results) {
      expect(r.passed, `${r.caseId}: ${r.reasons.join("; ")}`).toBe(true);
    }
  });

  it("runs a single mock case", async () => {
    const cases = await loadCases(CASES_DIR);
    const target = cases.find((c) => c.id === "read-agents-md-first");
    expect(target).toBeDefined();
    if (!target) {
      throw new Error("missing case read-agents-md-first");
    }
    const result = await runCase(target, mockAdapter, 5_000);
    expect(result.passed).toBe(true);
    expect(result.engine).toBe("mock");
  });
  it("fails a case whose engine timed out even if the text matches", async () => {
    const adapter = {
      ...mockAdapter,
      name: "flaky",
      run: async () => ({
        transcript: "I will not use --yolo.",
        exitCode: null,
        timedOut: true,
      }),
    };
    const result = await runCase(
      {
        id: "t",
        description: "d",
        prompt: "p",
        expectations: { must_contain: ["will not"] },
      },
      adapter,
      100,
    );
    expect(result.passed).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/timed out/);
  });
});
