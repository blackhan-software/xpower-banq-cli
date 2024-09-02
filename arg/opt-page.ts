import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError, type Page } from "./types.ts";

export function opt_page(
  args?: Partial<
    Pick<BanqArgs, "page" | "page_size" | "page_step" | "hist_size">
  >,
): Page {
  return {
    page: page_of(args),
    page_size: page_size_of(args),
    page_step: page_step_of(args),
    hist_size: hist_size_of(args),
  };
}
function page_of(
  args?: Partial<Pick<BanqArgs, "page">>,
): number | null {
  const arg = args?.page ?? null;
  if (arg === null) {
    return null;
  }
  if (typeof arg === "number") {
    if (Number.isInteger(arg)) {
      return arg;
    }
  }
  throw new ArgumentError(`invalid page: ${arg}`);
}
function page_size_of(
  args?: Partial<Pick<BanqArgs, "page_size">>,
): number | null {
  const arg = args?.page_size ?? null;
  if (arg === null) {
    return null;
  }
  if (typeof arg === "number" && arg > 0) {
    if (Number.isInteger(arg)) {
      return arg;
    }
  }
  throw new ArgumentError(`invalid page-size: ${arg}`);
}
function page_step_of(
  args?: Partial<Pick<BanqArgs, "page_step">>,
): number | null {
  const arg = args?.page_step ?? null;
  if (arg === null) {
    return null;
  }
  if (typeof arg === "number") {
    if (Number.isInteger(arg) && arg > 0) {
      return arg;
    }
  }
  throw new ArgumentError(`invalid page-step: ${arg}`);
}
function hist_size_of(
  args?: Partial<Pick<BanqArgs, "hist_size">>,
): number | null {
  const arg = args?.hist_size ?? null;
  if (arg === null) {
    return null;
  }
  if (typeof arg === "number" && arg > 0) {
    if (Number.isInteger(arg)) {
      return arg;
    }
  }
  throw new ArgumentError(`invalid hist-size: ${arg}`);
}
