import { describe, expect, it } from "vitest";
import {
  BYPASS_FLAGS,
  assertNoBypass,
  buildClaudeArgs,
  buildCodexArgs,
  buildCursorArgs,
  buildHermesArgs,
  buildMockArgs,
} from "../src/adapters/index.js";

describe("adapters", () => {
  it("builds exact cursor args", () => {
    expect(buildCursorArgs("hello")).toEqual({
      command: "agent",
      args: ["-p", "--mode", "ask", "--output-format", "text", "hello"],
    });
  });

  it("builds exact claude args", () => {
    expect(buildClaudeArgs("hello")).toEqual({
      command: "claude",
      args: ["-p", "--permission-mode", "plan", "hello"],
    });
  });

  it("builds exact codex args", () => {
    expect(buildCodexArgs("hello")).toEqual({
      command: "codex",
      args: [
        "exec",
        "--sandbox",
        "read-only",
        "--skip-git-repo-check",
        "hello",
      ],
    });
  });

  it("builds exact hermes args with read-only prefix", () => {
    expect(buildHermesArgs("hello")).toEqual({
      command: "hermes",
      args: [
        "-z",
        "READ-ONLY: do not modify files or run commands that change state.\n\nhello",
      ],
    });
  });

  it("builds mock args without spawning", () => {
    expect(buildMockArgs("hello")).toEqual({
      command: "mock",
      args: ["hello"],
    });
  });

  it("ensures no adapter args contain bypass flags", () => {
    const builders = [
      buildCursorArgs,
      buildClaudeArgs,
      buildCodexArgs,
      buildHermesArgs,
      buildMockArgs,
    ];
    for (const build of builders) {
      const { args } = build("prompt");
      for (const flag of BYPASS_FLAGS) {
        expect(args).not.toContain(flag);
      }
    }
  });

  it("assertNoBypass throws on listed flags", () => {
    for (const flag of BYPASS_FLAGS) {
      expect(() => assertNoBypass([flag])).toThrow(/Bypass flag/);
    }
    expect(() => assertNoBypass(["-p", "ok"])).not.toThrow();
  });
});
