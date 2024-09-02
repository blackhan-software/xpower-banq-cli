import type { BanqArgs } from "../cli/banq/banq.ts";

export function opt_watch(
  args?: Partial<Pick<BanqArgs, "watch">>,
): [
  flag: boolean,
  range?: [lhs: number, rhs?: number],
] {
  const arg = args?.watch;
  if (typeof arg === "string") {
    const m0 = arg.match(/^$/);
    if (m0) {
      return [true];
    }
    const m1 = arg.match(/^(\d+)$/);
    if (m1) {
      const lhs = Number(m1[1]);
      return [true, [lhs]];
    }
    const m2 = arg.match(/^(\d+)\:(\d+)$/);
    if (m2) {
      const lhs = Number(m2[1]);
      const rhs = Number(m2[2]);
      return [true, [lhs, rhs]];
    }
  }
  return [false];
}
