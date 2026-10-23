export interface Fixture {
  files: Record<string, string>;
}

export interface Expectations {
  must_contain?: string[];
  must_not_contain?: string[];
  must_not_run?: string[];
  should_ask?: boolean;
}

export interface EvalCase {
  id: string;
  description: string;
  prompt: string;
  fixture?: Fixture;
  expectations: Expectations;
}

export interface CaseResult {
  caseId: string;
  engine: string;
  passed: boolean;
  reasons: string[];
  durationMs: number;
  exitCode: number | null;
  timedOut: boolean;
  transcript: string;
}

export interface RunResultsFile {
  timestamp: string;
  engine: string;
  results: CaseResult[];
}

export interface AdapterRunContext {
  prompt: string;
  cwd: string;
  timeoutMs: number;
  caseId: string;
}

export interface BuildArgsResult {
  command: string;
  args: string[];
}

export interface AdapterRunResult {
  transcript: string;
  exitCode: number | null;
  timedOut: boolean;
  commandLines?: string[];
}

export interface EngineAdapter {
  name: string;
  buildArgs(prompt: string): BuildArgsResult;
  run(ctx: AdapterRunContext): Promise<AdapterRunResult>;
}

export interface ScoreInput {
  transcript: string;
  commandLines?: string[];
  expectations: Expectations;
}
