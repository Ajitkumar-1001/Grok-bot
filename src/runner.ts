import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { scoreCase } from "./scorers.js";
import type { CaseResult, EngineAdapter, EvalCase } from "./types.js";

export function assertSafeRelativePath(relativePath: string): void {
  if (path.isAbsolute(relativePath)) {
    throw new Error(
      `Fixture path must be relative (got absolute): ${relativePath}`,
    );
  }
  const normalized = path.normalize(relativePath);
  if (
    normalized === ".." ||
    normalized.startsWith(`..${path.sep}`) ||
    normalized.includes(`${path.sep}..${path.sep}`) ||
    normalized.endsWith(`${path.sep}..`)
  ) {
    throw new Error(`Fixture path rejects "..": ${relativePath}`);
  }
  if (relativePath.split(/[/\\]/).includes("..")) {
    throw new Error(`Fixture path rejects "..": ${relativePath}`);
  }
}

async function writeFixtures(
  cwd: string,
  files: Record<string, string>,
): Promise<void> {
  for (const [rel, content] of Object.entries(files)) {
    assertSafeRelativePath(rel);
    const dest = path.join(cwd, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, content, "utf8");
  }
}

export async function runCase(
  evalCase: EvalCase,
  adapter: EngineAdapter,
  timeoutMs: number,
): Promise<CaseResult> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "grok-bot-eval-"));
  const started = Date.now();

  try {
    if (evalCase.fixture?.files) {
      await writeFixtures(tempRoot, evalCase.fixture.files);
    }

    const runResult = await adapter.run({
      prompt: evalCase.prompt,
      cwd: tempRoot,
      timeoutMs,
      caseId: evalCase.id,
    });

    const scored = scoreCase({
      transcript: runResult.transcript,
      commandLines: runResult.commandLines,
      expectations: evalCase.expectations,
    });

    return {
      caseId: evalCase.id,
      engine: adapter.name,
      passed: scored.passed,
      reasons: scored.reasons,
      durationMs: Date.now() - started,
      exitCode: runResult.exitCode,
      timedOut: runResult.timedOut,
      transcript: runResult.transcript,
    };
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

export async function runCases(
  cases: EvalCase[],
  adapter: EngineAdapter,
  timeoutMs: number,
): Promise<CaseResult[]> {
  const results: CaseResult[] = [];
  for (const evalCase of cases) {
    results.push(await runCase(evalCase, adapter, timeoutMs));
  }
  return results;
}
