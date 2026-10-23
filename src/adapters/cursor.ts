import type {
  AdapterRunContext,
  AdapterRunResult,
  BuildArgsResult,
  EngineAdapter,
} from "../types.js";
import { assertNoBypass } from "./bypass.js";
import { runProcess } from "./process.js";

export function buildCursorArgs(prompt: string): BuildArgsResult {
  // --trust only skips the workspace-trust prompt for the throwaway temp dir;
  // --mode ask keeps the run read-only.
  const args = [
    "-p",
    "--trust",
    "--mode",
    "ask",
    "--output-format",
    "text",
    prompt,
  ];
  assertNoBypass(args);
  return { command: "agent", args };
}

export const cursorAdapter: EngineAdapter = {
  name: "cursor",
  buildArgs: buildCursorArgs,
  async run(ctx: AdapterRunContext): Promise<AdapterRunResult> {
    const { command, args } = buildCursorArgs(ctx.prompt);
    return runProcess({
      command,
      args,
      cwd: ctx.cwd,
      timeoutMs: ctx.timeoutMs,
    });
  },
};
