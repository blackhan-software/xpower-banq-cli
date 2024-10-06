import { Decimal } from "decimal.js";
import type { ethers } from "ethers";
import { UNIT_DEC } from "../../../constant/index.ts";

export type TokenInfo = {
  supply: bigint;
};
export function format(
  info: TokenInfo,
  digits: number,
  style?: "exponential" | "fixed" | "decimal",
) {
  const { supply } = retype(info);
  switch (style) {
    case "decimal": {
      const fmt = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: digits,
        useGrouping: true,
        style: "decimal",
      });
      return { supply: fmt.format(Number(supply)) };
    }
    case "fixed":
      return { supply: supply.toFixed(digits) };
    default:
      return { supply: supply.toExponential(digits) };
  }
}
export function retype(
  info: TokenInfo,
) {
  return {
    supply: new Decimal(info.supply.toString()).div(UNIT_DEC),
  };
}
export async function of(
  token: ethers.Contract,
): Promise<TokenInfo> {
  return { supply: await token.totalSupply() as bigint };
}
export default {
  format,
  retype,
  of,
};
