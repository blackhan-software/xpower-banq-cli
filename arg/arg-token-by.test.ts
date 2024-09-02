import { assertEquals, assertThrows } from "@std/assert";
import { arg_token_by } from "./arg-token-by.ts";
import { ArgumentError } from "./types.ts";

const OPTS = { permissions: { env: true } };

Deno.test("arg_token_by [APOW, APOW]", OPTS, () => {
  const { symbol } = arg_token_by({}, ["APOW"], "APOW");
  assertEquals(symbol, "APOW");
});
Deno.test("arg_token_by [XPOW, APOW] mismatch throws", OPTS, () => {
  assertThrows(
    () => arg_token_by({}, ["XPOW"], "APOW"),
    ArgumentError,
  );
});
Deno.test("arg_token_by [undefined, APOW] fallback", OPTS, () => {
  const { symbol } = arg_token_by({}, [], "APOW");
  assertEquals(symbol, "APOW");
});
