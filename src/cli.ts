#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { getAdapter, listEngines } from "./adapters/index.js";
import { diffLastTwo, formatDiffReport } from "./diff.js";
import { loadCases } from "./loader.js";
import { runCases } from "./runner.js";
import type { RunResultsFile } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CASES_DIR = path.join(ROOT, "cases");
const RESULTS_DIR = path.join(ROOT, "results");

function timestampFilename(date = new Date()): string {
  return `${date.toISOString().replace(/:/g, "-")}.json`;
}

function printTable(
  results: Array<{
    caseId: string;
    passed: boolean;
    reasons: string[];
    durationMs: number;
  }>,
): void {
  const header = `${"STATUS".padEnd(6)}  ${"CASE".padEnd(36)}  ${"MS".padStart(6)}  REASONS`;
  console.log(header);
  console.log("-".repeat(header.length + 20));
  for (const r of results) {
    const status = r.passed ? "PASS" : "FAIL";
    const reasons = r.passed ? "" : r.reasons.join("; ");
    console.log(
      `${status.padEnd(6)}  ${r.caseId.padEnd(36)}  ${String(r.durationMs).padStart(6)}  ${reasons}`,
    );
  }
}

async function cmdRun(options: {
  engine: string;
  case?: string;
  timeout: string;
}): Promise<void> {
  const timeoutMs = Number(options.timeout);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`Invalid --timeout: ${options.timeout}`);
  }

  const adapter = getAdapter(options.engine);
  let cases = await loadCases(CASES_DIR);
  if (options.case) {
    cases = cases.filter((c) => c.id === options.case);
    if (cases.length === 0) {
      throw new Error(`No case with id "${options.case}"`);
    }
  }

  const results = await runCases(cases, adapter, timeoutMs);
  printTable(results);

  const timestamp = new Date().toISOString();
  const payload: RunResultsFile = {
    timestamp,
    engine: adapter.name,
    results,
  };

  await mkdir(RESULTS_DIR, { recursive: true });
  const outPath = path.join(
    RESULTS_DIR,
    timestampFilename(new Date(timestamp)),
  );
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${outPath}`);

  const failed = results.some((r) => !r.passed);
  if (failed) {
    process.exitCode = 1;
  }
}

async function cmdDiff(): Promise<void> {
  const report = await diffLastTwo(RESULTS_DIR);
  console.log(formatDiffReport(report));
  if (report.regressions.length > 0) {
    process.exitCode = 1;
  }
}

const program = new Command();
program.name("evals").description("Grok Bot Eval Harness").version("0.1.0");

program
  .command("run")
  .description("Run eval cases against an engine")
  .option("-e, --engine <name>", "engine adapter", "mock")
  .option("-c, --case <id>", "run a single case id")
  .option("-t, --timeout <ms>", "per-case timeout in ms", "120000")
  .action(async (opts: { engine: string; case?: string; timeout: string }) => {
    try {
      await cmdRun(opts);
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("diff")
  .description("Compare the last two results files")
  .action(async () => {
    try {
      await cmdDiff();
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program
  .command("engines")
  .description("List available engines")
  .action(() => {
    for (const name of listEngines()) {
      console.log(name);
    }
  });

await program.parseAsync(process.argv);
