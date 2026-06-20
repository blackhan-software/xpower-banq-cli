import { isCallException } from "ethers";
import type { Argument } from "../../../arg/types.ts";
import { BROADCAST, type CommandResult } from "../../types.ts";

export async function call(
  fn: () => Promise<unknown>,
  args: Argument[],
): Promise<CommandResult> {
  try {
    await fn();
  } catch (e) {
    if (isCallException(e)) {
      return [args, [e.reason]];
    }
    throw e;
  }
  return [args, [BROADCAST]];
}
