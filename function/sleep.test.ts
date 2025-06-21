import { assertEquals } from "@std/assert";
import { sleep } from "./sleep.ts";

/**
 * @group sleep
 */
Deno.test("sleep: resolves", async () => {
  const result = await sleep(0);
  assertEquals(result, undefined);
});
