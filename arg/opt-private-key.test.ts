import { assertEquals, assertThrows } from "@std/assert";
import { opt_private_key } from "./opt-private-key.ts";
import { ArgumentError } from "./types.ts";

const OPTS = { permissions: { env: true } };
const VALID_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

Deno.test("opt_private_key [valid hex]", OPTS, () => {
  assertEquals(opt_private_key({ private_key: VALID_KEY }), VALID_KEY);
});
Deno.test("opt_private_key [no 0x prefix]", OPTS, () => {
  const bare = VALID_KEY.slice(2);
  assertEquals(opt_private_key({ private_key: bare }), VALID_KEY);
});
Deno.test("opt_private_key [invalid] throws", OPTS, () => {
  assertThrows(
    () => opt_private_key({ private_key: "not-a-key" }),
    ArgumentError,
  );
});
Deno.test("opt_private_key [too short] throws", OPTS, () => {
  assertThrows(
    () => opt_private_key({ private_key: "0xdead" }),
    ArgumentError,
  );
});
