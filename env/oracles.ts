import { assert } from "../function/assert.ts";
import "../function/dotenv.ts";

export const T000 = BigInt(Deno.env.get("T000_ADDRESS") ?? 0);
assert(T000, "missing T000_ADDRESS");
export const T001 = BigInt(Deno.env.get("T001_ADDRESS") ?? 0);
assert(T001, "missing T001_ADDRESS");
export const T002 = BigInt(Deno.env.get("T002_ADDRESS") ?? 0);
assert(T002, "missing T002_ADDRESS");
export const T003 = BigInt(Deno.env.get("T003_ADDRESS") ?? 0);
assert(T003, "missing T003_ADDRESS");
export const T004 = BigInt(Deno.env.get("T004_ADDRESS") ?? 0);
assert(T004, "missing T004_ADDRESS");
export const T005 = BigInt(Deno.env.get("T005_ADDRESS") ?? 0);
assert(T005, "missing T005_ADDRESS");
export const T006 = BigInt(Deno.env.get("T006_ADDRESS") ?? 0);
assert(T006, "missing T006_ADDRESS");

export default ({
  T000,
  T001,
  T002,
  T003,
  T004,
  T005,
  T006,
});
