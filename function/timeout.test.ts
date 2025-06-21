import { assertRejects } from "@std/assert";
import { timeout } from "./timeout.ts";

/**
 * @group timeout
 */
Deno.test("timeout: rejects with Error", async () => {
  await assertRejects(() => timeout(0), Error, "timeout");
});
Deno.test("timeout: custom message", async () => {
  await assertRejects(() => timeout(0, "custom"), Error, "custom");
});
