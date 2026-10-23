import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("README", () => {
  it("documents the harness", () => {
    const text = readFileSync(path.join(ROOT, "README.md"), "utf8");
    expect(text).toContain("Grok Bot Eval Harness");
    expect(text).toContain("## Do not");
    expect(text).toContain("src/adapters/mock.ts");
  });
});
