import { assertEquals, assertThrows } from "@std/assert";
import { opt_page } from "./opt-page.ts";
import { ArgumentError } from "./types.ts";

Deno.test("opt_page [] defaults", () => {
  assertEquals(opt_page(), {
    page: null,
    page_size: null,
    page_step: null,
    hist_size: null,
  });
});
Deno.test("opt_page [page=1]", () => {
  const p = opt_page({ page: 1 });
  assertEquals(p.page, 1);
});
Deno.test("opt_page [page_size=10]", () => {
  const p = opt_page({ page_size: 10 });
  assertEquals(p.page_size, 10);
});
Deno.test("opt_page [page_step=5]", () => {
  const p = opt_page({ page_step: 5 });
  assertEquals(p.page_step, 5);
});
Deno.test("opt_page [hist_size=100]", () => {
  const p = opt_page({ hist_size: 100 });
  assertEquals(p.hist_size, 100);
});
Deno.test("opt_page [page_size=0] throws", () => {
  assertThrows(() => opt_page({ page_size: 0 }), ArgumentError);
});
Deno.test("opt_page [page_step=0] throws", () => {
  assertThrows(() => opt_page({ page_step: 0 }), ArgumentError);
});
