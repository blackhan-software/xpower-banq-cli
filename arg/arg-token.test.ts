import { assertEquals, assertThrows } from "@std/assert";
import { arg_token } from "./arg-token.ts";
import { ArgumentError } from "./types.ts";

const OPTS = { permissions: { env: true } };

Deno.test("arg_token [APOW]", OPTS, () => {
  const { symbol, address } = arg_token({}, ["APOW"]);
  assertEquals(symbol, "APOW");
  assertEquals(typeof address, "bigint");
});
Deno.test("arg_token [XPOW]", OPTS, () => {
  const { symbol, address } = arg_token({}, ["XPOW"]);
  assertEquals(symbol, "XPOW");
  assertEquals(typeof address, "bigint");
});
Deno.test("arg_token [apow] case-insensitive", OPTS, () => {
  const { symbol } = arg_token({}, ["apow"]);
  assertEquals(symbol, "APOW");
});
Deno.test("arg_token [bigint address]", OPTS, () => {
  const { address } = arg_token({}, ["APOW"]);
  const result = arg_token({}, [address]);
  assertEquals(result.address, address);
});
Deno.test("arg_token [unknown] throws", OPTS, () => {
  assertThrows(() => arg_token({}, ["XYZT"]), ArgumentError);
});
Deno.test("arg_token [] throws", OPTS, () => {
  assertThrows(() => arg_token({}, []), ArgumentError);
});
