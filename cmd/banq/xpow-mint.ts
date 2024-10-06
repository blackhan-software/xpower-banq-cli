import { ethers, Interface, isCallException } from "ethers";
import XPOW_ABI from "./abi/xpow-abi.json" with { type: "json" };

import { arg_token_by } from "../../arg/arg-token-by.ts";
import { opt_gas } from "../../arg/opt-gas.ts";

import { addressOf as x } from "../../function/address.ts";
import { assert } from "../../function/assert.ts";
import { zip } from "../../function/zip.ts";
import { wallet } from "../../wallet/index.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import type { CommandResult } from "../types.ts";

type Data = {
  amount: number;
  block_hash: string;
  hash: string;
  nonce: string;
  now: string;
  to: string;
};

/**
 * xpow-mint [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
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
  const { address: token } = arg_token_by(args.rest, "XPOW");
  assert(token > 0, `invalid token: ${token}`);
  if (!args.broadcast) {
    return [[token], [false]];
  }
  while (true) {
    await mint(args, token, Deno.stdin.readable).catch((_) => {});
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
  const stream = readable.pipeThrough(
    new TextDecoderStream(),
  );
  for await (const line of stream) {
    let data: Data;
    try {
      data = JSON.parse(line.trim());
    } catch (_) {
      continue;
    }
    const { to, block_hash, nonce } = data;
    try {
      await xpow.mint(
        to,
        block_hash,
        nonce,
        opt_gas(args),
      );
    } catch (e) {
      if (isCallException(e) && e.data) {
        const iface = new Interface(XPOW_ABI);
        console.error(iface.parseError(e.data));
        continue;
      }
      throw e;
    }
    const { amount, hash, now } = data;
    if (args.json) {
      console.log(JSON.stringify({
        amount,
        nonce,
        to,
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
          ["block-hash", block_hash],
          ["hash", hash],
          ["now", now],
        ]),
      );
    }
  }
}
