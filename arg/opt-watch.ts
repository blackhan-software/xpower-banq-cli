import type { BanqArgs } from "../cli/banq/banq.ts";

export function opt_watch(
  args?: Partial<Pick<BanqArgs, "watch">>,
): [
  flag: boolean,
  range?: [dlt: number, idx?: number],
] {
  const arg = args?.watch;
  if (typeof arg === "string") {
    const m0 = arg.match(/^$/);
    if (m0) {
      return [true];
    }
    const m1 = arg.match(/^(\d+)$/);
    if (m1) {
      const dlt = Number(m1[1]);
      return [true, [dlt]];
    }
    const m2 = arg.match(/^(\d+)\@(\d+)$/);
    if (m2) {
      const dlt = Number(m2[1]);
      const idx = Number(m2[2]);
      return [true, [dlt, idx]];
    }
  }
  return [false];
}
