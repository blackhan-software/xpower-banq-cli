import { ethers } from "ethers";
import XPOW_ABI from "./abi/xpow-abi.json" with { type: "json" };

import { arg_token_by } from "../../arg/arg-token-by.ts";
import { opt_nonce_length } from "../../arg/opt-nonce-length.ts";
import { opt_pow_level } from "../../arg/opt-pow-level.ts";
import { opt_to } from "../../arg/opt-to.ts";

import { addressOf as x, abbressOf as y } from "../../function/address.ts";
import { assert } from "../../function/assert.ts";
import { zip } from "../../function/zip.ts";
import { Miner } from "../../pow/miner.ts";
import { wallet } from "../../wallet/index.ts";
import type { CommandResult } from "../types.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";

/**
 * xpow-mine [$XPOW] [--nonce-length=$NONCE_LENGTH] [--pow-level=$POW_LEVEL] [--to=$TO] [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    console.log([
      "XPOW",
    ].join(" "));
    console.log([
      "--help",
      "-h",
      "--version",
      "-v",
    ].join(" "));
    console.log([
      "--broadcast",
      "-Y",
      "--hd-path",
      "-H",
      "--json",
      "-j",
      "--ledger",
      "-l",
      "--no-progress",
      "-P",
      "--private-key",
      "-k",
      "--provider-url",
      "-u",
    ].join(" "));
    Deno.exit(0);
  }
  const { address: token, symbol } = arg_token_by(args.rest, "XPOW");
  assert(token > 0, `invalid token: ${token}`);
  const { pow_level: pow_level } = opt_pow_level(args);
  assert(pow_level > 0, `invalid pow-level: ${pow_level}`);
  const { nonce_length } = opt_nonce_length(args);
  assert(nonce_length > 0, `invalid nonce-length: ${nonce_length}`);
  const { address: to } = opt_to(args);
  if (!args.broadcast) {
    return [[symbol, pow_level, nonce_length, x(to)], [false]];
  }
  const { signer } = await wallet(args);
  const tos = to ? to : BigInt(await signer.getAddress());
  assert(BigInt(tos) > 0, `invalid to-address: ${tos}`);
  const XPOW = new ethers.Contract(
    x(token), XPOW_ABI, signer,
  );
  const miner = new Miner();
  const interval = Miner.interval();
  assert(interval > 0, `invalid interval: ${interval}`);
  const block_hash = await XPOW.blockHashOf(interval);
  assert(block_hash > 0, `invalid block-hash: ${block_hash}`);
  const hasher = await miner.init(
    token, tos, block_hash, nonce_length,
  );
  assert(
    typeof hasher === "function", "invalid hasher",
  );
  if (!args.json) {
    console.log();
  }
  for (let i = 0n; true; i += 1n) {
    hasher({
      callback: (nonce, zeros) => {
        const now = new Date();
        if (args.json) {
          console.log(JSON.stringify({
            amount: 2 ** zeros,
            nonce: hex(nonce, nonce_length),
            to: x(tos),
            block_hash,
            now: now.toISOString(),
          }));
        } else {
          console.log(`[ ⚡ ]`, zip([
            ["amount", 2 ** zeros],
            ["nonce", hex(nonce, nonce_length)],
            ["to", y(tos)],
            ["block-hash", y(block_hash)],
            ["now", now.toISOString()],
          ]));
        }
      },
      range: [(i) * 65536n, (i + 1n) * 65536n],
      zeros: pow_level,
    });
  }
}
function hex(nonce: bigint, length: number): string {
  return `0x${nonce.toString(16).padStart(length, "0")}`;
}
