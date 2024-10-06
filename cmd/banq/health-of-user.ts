import TOKEN_ABI from "./abi/erc20-abi.json" with { type: "json" };
import POOL_ABI from "./abi/pool-abi.json" with { type: "json" };
import POSITION_ABI from "./abi/position-abi.json" with { type: "json" };

import { Decimal } from "decimal.js";
import { ethers, isCallException } from "ethers";

import { arg_address } from "../../arg/arg-address.ts";
import { opt_digits } from "../../arg/opt-digits.ts";
import { opt_pool } from "../../arg/opt-pool.ts";
import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { wallet } from "../../wallet/index.ts";
import type { CommandResult } from "../types.ts";
import { mapBy } from "./tool/map-by.ts";

/**
 * health-of $USER_ADDRESS [--options]
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
    console.log([
      "--digits",
      "-d",
      "--pool",
      "-p",
    ].join(" "));
    Deno.exit(0);
  }
  const user = arg_address(args.rest);
  const { address: pool } = opt_pool(args);
  const digits = opt_digits(args);
  if (!args.broadcast) {
    return [[x(user)], [false]];
  }
  const { signer } = await wallet(args, true);
  ///
  /// user position(s) incl. health
  ///
  const POOL = new ethers.Contract(x(pool), POOL_ABI, signer);
  try {
    const [health, tokens] = await Promise.all([
      POOL.healthOf(x(user)) as Promise<
        { wnav_borrow: bigint; wnav_supply: bigint }
      >,
      POOL.tokens() as Promise<string[]>,
    ]);
    const borrow = new Decimal(health.wnav_borrow.toString());
    const supply = new Decimal(health.wnav_supply.toString());
    const ratio = supply.div(borrow); // supply -vs- borrow
    const positions = await Promise.all(
      tokens.map(async (token) => {
        const [sp, bp] = await Promise.all([
          POOL.supplyOf(token), // sp-address
          POOL.borrowOf(token), // bp-address
        ]);
        const S_POS = new ethers.Contract(sp, POSITION_ABI, signer);
        const B_POS = new ethers.Contract(bp, POSITION_ABI, signer);
        const TOKEN = new ethers.Contract(token, TOKEN_ABI, signer);
        const [supply, borrow, symbol] = await Promise.all([
          S_POS.balanceOf(x(user)) as Promise<bigint>,
          B_POS.balanceOf(x(user)) as Promise<bigint>,
          TOKEN.symbol() as Promise<string>,
        ]);
        return { supply, borrow, symbol };
      }),
    );
    const positions_exp = positions.map((p) => ({
      supply: new Decimal(p.supply.toString()).div(1e18),
      borrow: new Decimal(p.borrow.toString()).div(1e18),
      symbol: p.symbol,
    })).map((p) => ({
      supply: p.supply.toExponential(digits),
      borrow: p.borrow.toExponential(digits),
      symbol: p.symbol,
    }));
    const positions_map = mapBy(positions_exp, "symbol", {
      health: ratio.toExponential(digits),
    });
    return [[x(user)], [JSON.stringify(positions_map)]];
  } catch (e) {
    if (isCallException(e)) {
      return [[x(user)], [e.reason]];
    }
    throw e;
  }
}
