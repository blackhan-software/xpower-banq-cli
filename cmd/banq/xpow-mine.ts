import { ethers, hexlify } from "ethers";
import crypto from "node:crypto";
import XPOW_ABI from "./abi/xpow-abi.json" with { type: "json" };

import { arg_token_by } from "../../arg/arg-token-by.ts";
import { opt_nonce_length } from "../../arg/opt-nonce-length.ts";
import { opt_pow_level } from "../../arg/opt-pow-level.ts";
import { opt_to } from "../../arg/opt-to.ts";

import { abbressOf as y, addressOf as x } from "../../function/address.ts";
import { assert } from "../../function/assert.ts";
import { hex } from "../../function/hex.ts";
import { sleep } from "../../function/sleep.ts";
import { zip } from "../../function/zip.ts";
import { Miner } from "../../pow/miner.ts";
import { wallet } from "../../wallet/index.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import type { CommandResult } from "../types.ts";

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
  const { address: token, symbol } = arg_token_by(args, args.rest, "XPOW");
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
  const bito = to ? to : BigInt(await signer.getAddress());
  assert(bito > 0, `invalid address: ${x(bito)}`);
  const xpow = new ethers.Contract(
    x(token),
    XPOW_ABI,
    signer,
  );
  const { block_hash, interval } = await blockHashOf(xpow, 5);
  assert(block_hash > 0, `invalid block-hash: ${block_hash}`);
  assert(interval > 0, `invalid interval: ${interval}`);
  const hasher = await new Miner().init(
    token,
    bito,
    block_hash,
    nonce_length,
  );
  assert(
    typeof hasher === "function",
  );
  const anchor = largeRandom(nonce_length);
  for (let i = 0n, j = 1n; true; i += 1n, j += 1n) {
    const lhs_nonce = anchor + 65536n * i;
    const rhs_nonce = anchor + 65536n * j;
    hasher({
      callback: (nonce, zeros, hash) => {
        const now = new Date();
        if (args.json) {
          console.log(JSON.stringify({
            amount: 2 ** zeros,
            nonce: hex(nonce),
            to: x(bito),
            interval: Number(interval),
            block_hash,
            hash: hexlify(hash),
            now: now.toISOString(),
          }));
        } else {
          console.log(
            `[ ⚡ ]`,
            zip([
              ["amount", 2 ** zeros],
              ["nonce", hex(nonce)],
              ["to", y(bito)],
              ["interval", Number(interval)],
              ["block-hash", hex(block_hash, 64, 4)],
              ["hash", hex(hexlify(hash), 64, 8)],
              ["now", now.toISOString()],
            ]),
          );
        }
      },
      range: [lhs_nonce, rhs_nonce - 1n],
      zeros: pow_level,
    });
  }
}
async function blockHashOf(
  xpow: ethers.Contract,
  attempts: number,
  ms = 1000,
) {
  let interval, block_hash;
  for (let i = 0; i < attempts; i++) {
    // delay by an exponential backoff
    await sleep(
      (2 ** i - 1) * ms,
    );
    // get current-interval from contract
    try {
      interval = await xpow.currentInterval();
    } catch (e) {
      console.error(e);
      continue;
    }
    if (interval != Miner.interval() || !BigInt(interval)) {
      continue;
    }
    // get block-hash for current-interval
    try {
      block_hash = await xpow.blockHashOf(interval);
    } catch (e) {
      console.error(e);
      continue;
    }
    if (!block_hash || !BigInt(block_hash)) {
      continue;
    }
    break;
  }
  return { block_hash, interval };
}
function largeRandom(length: number): bigint {
  const bytes = crypto.randomBytes(length);
  if (bytes[0] > 15) {
    return bytes.readBigUInt64BE();
  }
  return largeRandom(length);
}
