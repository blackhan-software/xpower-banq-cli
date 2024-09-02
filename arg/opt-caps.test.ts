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

Deno.test("opt_caps [P007] prefers pool-specific caps", OPTS, () => {
  const run = "v11a";
  const pool_key = "P007_CAPS_ADDRESS_v11a";
  const std_key = "CAPS_ADDRESS_v11a";
  const pool_addr = "0x2222222222222222222222222222222222222222";
  const std_addr = "0x1111111111111111111111111111111111111111";
  const prev_run = Deno.env.get("CONTRACT_RUN");
  const prev_pool = Deno.env.get(pool_key);
  const prev_std = Deno.env.get(std_key);
  Deno.env.set("CONTRACT_RUN", run);
  Deno.env.set(pool_key, pool_addr);
  Deno.env.set(std_key, std_addr);
  try {
    assertEquals(
      opt_caps("P007").address,
      0x2222222222222222222222222222222222222222n,
    );
    assertEquals(
      opt_caps().address,
      0x1111111111111111111111111111111111111111n,
    );
  } finally {
    if (prev_run !== undefined) Deno.env.set("CONTRACT_RUN", prev_run);
    else Deno.env.delete("CONTRACT_RUN");
    if (prev_pool !== undefined) Deno.env.set(pool_key, prev_pool);
    else Deno.env.delete(pool_key);
    if (prev_std !== undefined) Deno.env.set(std_key, prev_std);
    else Deno.env.delete(std_key);
  }
});
