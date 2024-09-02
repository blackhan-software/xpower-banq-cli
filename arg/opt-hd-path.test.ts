import { assertEquals, assertThrows } from "@std/assert";
import { opt_hd_path } from "./opt-hd-path.ts";
import { ArgumentError } from "./types.ts";

const OPTS = { permissions: { env: true } };

Deno.test("opt_hd_path [m/44'/60'/0'/0/0]", OPTS, () => {
  assertEquals(
    opt_hd_path({ hd_path: "m/44'/60'/0'/0/0" }),
    "m/44'/60'/0'/0/0",
  );
});
Deno.test("opt_hd_path [m/44'/60'/0'/0/1]", OPTS, () => {
  assertEquals(
    opt_hd_path({ hd_path: "m/44'/60'/0'/0/1" }),
    "m/44'/60'/0'/0/1",
  );
});
Deno.test("opt_hd_path [invalid] throws", OPTS, () => {
  assertThrows(
    () => opt_hd_path({ hd_path: "invalid" }),
    ArgumentError,
  );
});
Deno.test("opt_hd_path [] default", OPTS, () => {
  assertEquals(opt_hd_path(), "m/44'/60'/0'/0/0");
});
