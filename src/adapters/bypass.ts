export const BYPASS_FLAGS = [
  "--force",
  "-f",
  "--yolo",
  "--dangerously-skip-permissions",
  "--dangerously-bypass-approvals-and-sandbox",
  "danger-full-access",
  "bypassPermissions",
  "--full-auto",
] as const;

export function assertNoBypass(args: string[]): void {
  for (const arg of args) {
    for (const flag of BYPASS_FLAGS) {
      if (arg === flag) {
        throw new Error(`Bypass flag not allowed in adapter args: ${flag}`);
      }
    }
  }
}
