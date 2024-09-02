import { assertEquals, assertThrows } from "@std/assert";
import { arg_token } from "./arg-token.ts";
import { ArgumentError } from "./types.ts";
import { type Registry, resolve_arg_token } from "../env/registry.ts";

const OPTS = { permissions: { env: true } };

function fake_reg(): Registry {
  return {
    tokens: new Map(),
    byAddress: new Map(),
    oracles: new Map(),
    acma: 0n,
    pools: new Map(),
    caps: 0n,
  };
}

Deno.test("arg_token [APOW]", OPTS, () => {
  const { symbol, address } = arg_token({}, ["APOW"]);
  assertEquals(symbol, "APOW");
  assertEquals(address, 0n);
});
Deno.test("arg_token [XPOW]", OPTS, () => {
  const { symbol, address } = arg_token({}, ["XPOW"]);
  assertEquals(symbol, "XPOW");
  assertEquals(address, 0n);
});
Deno.test("arg_token [apow] case-insensitive", OPTS, () => {
  const { symbol } = arg_token({}, ["apow"]);
  assertEquals(symbol, "APOW");
});
Deno.test("arg_token [bigint address]", OPTS, () => {
  const address = 0x123n;
  const result = arg_token({}, [address]);
  assertEquals(result.address, address);
  assertEquals(result.symbol, "");
});
Deno.test("arg_token [unknown] lenient offline", OPTS, () => {
  const { symbol, address } = arg_token({}, ["XYZT"]);
  assertEquals(symbol, "XYZT");
  assertEquals(address, 0n);
});
Deno.test("arg_token [] throws", OPTS, () => {
  assertThrows(() => arg_token({}, []), ArgumentError);
});
Deno.test("resolve_arg_token maps symbol to address", OPTS, () => {
  const reg = fake_reg();
  reg.tokens.set("APOW", 0x123n);
  assertEquals(resolve_arg_token(arg_token({}, ["APOW"]), reg), {
    address: 0x123n,
    symbol: "APOW",
  });
});
Deno.test("resolve_arg_token maps address to symbol", OPTS, () => {
  const reg = fake_reg();
  reg.byAddress.set(0x123n, "APOW");
  assertEquals(resolve_arg_token(arg_token({}, [0x123n]), reg), {
    address: 0x123n,
    symbol: "APOW",
  });
});
Deno.test("resolve_arg_token [unknown] throws", OPTS, () => {
  assertThrows(
    () => resolve_arg_token(arg_token({}, ["XYZT"]), fake_reg()),
    ArgumentError,
    "invalid token: XYZT",
  );
});
