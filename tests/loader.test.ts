import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadCases, parseCase } from "../src/loader.js";

const temps: string[] = [];

afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

async function tempCasesDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "eval-cases-"));
  temps.push(dir);
  return dir;
}

describe("loader", () => {
  it("parses a valid case", () => {
    const parsed = parseCase({
      id: "valid-case",
      description: "ok",
      prompt: "do something",
      expectations: { must_contain: ["hello"] },
    });
    expect(parsed.id).toBe("valid-case");
  });

  it("rejects invalid schema", () => {
    expect(() =>
      parseCase({
        id: "Not_Kebab",
        description: "bad",
        prompt: "x",
        expectations: {},
      }),
    ).toThrow();
  });

  it("rejects duplicate ids across yaml files", async () => {
    const dir = await tempCasesDir();
    const body = `id: same-id
description: one
prompt: hi
expectations: {}
`;
    await writeFile(path.join(dir, "a.yaml"), body, "utf8");
    await writeFile(path.join(dir, "b.yaml"), body, "utf8");
    await expect(loadCases(dir)).rejects.toThrow(/Duplicate case id/);
  });

  it("loads yaml cases from a directory", async () => {
    const dir = await tempCasesDir();
    await writeFile(
      path.join(dir, "sample.yaml"),
      `id: sample-case
description: sample
prompt: hello
expectations:
  should_ask: true
`,
      "utf8",
    );
    const cases = await loadCases(dir);
    expect(cases).toHaveLength(1);
    expect(cases[0]?.id).toBe("sample-case");
  });
});
