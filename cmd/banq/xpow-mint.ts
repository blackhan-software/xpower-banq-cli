import { ethers, Interface, isCallException } from "ethers";
import XPOW_ABI from "./abi/xpow-abi.json" with { type: "json" };

import { arg_token_by } from "../../arg/arg-token-by.ts";
import { opt_batch_size } from "../../arg/opt-batch-size.ts";
import { opt_contract_run } from "../../arg/opt-contract-run.ts";
import { opt_gas } from "../../arg/opt-gas.ts";

import { addressOf as x } from "../../function/address.ts";
import { assert } from "../../function/assert.ts";
import { zip } from "../../function/zip.ts";
import { wallet } from "../../wallet/index.ts";
import { discover, resolve_arg_token } from "../../env/registry.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { type CommandResult, DRY_RUN } from "../types.ts";
import { list_options } from "./tool/completions.ts";
import { NonceBatch, type NonceData } from "./tool/nonce-batch.ts";

/**
 * xpow-mint [--options]
 *
 * @note Logs errors directly via `console.error` (instead of returning them in
 * result tuple), because this is a long-running streaming command designed for
 * `xpow-mine | xpow-mint` FIFO pipeline — it must survive transient errors and
 * continue consuming from stdin.
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options([], ["--batch-size", "-b"]);
  }
  const token_arg = arg_token_by(args, args.rest, "XPOW");
  const { batch_size } = opt_batch_size(args);
  if (!args.broadcast) {
    return [[token_arg.symbol, batch_size], [DRY_RUN]];
  }
  const { signer } = await wallet(args);
  const { contract_run: run } = opt_contract_run(args);
  const reg = await discover(signer.provider!, run);
  const { address: token, symbol } = resolve_arg_token(token_arg, reg);
  assert(token > 0, `invalid token: ${symbol}`);
  while (true) {
    await stream(args, token, batch_size, Deno.stdin.readable);
  }
}
async function stream(
  args: BanqArgs,
  token: bigint,
  batch_size: number,
  readable: ReadableStream<Uint8Array>,
) {
  const { signer } = await wallet(args);
  const xpow = new ethers.Contract(
    x(token),
    XPOW_ABI,
    signer,
  );
  const iface = new Interface(XPOW_ABI);
  const reader = readable.pipeThrough(
    new TextDecoderStream(),
  );
  const nonce_batch = new NonceBatch(batch_size);
  for await (const line of reader) {
    const data = try_parse(line);
    if (!data) continue;
    const group = nonce_batch.push(data);
    if (group) {
      await execute(args, xpow, iface, group);
    }
  }
  const rest = nonce_batch.flush();
  if (rest.length) {
    await execute(args, xpow, iface, rest);
  }
}
async function execute(
  args: BanqArgs,
  xpow: ethers.Contract,
  iface: Interface,
  group: NonceData[],
) {
  const { to, block_hash } = group[0];
  const nonces = group.map((data) => data.nonce);
  try {
    if (group.length > 1) {
      await xpow.mintBatch(to, block_hash, nonces, opt_gas(args));
    } else {
      await xpow.mint(to, block_hash, nonces[0], opt_gas(args));
    }
  } catch (e) {
    if (isCallException(e) && e.data) {
      console.error(JSON.stringify(iface.parseError(e.data)));
    } else {
      console.error(JSON.stringify(e));
    }
    return;
  }
  log(args, group, nonces);
}
function log(
  args: BanqArgs,
  group: NonceData[],
  nonces: string[],
) {
  const hashes = group.map((data) => data.hash);
  const amount = group.reduce((sum, data) => sum + data.amount, 0);
  const { to, interval, block_hash, now } = group[0];
  if (args.json) {
    console.log(JSON.stringify({
      amount,
      nonces,
      to,
      interval,
      block_hash,
      hashes,
      now,
    }));
  } else {
    console.log(
      `[ ⚡ ]`,
      zip([
        ["amount", amount],
        ["nonces", nonces.join(",")],
        ["to", to],
        ["interval", interval],
        ["block-hash", block_hash],
        ["now", now],
      ]),
    );
  }
}
function try_parse(line: string): NonceData | null {
  try {
    return JSON.parse(line.trim());
  } catch {
    return null;
  }
}
