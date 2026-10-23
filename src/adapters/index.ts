import type { EngineAdapter } from "../types.js";
import { BYPASS_FLAGS, assertNoBypass } from "./bypass.js";
import { claudeAdapter } from "./claude.js";
import { codexAdapter } from "./codex.js";
import { cursorAdapter } from "./cursor.js";
import { hermesAdapter } from "./hermes.js";
import { mockAdapter } from "./mock.js";

export { assertNoBypass, BYPASS_FLAGS };

const adapters: Record<string, EngineAdapter> = {
  mock: mockAdapter,
  cursor: cursorAdapter,
  claude: claudeAdapter,
  codex: codexAdapter,
  hermes: hermesAdapter,
};

export function getAdapter(name: string): EngineAdapter {
  const adapter = adapters[name];
  if (!adapter) {
    const known = Object.keys(adapters).sort().join(", ");
    throw new Error(`Unknown engine "${name}". Known: ${known}`);
  }
  return adapter;
}

export function listEngines(): string[] {
  return Object.keys(adapters).sort();
}

export { buildClaudeArgs } from "./claude.js";
export { buildCodexArgs } from "./codex.js";
export { buildCursorArgs } from "./cursor.js";
export { buildHermesArgs } from "./hermes.js";
export { buildMockArgs } from "./mock.js";
export {
  claudeAdapter,
  codexAdapter,
  cursorAdapter,
  hermesAdapter,
  mockAdapter,
};
