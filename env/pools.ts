import { assert } from "../function/assert.ts";
import "../function/dotenv.ts";

export const P000 = BigInt(Deno.env.get("P000_ADDRESS") ?? 0);
assert(P000, "missing P000_ADDRESS");
export const P001 = BigInt(Deno.env.get("P001_ADDRESS") ?? 0);
assert(P001, "missing P001_ADDRESS");
export const P002 = BigInt(Deno.env.get("P002_ADDRESS") ?? 0);
assert(P002, "missing P002_ADDRESS");
export const P003 = BigInt(Deno.env.get("P003_ADDRESS") ?? 0);
assert(P003, "missing P003_ADDRESS");
export const P004 = BigInt(Deno.env.get("P004_ADDRESS") ?? 0);
assert(P004, "missing P004_ADDRESS");
export const P005 = BigInt(Deno.env.get("P005_ADDRESS") ?? 0);
assert(P005, "missing P005_ADDRESS");
export const P006 = BigInt(Deno.env.get("P006_ADDRESS") ?? 0);
assert(P006, "missing P006_ADDRESS");

export default ({
  P000,
  P001,
  P002,
  P003,
  P004,
  P005,
  P006,
});
