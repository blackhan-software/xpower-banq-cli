import { AbiCoder, ethers, solidityPackedKeccak256 } from "ethers";
import { address_by } from "../env/find-by.ts";
import { addressOf } from "../function/address.ts";
import type { BanqArgs } from "../cli/banq/banq.ts";

/** Anvil default mnemonic account #0 */
const ACCOUNT_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ACCOUNT_ADDR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

/** Anvil default mnemonic account #1 */
const ACCOUNT1_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const ACCOUNT1_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

/**
 * Check if Anvil (from Foundry) is available on the system.
 */
export const ANVIL_AVAILABLE: boolean = await (async () => {
  try {
    const cmd = new Deno.Command("anvil", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });
    const { success } = await cmd.output();
    return success;
  } catch {
    return false;
  }
})();

export type AnvilInstance = {
  url: string;
  stop: () => void;
  accounts: { key: string; address: string }[];
  makeArgs: (overrides?: Record<string, unknown>) => BanqArgs;
  fundToken: (symbol: string, account: string, amount: bigint) => Promise<void>;
  rpc: (method: string, params?: unknown[]) => Promise<unknown>;
};

/**
 * Spawn an Anvil instance forking Fuji testnet.
 * Returns helpers for test setup/teardown.
 */
export async function startAnvil(): Promise<AnvilInstance> {
  const port = 10000 + Math.floor(Math.random() * 50000);
  const rpcUrl = Deno.env.get("PROVIDER_URL") ??
    "https://api.avax-test.network/ext/bc/C/rpc";
  const cmd = new Deno.Command("anvil", {
    args: [
      "--fork-url",
      rpcUrl,
      "--port",
      `${port}`,
      "--silent",
    ],
    stdout: "piped",
    stderr: "piped",
  });
  const child = cmd.spawn();
  const url = `http://127.0.0.1:${port}`;

  // Wait for Anvil to be ready
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      });
      const json = await res.json();
      if (json.result) break;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  const rpc = async (
    method: string,
    params: unknown[] = [],
  ): Promise<unknown> => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
    });
    const json = await res.json();
    if (json.error) throw new Error(`RPC ${method}: ${json.error.message}`);
    return json.result;
  };

  const accounts = [
    { key: ACCOUNT_KEY, address: ACCOUNT_ADDR },
    { key: ACCOUNT1_KEY, address: ACCOUNT1_ADDR },
  ];

  const contractRun = Deno.env.get("CONTRACT_RUN") ?? "v10a";

  const makeArgs = (overrides?: Record<string, unknown>): BanqArgs => {
    return {
      broadcast: true,
      pool: "P000",
      provider_url: url,
      private_key: ACCOUNT_KEY,
      rest: [],
      ...overrides,
    } as unknown as BanqArgs;
  };

  /**
   * Fund an account with ERC20 tokens via anvil_setStorageAt.
   * Probes storage slots 0-10 to find the _balances mapping.
   */
  const fundToken = async (
    symbol: string,
    account: string,
    amount: bigint,
  ): Promise<void> => {
    const tokenAddr = address_by(symbol, contractRun);
    if (!tokenAddr) throw new Error(`Unknown token: ${symbol}`);
    const tokenHex = addressOf(tokenAddr);
    const paddedAccount = AbiCoder.defaultAbiCoder()
      .encode(["address"], [account]);
    const value = AbiCoder.defaultAbiCoder()
      .encode(["uint256"], [amount]);

    // Probe slots 0-10 for _balances mapping
    for (let slot = 0; slot <= 10; slot++) {
      const storageSlot = solidityPackedKeccak256(
        ["bytes32", "uint256"],
        [paddedAccount, slot],
      );
      await rpc("anvil_setStorageAt", [tokenHex, storageSlot, value]);

      // Verify it worked by checking balanceOf
      const provider = new ethers.JsonRpcProvider(url);
      const token = new ethers.Contract(tokenHex, [
        "function balanceOf(address) view returns (uint256)",
      ], provider);
      const balance: bigint = await token.balanceOf(account);
      provider.destroy();
      if (balance === amount) return;
    }
    throw new Error(
      `Could not set balance for ${symbol} — no matching storage slot found`,
    );
  };

  const stop = () => {
    try {
      child.kill("SIGTERM");
    } catch {
      // already stopped
    }
  };

  return { url, stop, accounts, makeArgs, fundToken, rpc };
}
