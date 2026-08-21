import { assertEquals, assertThrows } from "@std/assert";

import type { Config } from "./types.ts";
import { flatten } from "./flatten.ts";
import { load_config, merge_config, validate_config } from "./load.ts";

function hex40(i: number): string {
  return `0x${i.toString(16).padStart(40, "0")}`;
}

const base_config = (): Config => ({
  provider: { urls: ["https://a.example", "wss://b.example"] },
  contract_run: "v10c",
  accounts: { hd_path: "m/44'/60'/0'/0/0", private_key: "0xabc" },
  contracts: {
    caps: { v10c: hex40(1), v11a: hex40(2) },
    pool_caps: { P007: { v11a: hex40(3) } },
    pools: {
      P000: { v10b: hex40(10), v10c: hex40(11), v11a: hex40(12) },
      P001: { v10c: hex40(21) },
    },
  },
  contacts: { ALTO: hex40(30), BOSS: hex40(31) },
});

Deno.test("flatten: emits legacy dotenv keys", () => {
  const env = flatten(base_config());
  assertEquals(env.PROVIDER_URL, "https://a.example,wss://b.example");
  assertEquals(env.CONTRACT_RUN, "v10c");
  assertEquals(env.HD_PATH, "m/44'/60'/0'/0/0");
  assertEquals(env.PRIVATE_KEY, "0xabc");
  assertEquals(env.CAPS_ADDRESS_v10c, hex40(1));
  assertEquals(env.CAPS_ADDRESS_v11a, hex40(2));
  assertEquals(env.P007_CAPS_ADDRESS_v11a, hex40(3));
  assertEquals(env.P000_ADDRESS_v10b, hex40(10));
  assertEquals(env.P000_ADDRESS_v11a, hex40(12));
  assertEquals(env.P001_ADDRESS_v10c, hex40(21));
  assertEquals(env.ALTO_ADDRESS, hex40(30));
  assertEquals(env.BOSS_ADDRESS, hex40(31));
  assertEquals(Object.keys(env).length, 13);
});

Deno.test("flatten: per-pool caps do not clash with default caps", () => {
  const env = flatten(base_config());
  assertEquals(env.CAPS_ADDRESS_v11a, hex40(2));
  assertEquals(env.P007_CAPS_ADDRESS_v11a, hex40(3));
  assertEquals(env.CAPS_ADDRESS_v11a !== env.P007_CAPS_ADDRESS_v11a, true);
});

Deno.test("flatten: omits optional sections when absent", () => {
  const env = flatten(validate_config({
    provider: { urls: ["https://a.example"] },
    contracts: {
      caps: { v10c: hex40(1) },
      pools: { P000: { v10c: hex40(11) } },
    },
  }));
  assertEquals(env.CONTRACT_RUN, undefined);
  assertEquals(env.PRIVATE_KEY, undefined);
  assertEquals(env.HD_PATH, undefined);
  assertEquals(env.P001_ADDRESS_v10c, undefined);
  assertEquals(env.ALTO_ADDRESS, undefined);
});

Deno.test("merge: local overlay replaces urls, merges pools per-run", () => {
  const base = validate_config({
    provider: { urls: ["https://base.example"] },
    contract_run: "v10c",
    contracts: {
      caps: { v10c: hex40(1), P007: { v11a: hex40(3) } },
      pools: { P000: { v10b: hex40(10), v10c: hex40(11) } },
    },
  });
  const over = validate_config({
    provider: { urls: ["https://local.example"] },
    contracts: {
      caps: { v11a: hex40(2), P007: { v10c: hex40(4) } },
      pools: {
        P000: { v11a: hex40(12) },
        P001: { v10c: hex40(21) },
      },
    },
  });
  const env = flatten(merge_config(base, over));
  assertEquals(env.PROVIDER_URL, "https://local.example");
  assertEquals(env.CONTRACT_RUN, "v10c");
  assertEquals(env.CAPS_ADDRESS_v10c, hex40(1));
  assertEquals(env.CAPS_ADDRESS_v11a, hex40(2));
  assertEquals(env.P007_CAPS_ADDRESS_v10c, hex40(4));
  assertEquals(env.P007_CAPS_ADDRESS_v11a, hex40(3));
  assertEquals(env.P000_ADDRESS_v10b, hex40(10));
  assertEquals(env.P000_ADDRESS_v11a, hex40(12));
  assertEquals(env.P001_ADDRESS_v10c, hex40(21));
});

Deno.test("validate: rejects unquoted hex address (YAML number coercion)", () => {
  assertThrows(
    () =>
      validate_config({
        provider: { urls: ["https://a.example"] },
        contracts: { caps: { v10c: 123 }, pools: {} },
      }),
    Error,
    "must be a quoted 0x address",
  );
});

Deno.test("validate: rejects unknown contract_run", () => {
  assertThrows(
    () =>
      validate_config({
        provider: { urls: ["https://a.example"] },
        contract_run: "v99",
        contracts: { caps: { v10c: hex40(1) }, pools: {} },
      }),
    Error,
    "invalid contract_run: v99",
  );
});

Deno.test("validate: rejects empty provider.urls", () => {
  assertThrows(
    () =>
      validate_config({
        provider: { urls: [] },
        contracts: { caps: { v10c: hex40(1) }, pools: {} },
      }),
    Error,
    "non-empty list",
  );
});

Deno.test("load: committed mainnet/testnet configs flatten to known keys", () => {
  const repo = `${import.meta.dirname}/..`;
  for (const net of ["mainnet", "testnet"] as const) {
    const env = flatten(load_config(net, { base_dir: repo, local: false }));
    assertEquals(env.CONTRACT_RUN, "v10c");
    assertEquals(env.PROVIDER_URL.includes("http"), true);
    assertEquals(/^0x[0-9a-fA-F]{40}$/.test(env.CAPS_ADDRESS_v10c), true);
    assertEquals(/^0x[0-9a-fA-F]{40}$/.test(env.CAPS_ADDRESS_v11a), true);
    assertEquals(/^0x[0-9a-fA-F]{40}$/.test(env.P007_CAPS_ADDRESS_v11a), true);
    assertEquals(env.CAPS_ADDRESS_v11a !== env.P007_CAPS_ADDRESS_v11a, true);
    assertEquals(/^0x[0-9a-fA-F]{40}$/.test(env.P000_ADDRESS_v10c), true);
    assertEquals(/^0x[0-9a-fA-F]{40}$/.test(env.P007_ADDRESS_v11a), true);
    assertEquals(/^0x[0-9a-fA-F]{40}$/.test(env.ALTO_ADDRESS), true);
  }
});
