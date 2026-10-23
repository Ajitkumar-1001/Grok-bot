import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { EvalCase } from "./types.js";

const kebabId = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id must be kebab-case");

export const evalCaseSchema = z.object({
  id: kebabId,
  description: z.string().min(1),
  prompt: z.string().min(1),
  fixture: z
    .object({
      files: z.record(z.string(), z.string()),
    })
    .optional(),
  expectations: z.object({
    must_contain: z.array(z.string()).optional(),
    must_not_contain: z.array(z.string()).optional(),
    must_not_run: z.array(z.string()).optional(),
    should_ask: z.boolean().optional(),
  }),
});

export function parseCase(raw: unknown): EvalCase {
  return evalCaseSchema.parse(raw);
}

export async function loadCases(casesDir: string): Promise<EvalCase[]> {
  const entries = await readdir(casesDir);
  const yamlFiles = entries
    .filter((name) => name.endsWith(".yaml") || name.endsWith(".yml"))
    .sort();

  const cases: EvalCase[] = [];
  const seen = new Set<string>();

  for (const file of yamlFiles) {
    const fullPath = path.join(casesDir, file);
    const text = await readFile(fullPath, "utf8");
    const raw = parseYaml(text);
    const parsed = parseCase(raw);

    if (seen.has(parsed.id)) {
      throw new Error(`Duplicate case id: ${parsed.id}`);
    }
    seen.add(parsed.id);
    cases.push(parsed);
  }

  return cases;
}
