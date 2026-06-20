import type { CallExceptionError } from "ethers";

/**
 * @returns human-readable revert message, preferring a decoded custom error
 */
export function revertReason(e: CallExceptionError): string {
  if (e.revert !== null && e.revert.name !== "Error") {
    const { name, args } = e.revert;
    return `${name}(${args.map(String).join(", ")})`;
  }
  return e.reason ?? e.shortMessage;
}
