import { type ChildProcess, spawn as defaultSpawn } from "node:child_process";
import type { AdapterRunResult } from "../types.js";

export type SpawnFn = typeof defaultSpawn;

export interface ProcessRunOptions {
  command: string;
  args: string[];
  cwd: string;
  timeoutMs: number;
  spawnFn?: SpawnFn;
}

export async function runProcess(
  options: ProcessRunOptions,
): Promise<AdapterRunResult> {
  const spawnFn = options.spawnFn ?? defaultSpawn;

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;
    let child: ChildProcess;

    try {
      child = spawnFn(options.command, options.args, {
        cwd: options.cwd,
        shell: false,
        // Own process group so a timeout can kill workers the engine spawns.
        detached: true,
        env: process.env,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      resolve({
        transcript: message,
        exitCode: 1,
        timedOut: false,
      });
      return;
    }

    const killTree = (signal: NodeJS.Signals) => {
      try {
        if (child.pid !== undefined) {
          process.kill(-child.pid, signal);
          return;
        }
      } catch {
        // group already gone or not a group leader; fall back to the child
      }
      child.kill(signal);
    };

    const killTimer = setTimeout(() => {
      timedOut = true;
      killTree("SIGTERM");
      const forceKill = setTimeout(() => {
        if (!settled) {
          killTree("SIGKILL");
          // Descendants can hold our pipes open; never wait past the grace period.
          const giveUp = setTimeout(() => finish(null), 500);
          giveUp.unref?.();
        }
      }, 1000);
      forceKill.unref?.();
    }, options.timeoutMs);

    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    const finish = (exitCode: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(killTimer);
      const transcript = [stdout, stderr].filter(Boolean).join("\n");
      resolve({
        transcript,
        exitCode,
        timedOut,
        // The adapter invocation itself is not an engine-run command (it contains
        // the prompt), so it is never reported as one.
        commandLines: [],
      });
    };

    child.on("error", (err) => {
      stdout += `${stdout ? "\n" : ""}${err.message}`;
      finish(1);
    });

    child.on("close", (code) => {
      finish(code);
    });
  });
}
