import { assert } from "@std/assert";
import "@std/dotenv/load";

export const UNUS = BigInt(Deno.env.get("UNUS_ADDRESS") ?? 0);
assert(UNUS, "missing UNUS_ADDRESS");
export const DUOS = BigInt(Deno.env.get("DUOS_ADDRESS") ?? 0);
assert(DUOS, "missing DUOS_ADDRESS");

export default ({
  UNUS,
  DUOS,
});
