import { assertEquals } from "@std/assert";
import { combine, permute, power_set } from "./power-set.ts";

/**
 * @group power_set
 */
Deno.test("power_set: empty string", () => {
  const result = power_set("");
  assertEquals(result, [""]);
});
Deno.test("power_set: single char", () => {
  const result = power_set("a");
  assertEquals(result.includes(""), true);
  assertEquals(result.includes("a"), true);
  assertEquals(result.length, 2);
});
Deno.test("power_set: 'ab'", () => {
  const result = power_set("ab");
  assertEquals(result.includes(""), true);
  assertEquals(result.includes("a"), true);
  assertEquals(result.includes("b"), true);
  assertEquals(result.includes("ab"), true);
  assertEquals(result.length, 4);
});
Deno.test("power_set: combine=true", () => {
  const result = power_set("ab", true);
  assertEquals(result.includes("a"), true);
  assertEquals(result.includes("b"), true);
  assertEquals(result.includes("ab"), true);
  assertEquals(result.includes("ba"), true);
});
/**
 * @group combine
 */
Deno.test("combine: 'ab'", () => {
  const result = combine("ab");
  assertEquals(result.includes("a"), true);
  assertEquals(result.includes("b"), true);
  assertEquals(result.includes("ab"), true);
  assertEquals(result.includes("ba"), true);
});
/**
 * @group permute
 */
Deno.test("permute: 'ab'", () => {
  const result = permute("ab");
  assertEquals(result.includes("ab"), true);
  assertEquals(result.includes("ba"), true);
  assertEquals(result.length, 2);
});
