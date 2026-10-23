import type {
  AdapterRunContext,
  AdapterRunResult,
  BuildArgsResult,
  EngineAdapter,
} from "../types.js";
import { assertNoBypass } from "./bypass.js";
import { runProcess } from "./process.js";

const HERMES_PREFIX =
  "READ-ONLY: do not modify files or run commands that change state.\n\n";

export function buildHermesArgs(prompt: string): BuildArgsResult {
  const args = ["-z", `${HERMES_PREFIX}${prompt}`];
  assertNoBypass(args);
  return { command: "hermes", args };
}

export const hermesAdapter: EngineAdapter = {
  name: "hermes",
  buildArgs: buildHermesArgs,
  async run(ctx: AdapterRunContext): Promise<AdapterRunResult> {
    const { command, args } = buildHermesArgs(ctx.prompt);
    return runProcess({
      command,
      args,
      cwd: ctx.cwd,
      timeoutMs: ctx.timeoutMs,
    });
  },
};
