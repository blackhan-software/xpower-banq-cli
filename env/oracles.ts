import { assert } from "@std/assert";
import "@std/dotenv/load";

export const T000 = BigInt(Deno.env.get("T000_ADDRESS") ?? 0);
assert(T000, "missing T000_ADDRESS");
export const T001 = BigInt(Deno.env.get("T001_ADDRESS") ?? 0);
assert(T001, "missing T001_ADDRESS");
export const T002 = BigInt(Deno.env.get("T002_ADDRESS") ?? 0);
assert(T002, "missing T002_ADDRESS");
export const T003 = BigInt(Deno.env.get("T003_ADDRESS") ?? 0);
assert(T003, "missing T003_ADDRESS");

export default ({
  T000,
  T001,
  T002,
  T003,
});
