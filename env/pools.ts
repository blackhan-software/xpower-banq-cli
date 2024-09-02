import { assert } from "@std/assert";
import "@std/dotenv/load";

export const BNQ1 = BigInt(Deno.env.get("BNQ1_ADDRESS") ?? 0);
assert(BNQ1, "missing BNQ1_ADDRESS");
export const BNQ2 = BigInt(Deno.env.get("BNQ2_ADDRESS") ?? 0);
assert(BNQ2, "missing BNQ2_ADDRESS");

export default ({
  BNQ1,
  BNQ2,
});
