import { assertEquals, assertThrows } from "@std/assert";
import { opt_caps } from "./opt-caps.ts";

const OPTS = { permissions: { env: true } };

Deno.test("opt_caps [] returns address", OPTS, () => {
  const { address } = opt_caps();
  assertEquals(typeof address, "bigint");
});

Deno.test("opt_caps [] throws when CAPS_ADDRESS not set", OPTS, () => {
  const key = "CAPS_ADDRESS_v10c";
  const prev = Deno.env.get(key);
  Deno.env.delete(key);
  try {
    assertThrows(() => opt_caps(), Error, "CAPS_ADDRESS not set");
  } finally {
    if (prev !== undefined) Deno.env.set(key, prev);
  }
});
