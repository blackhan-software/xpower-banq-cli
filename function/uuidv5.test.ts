import { assertEquals } from "@std/assert";
import { uuidv5 } from "./uuidv5.ts";

/**
 * @group uuidv5
 */
Deno.test("uuidv5: deterministic output", () => {
  const a = uuidv5("test");
  const b = uuidv5("test");
  assertEquals(a, b);
});
Deno.test("uuidv5: default namespace", () => {
  const id = uuidv5("hello");
  assertEquals(typeof id, "string");
  assertEquals(id.length, 36);
});
Deno.test("uuidv5: custom namespace", () => {
  const a = uuidv5("test", "00000000-0000-0000-0000-000000000000");
  const b = uuidv5("test");
  // different namespaces should produce different UUIDs
  assertEquals(a !== b, true);
});
Deno.test("uuidv5: UUID format validation", () => {
  const id = uuidv5("format-test");
  const parts = id.split("-");
  assertEquals(parts.length, 5);
  assertEquals(parts[0].length, 8);
  assertEquals(parts[1].length, 4);
  assertEquals(parts[2].length, 4);
  assertEquals(parts[3].length, 4);
  assertEquals(parts[4].length, 12);
  // version 5
  assertEquals(parts[2][0], "5");
});
