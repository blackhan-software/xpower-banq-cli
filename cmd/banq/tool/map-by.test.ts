import { assertEquals } from "@std/assert";
import { mapBy } from "./map-by.ts";

/**
 * @group mapBy
 */
Deno.test("mapBy: basic key extraction + omission", () => {
  const records = [
    { id: "a", value: 1 },
    { id: "b", value: 2 },
  ];
  const result = mapBy(records, "id");
  assertEquals(result["a"], { value: 1 });
  assertEquals(result["b"], { value: 2 });
});
Deno.test("mapBy: empty array", () => {
  const result = mapBy([], "id" as never);
  assertEquals(result, {});
});
Deno.test("mapBy: init parameter", () => {
  const records = [{ id: "b", value: 2 }];
  const init = { a: { value: 1 } };
  const result = mapBy(records, "id", init);
  assertEquals(result["a"], { value: 1 });
  assertEquals(result["b"], { value: 2 });
});
