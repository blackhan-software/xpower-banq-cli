import { ethers, Interface, isCallException } from "ethers";
import XPOW_ABI from "./abi/xpow-abi.json" with { type: "json" };

import { arg_token_by } from "../../arg/arg-token-by.ts";
import { opt_gas } from "../../arg/opt-gas.ts";

import { addressOf as x } from "../../function/address.ts";
import { assert } from "../../function/assert.ts";
import { zip } from "../../function/zip.ts";
import { wallet } from "../../wallet/index.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { type CommandResult, DRY_RUN } from "../types.ts";
import { list_options } from "./tool/completions.ts";

type Data = {
  amount: number;
  block_hash: string;
  hash: string;
  interval: number;
  nonce: string;
  now: string;
  to: string;
};

/**
 * xpow-mint [--options]
 *
 * @note Logs errors directly via `console.error` (instead of returning them in
 * the result tuple) because this is a long-running streaming command designed
 * for the `xpow-mine | xpow-mint` FIFO pipeline — it must survive transient
 * errors and continue consuming from stdin.
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options([]);
  }
  const { address: token } = arg_token_by(args, args.rest, "XPOW");
  assert(token > 0, `invalid token: ${token}`);
  if (!args.broadcast) {
    return [[token], [DRY_RUN]];
  }
  while (true) {
    await mint(args, token, Deno.stdin.readable);
  }
}
async function mint(
  args: BanqArgs,
  token: bigint,
  readable: ReadableStream<Uint8Array>,
) {
  const { signer } = await wallet(args);
  const xpow = new ethers.Contract(
    x(token),
    XPOW_ABI,
    signer,
  );
  const iface = new Interface(XPOW_ABI);
  const stream = readable.pipeThrough(
    new TextDecoderStream(),
  );
  for await (const line of stream) {
    const data = try_parse(line);
    if (!data) continue;
    const { to, interval, block_hash, nonce } = data;
    try {
      await xpow.mint(to, block_hash, nonce, opt_gas(args));
    } catch (e) {
      if (isCallException(e) && e.data) {
        console.error(JSON.stringify(iface.parseError(e.data)));
      } else {
        console.error(JSON.stringify(e));
      }
      continue;
    }
    const { amount, hash, now } = data;
    if (args.json) {
      console.log(JSON.stringify({
        amount,
        nonce,
        to,
        interval,
        block_hash,
        hash,
        now,
      }));
    } else {
      console.log(
        `[ ⚡ ]`,
        zip([
          ["amount", amount],
          ["nonce", nonce],
          ["to", to],
          ["interval", interval],
          ["block-hash", block_hash],
          ["hash", hash],
          ["now", now],
        ]),
      );
    }
  }
}
function try_parse(line: string): Data | null {
  try {
    return JSON.parse(line.trim());
  } catch {
    return null;
  }
}
