import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { CaseResult, RunResultsFile } from "./types.js";

export interface DiffReport {
  olderFile: string;
  newerFile: string;
  regressions: string[];
  fixes: string[];
  newCases: string[];
  removedCases: string[];
}

function byCaseId(results: CaseResult[]): Map<string, CaseResult> {
  return new Map(results.map((r) => [r.caseId, r]));
}

export function diffResults(
  older: RunResultsFile,
  newer: RunResultsFile,
): Omit<DiffReport, "olderFile" | "newerFile"> {
  const a = byCaseId(older.results);
  const b = byCaseId(newer.results);

  const regressions: string[] = [];
  const fixes: string[] = [];
  const newCases: string[] = [];
  const removedCases: string[] = [];

  for (const [id, prev] of a) {
    const next = b.get(id);
    if (!next) {
      removedCases.push(id);
      continue;
    }
    if (prev.passed && !next.passed) {
      regressions.push(id);
    } else if (!prev.passed && next.passed) {
      fixes.push(id);
    }
  }

  for (const id of b.keys()) {
    if (!a.has(id)) {
      newCases.push(id);
    }
  }

  return { regressions, fixes, newCases, removedCases };
}

export async function listResultFiles(resultsDir: string): Promise<string[]> {
  const entries = await readdir(resultsDir);
  return entries
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => path.join(resultsDir, name));
}

export async function loadResultsFile(
  filePath: string,
): Promise<RunResultsFile> {
  const text = await readFile(filePath, "utf8");
  return JSON.parse(text) as RunResultsFile;
}

export async function diffLastTwo(resultsDir: string): Promise<DiffReport> {
  const files = await listResultFiles(resultsDir);
  if (files.length < 2) {
    throw new Error(
      `Need at least two results files to diff (found ${files.length})`,
    );
  }
  const olderFile = files[files.length - 2];
  const newerFile = files[files.length - 1];
  if (olderFile === undefined || newerFile === undefined) {
    throw new Error(
      `Need at least two results files to diff (found ${files.length})`,
    );
  }
  const older = await loadResultsFile(olderFile);
  const newer = await loadResultsFile(newerFile);
  return {
    olderFile,
    newerFile,
    ...diffResults(older, newer),
  };
}

export function formatDiffReport(report: DiffReport): string {
  const lines = [
    `Diff: ${path.basename(report.olderFile)} → ${path.basename(report.newerFile)}`,
    `Regressions (pass→fail): ${report.regressions.length ? report.regressions.join(", ") : "(none)"}`,
    `Fixes (fail→pass): ${report.fixes.length ? report.fixes.join(", ") : "(none)"}`,
    `New cases: ${report.newCases.length ? report.newCases.join(", ") : "(none)"}`,
    `Removed cases: ${report.removedCases.length ? report.removedCases.join(", ") : "(none)"}`,
  ];
  return lines.join("\n");
}
