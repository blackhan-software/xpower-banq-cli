import { assert } from "@std/assert";
import "@std/dotenv/load";

export const UNUS = BigInt(Deno.env.get("UNUS_ADDRESS") ?? 0);
assert(UNUS, "missing UNUS_ADDRESS");

export default ({
  UNUS,
});
