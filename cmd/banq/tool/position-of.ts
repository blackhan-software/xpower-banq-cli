import type { AddressLike, ethers } from "ethers";
import { addressOf as x } from "../../../function/address.ts";
import type { Mode } from "../../../arg/types.ts";

/**
 * @returns position address for given token and mode
 */
export function positionOf(
  pool: ethers.Contract,
  token: bigint,
  mode: Mode,
): AddressLike {
  switch (mode) {
    case "supply":
      return pool.supplyOf(x(token));
    case "borrow":
      return pool.borrowOf(x(token));
  }
}
/**
 * @returns position symbol for given token and mode
 */
export function my(
  symbol: string,
  mode: Mode,
): string {
  switch (mode) {
    case "supply":
      return `s${symbol}`;
    case "borrow":
      return `b${symbol}`;
  }
}
export default positionOf;
