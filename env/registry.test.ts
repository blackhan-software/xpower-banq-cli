import { AbiCoder, ethers } from "ethers";
import { assertEquals, assertRejects } from "@std/assert";
import { cache_clear } from "./cache-by.ts";
import {
  discover,
  discover_clear,
  resolve_token,
  symbolOf,
} from "./registry.ts";
import { set_registry_reverse } from "./registry-reverse.ts";

const IFACE = new ethers.Interface([
  "function tokens() view returns (address[])",
  "function oracle() view returns (address)",
  "function authority() view returns (address)",
  "function symbol() view returns (string)",
]);
const SEL = {
  tokens: IFACE.getFunction("tokens")!.selector,
  oracle: IFACE.getFunction("oracle")!.selector,
  authority: IFACE.getFunction("authority")!.selector,
  symbol: IFACE.getFunction("symbol")!.selector,
};

type MockPool = {
  address: string;
  tokens: string[];
  oracle: string;
  authority: string;
};
type MockConfig = {
  chainId: bigint;
  pools: MockPool[];
  symbols: Record<string, string>;
};

class MockProvider extends ethers.AbstractProvider {
  constructor(private cfg: MockConfig) {
    super();
  }
  override _detectNetwork(): Promise<ethers.Network> {
    return Promise.resolve(new ethers.Network("mock", this.cfg.chainId));
  }
  override _perform<T>(req: ethers.PerformActionRequest): Promise<T> {
    return Promise.resolve(this.dispatch(req) as T);
  }
  dispatch(req: ethers.PerformActionRequest): unknown {
    switch (req.method) {
      case "call": {
        const tx = req.transaction;
        return this.mock_call(tx.to ?? "0x", tx.data ?? "0x");
      }
      case "chainId":
        return this.cfg.chainId;
      case "getCode":
        return "0x";
      case "getBlockNumber":
        return 0;
      case "getBalance":
        return 0n;
      case "getGasPrice":
        return 0n;
      case "getPriorityFee":
        return 0n;
      case "getStorage":
        return "0x0000000000000000000000000000000000000000000000000000000000000000";
      case "estimateGas":
        return 0n;
      case "getBlock":
        return null;
      case "getTransaction":
        return null;
      case "getTransactionReceipt":
        return null;
      case "getTransactionResult":
        return "0x";
      case "getTransactionCount":
        return 0;
      case "getLogs":
        return [];
      case "broadcastTransaction":
        throw new Error("no broadcast in mock");
    }
    throw new Error("unhandled method");
  }
  mock_call(to: string, data: string): string {
    const abi = AbiCoder.defaultAbiCoder();
    const pool = this.cfg.pools.find(
      (p) => p.address.toLowerCase() === to.toLowerCase(),
    );
    if (pool) {
      if (data === SEL.tokens) {
        return abi.encode(["address[]"], [pool.tokens]);
      }
      if (data === SEL.oracle) {
        return abi.encode(["address"], [pool.oracle]);
      }
      if (data === SEL.authority) {
        return abi.encode(["address"], [pool.authority]);
      }
    }
    const symbol = this.cfg.symbols[to.toLowerCase()];
    if (symbol !== undefined && data === SEL.symbol) {
      return abi.encode(["string"], [symbol]);
    }
    throw new Error(`unhandled call: ${to} ${data}`);
  }
}

function random(): string {
  return ethers.Wallet.createRandom().address;
}

const ENV_OPTS = { permissions: { env: true } };
const CHAIN = 31337n;

function pool_name(i: number): string {
  return `P00${i}`;
}
function setup(
  cfg: MockConfig,
): MockProvider {
  cfg.pools.forEach((pool, i) => {
    Deno.env.set(`${pool_name(i)}_ADDRESS_v10c`, pool.address);
    Deno.env.set(`${pool_name(i)}_ADDRESS_v11a`, pool.address);
  });
  const caps = random();
  Deno.env.set("CAPS_ADDRESS_v10c", caps);
  cache_clear();
  discover_clear();
  return new MockProvider(cfg);
}
function teardown(cfg: MockConfig): void {
  cfg.pools.forEach((_, i) => {
    Deno.env.delete(`${pool_name(i)}_ADDRESS_v10c`);
    Deno.env.delete(`${pool_name(i)}_ADDRESS_v11a`);
  });
  Deno.env.delete("CAPS_ADDRESS_v10c");
  cache_clear();
  discover_clear();
  set_registry_reverse(new Map());
}

function default_cfg(): MockConfig {
  const pool = random();
  const wrapped_avax = random();
  const apow = random();
  const oracle = random();
  const authority = random();
  return {
    chainId: CHAIN,
    pools: [{
      address: pool,
      tokens: [wrapped_avax, apow],
      oracle,
      authority,
    }],
    symbols: {
      [wrapped_avax.toLowerCase()]: "WAVAX",
      [apow.toLowerCase()]: "APOW",
    },
  };
}

Deno.test(
  "registry: discovers tokens/oracles/ACMA with WAVAX normalization",
  ENV_OPTS,
  async () => {
    const cfg = default_cfg();
    const provider = setup(cfg);
    try {
      const reg = await discover(provider, "v10c");
      const pool = cfg.pools[0];
      assertEquals(reg.tokens.get("AVAX"), BigInt(pool.tokens[0]));
      assertEquals(reg.tokens.get("APOW"), BigInt(pool.tokens[1]));
      assertEquals(reg.tokens.has("WAVAX"), false);
      assertEquals(reg.oracles.get("T000"), BigInt(pool.oracle));
      assertEquals(reg.acma, BigInt(pool.authority));
      assertEquals(reg.pools.get("P000"), BigInt(pool.address));
      assertEquals(typeof reg.caps, "bigint");
      // reverse map
      assertEquals(reg.byAddress.get(BigInt(pool.tokens[0])), "AVAX");
      assertEquals(reg.byAddress.get(BigInt(pool.tokens[1])), "APOW");
      assertEquals(reg.byAddress.get(BigInt(pool.oracle)), "T000");
      assertEquals(reg.byAddress.get(BigInt(pool.authority)), "ACMA");
      assertEquals(reg.byAddress.get(BigInt(pool.address)), "P000");
      assertEquals(reg.byAddress.get(reg.caps), "CAPS");
    } finally {
      teardown(cfg);
    }
  },
);

Deno.test("registry: memoizes by (chainId, run)", ENV_OPTS, async () => {
  const cfg = default_cfg();
  const provider = setup(cfg);
  try {
    const first = await discover(provider, "v10c");
    const second = await discover(new MockProvider(cfg), "v10c");
    assertEquals(second, first);
    const other_run = await discover(new MockProvider(cfg), "v11a");
    assertEquals(other_run === first, false);
  } finally {
    teardown(cfg);
  }
});

Deno.test(
  "registry: labels per-pool caps overrides as CAPS",
  ENV_OPTS,
  async () => {
    const cfg = default_cfg();
    const provider = setup(cfg);
    const caps_override = random();
    Deno.env.set("P007_CAPS_ADDRESS_v11a", caps_override);
    try {
      const reg = await discover(provider, "v11a");
      assertEquals(reg.byAddress.get(BigInt(caps_override)), "CAPS");
    } finally {
      Deno.env.delete("P007_CAPS_ADDRESS_v11a");
      teardown(cfg);
    }
  },
);

Deno.test(
  "registry: resolve_token maps symbol and rejects unknown",
  ENV_OPTS,
  async () => {
    const cfg = default_cfg();
    const provider = setup(cfg);
    try {
      const reg = await discover(provider, "v10c");
      const pool = cfg.pools[0];
      assertEquals(resolve_token("AVAX", reg), BigInt(pool.tokens[0]));
      await assertRejects(
        () => Promise.resolve().then(() => resolve_token("XYZT", reg)),
        Error,
        "invalid token: XYZT",
      );
    } finally {
      teardown(cfg);
    }
  },
);

Deno.test("registry: throws when no pool resolves", ENV_OPTS, async () => {
  const cfg = default_cfg();
  const provider = setup(cfg);
  try {
    Deno.env.set(
      "P000_ADDRESS_v10c",
      "0x0000000000000000000000000000000000000000",
    );
    cache_clear();
    await assertRejects(
      () => discover(provider, "v10c"),
      Error,
      "no pool resolved",
    );
  } finally {
    teardown(cfg);
  }
});

Deno.test(
  "registry: enumerates pools from env and derives oracle names",
  ENV_OPTS,
  async () => {
    const cfg = default_cfg();
    const pool2 = random();
    const token2 = random();
    const oracle2 = random();
    const authority2 = random();
    cfg.symbols[token2.toLowerCase()] = "USDC";
    cfg.pools.push({
      address: pool2,
      tokens: [token2],
      oracle: oracle2,
      authority: authority2,
    });
    const provider = setup(cfg);
    try {
      const reg = await discover(provider, "v10c");
      assertEquals(reg.pools.get("P000"), BigInt(cfg.pools[0].address));
      assertEquals(reg.pools.get("P001"), BigInt(pool2));
      assertEquals(reg.oracles.get("T000"), BigInt(cfg.pools[0].oracle));
      assertEquals(reg.oracles.get("T001"), BigInt(oracle2));
      assertEquals(reg.tokens.get("USDC"), BigInt(token2));
      assertEquals(reg.byAddress.get(BigInt(oracle2)), "T001");
    } finally {
      teardown(cfg);
    }
  },
);

Deno.test(
  "registry: symbolOf rewrites WAVAX to AVAX and leaves others",
  ENV_OPTS,
  async () => {
    const cfg = default_cfg();
    const provider = setup(cfg);
    try {
      const pool = cfg.pools[0];
      const abi = ["function symbol() view returns (string)"];
      const wavax = new ethers.Contract(pool.tokens[0], abi, provider);
      const apow = new ethers.Contract(pool.tokens[1], abi, provider);
      const wbtc_addr = random();
      cfg.symbols[wbtc_addr.toLowerCase()] = "WBTC";
      const wbtc = new ethers.Contract(wbtc_addr, abi, provider);
      assertEquals(await symbolOf(wavax), "AVAX");
      assertEquals(await symbolOf(apow), "APOW");
      assertEquals(await symbolOf(wbtc), "WBTC");
    } finally {
      teardown(cfg);
    }
  },
);

Deno.test(
  "registry: keeps unknown W-symbols in tokens and reverse map",
  ENV_OPTS,
  async () => {
    const cfg = default_cfg();
    const wbtc_addr = random();
    cfg.symbols[wbtc_addr.toLowerCase()] = "WBTC";
    cfg.pools[0].tokens.push(wbtc_addr);
    const provider = setup(cfg);
    try {
      const reg = await discover(provider, "v10c");
      assertEquals(reg.tokens.get("WBTC"), BigInt(wbtc_addr));
      assertEquals(reg.byAddress.get(BigInt(wbtc_addr)), "WBTC");
    } finally {
      teardown(cfg);
    }
  },
);
