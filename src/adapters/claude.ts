import type {
  AdapterRunContext,
  AdapterRunResult,
  BuildArgsResult,
  EngineAdapter,
} from "../types.js";
import { assertNoBypass } from "./bypass.js";
import { runProcess } from "./process.js";

export function buildClaudeArgs(prompt: string): BuildArgsResult {
  const options = ["-p", "--permission-mode", "plan"];
  assertNoBypass(options);
  // "--" ends option parsing so a prompt like "--permission-mode=..." stays text.
  const args = [...options, "--", prompt];
  return { command: "claude", args };
}

export const claudeAdapter: EngineAdapter = {
  name: "claude",
  buildArgs: buildClaudeArgs,
  async run(ctx: AdapterRunContext): Promise<AdapterRunResult> {
    const { command, args } = buildClaudeArgs(ctx.prompt);
    return runProcess({
      command,
      args,
      cwd: ctx.cwd,
      timeoutMs: ctx.timeoutMs,
    });
  },
};
