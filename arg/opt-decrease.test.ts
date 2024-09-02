import { assertEquals } from "@std/assert";
import { opt_decrease } from "./opt-decrease.ts";

Deno.test("opt_decrease [no flags]", () => {
  assertEquals(opt_decrease(), { decrease: false });
});
Deno.test("opt_decrease [--dec]", () => {
  assertEquals(opt_decrease({ dec: true }), { decrease: true });
});
Deno.test("opt_decrease [--decrease]", () => {
  assertEquals(opt_decrease({ decrease: true }), { decrease: true });
});
Deno.test("opt_decrease [both]", () => {
  assertEquals(opt_decrease({ dec: true, decrease: true }), { decrease: true });
});
