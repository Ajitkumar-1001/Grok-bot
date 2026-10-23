import type { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { type SpawnFn, runProcess } from "../src/adapters/process.js";

class FakeChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  killed = false;
  killSignals: string[] = [];

  kill(signal?: string): boolean {
    this.killed = true;
    this.killSignals.push(signal ?? "SIGTERM");
    if (signal === "SIGTERM" || signal === undefined) {
      // stay alive until SIGKILL in the test harness
      setTimeout(() => {
        if (this.killSignals.includes("SIGKILL")) {
          this.emit("close", null);
        }
      }, 10);
    }
    if (signal === "SIGKILL") {
      this.emit("close", null);
    }
    return true;
  }
}

describe("process", () => {
  it("times out and kills with SIGTERM then SIGKILL", async () => {
    let child: FakeChild | undefined;
    const spawnFn: SpawnFn = (() => {
      child = new FakeChild();
      return child as unknown as ChildProcess;
    }) as SpawnFn;

    const resultPromise = runProcess({
      command: "sleep",
      args: ["100"],
      cwd: process.cwd(),
      timeoutMs: 30,
      spawnFn,
    });

    const result = await resultPromise;
    expect(result.timedOut).toBe(true);
    expect(child?.killSignals[0]).toBe("SIGTERM");
    expect(child?.killSignals).toContain("SIGKILL");
  });

  it("captures stdout and stderr", async () => {
    const spawnFn: SpawnFn = (() => {
      const child = new FakeChild();
      queueMicrotask(() => {
        child.stdout.emit("data", "out");
        child.stderr.emit("data", "err");
        child.emit("close", 0);
      });
      return child as unknown as ChildProcess;
    }) as SpawnFn;

    const result = await runProcess({
      command: "echo",
      args: ["hi"],
      cwd: process.cwd(),
      timeoutMs: 1000,
      spawnFn,
    });

    expect(result.timedOut).toBe(false);
    expect(result.exitCode).toBe(0);
    expect(result.transcript).toContain("out");
    expect(result.transcript).toContain("err");
  });
  it("kills descendant processes on timeout and resolves promptly", async () => {
    const started = Date.now();
    const result = await runProcess({
      command: "sh",
      args: ["-c", "sleep 30 & sleep 30"],
      cwd: process.cwd(),
      timeoutMs: 200,
    });
    expect(result.timedOut).toBe(true);
    expect(Date.now() - started).toBeLessThan(3000);
  });
});
