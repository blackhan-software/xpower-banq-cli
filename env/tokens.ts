import { assert } from "@std/assert";
import "@std/dotenv/load";

export const APOW = BigInt(Deno.env.get("APOW_ADDRESS") ?? 0);
assert(APOW, "missing APOW_ADDRESS");
export const XPOW = BigInt(Deno.env.get("XPOW_ADDRESS") ?? 0);
assert(XPOW, "missing XPOW_ADDRESS");
export const AVAX = BigInt(Deno.env.get("AVAX_ADDRESS") ?? 0);
assert(AVAX, "missing AVAX_ADDRESS");
export const USDC = BigInt(Deno.env.get("USDC_ADDRESS") ?? 0);
assert(USDC, "missing USDC_ADDRESS");
export const USDT = BigInt(Deno.env.get("USDT_ADDRESS") ?? 0);
assert(USDT, "missing USDT_ADDRESS");

export default ({
  APOW,
  XPOW,
  AVAX,
  USDC,
  USDT,
});
