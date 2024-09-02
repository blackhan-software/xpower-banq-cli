import { assert } from "@std/assert";
import "@std/dotenv/load";

export const P000 = BigInt(Deno.env.get("P000_ADDRESS") ?? 0);
assert(P000, "missing P000_ADDRESS");
export const P001 = BigInt(Deno.env.get("P001_ADDRESS") ?? 0);
assert(P001, "missing P001_ADDRESS");
export const P002 = BigInt(Deno.env.get("P002_ADDRESS") ?? 0);
assert(P002, "missing P002_ADDRESS");
export const P003 = BigInt(Deno.env.get("P003_ADDRESS") ?? 0);
assert(P003, "missing P003_ADDRESS");

export default ({
  P000,
  P001,
  P002,
  P003,
});
