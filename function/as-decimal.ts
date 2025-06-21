import { Decimal } from "decimal.js";
import { UNIT_DEC } from "../constant/index.ts";

/**
 * @returns Decimal from a bigint scaled by 1e18 (WAD)
 */
export function as_decimal(value: bigint): Decimal {
  return new Decimal(value.toString()).div(UNIT_DEC);
}
