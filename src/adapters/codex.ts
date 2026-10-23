import type {
  AdapterRunContext,
  AdapterRunResult,
  BuildArgsResult,
  EngineAdapter,
} from "../types.js";
import { assertNoBypass } from "./bypass.js";
import { runProcess } from "./process.js";

export function buildCodexArgs(prompt: string): BuildArgsResult {
  const options = ["exec", "--sandbox", "read-only", "--skip-git-repo-check"];
  assertNoBypass(options);
  // "--" ends option parsing so prompt text can never become a flag.
  const args = [...options, "--", prompt];
  return { command: "codex", args };
}

export const codexAdapter: EngineAdapter = {
  name: "codex",
  buildArgs: buildCodexArgs,
  async run(ctx: AdapterRunContext): Promise<AdapterRunResult> {
    const { command, args } = buildCodexArgs(ctx.prompt);
    return runProcess({
      command,
      args,
      cwd: ctx.cwd,
      timeoutMs: ctx.timeoutMs,
    });
  },
};
