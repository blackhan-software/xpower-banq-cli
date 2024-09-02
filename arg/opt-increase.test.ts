import { assertEquals } from "@std/assert";
import { opt_increase } from "./opt-increase.ts";

Deno.test("opt_increase [no flags]", () => {
  assertEquals(opt_increase(), { increase: false });
});
Deno.test("opt_increase [--inc]", () => {
  assertEquals(opt_increase({ inc: true }), { increase: true });
});
Deno.test("opt_increase [--increase]", () => {
  assertEquals(opt_increase({ increase: true }), { increase: true });
});
Deno.test("opt_increase [both]", () => {
  assertEquals(opt_increase({ inc: true, increase: true }), { increase: true });
});
