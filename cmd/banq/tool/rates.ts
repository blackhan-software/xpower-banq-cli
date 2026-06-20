import type { Decimal } from "decimal.js";
import { UNIT_BIG, UNIT_TWO } from "../../../constant/index.ts";
import { as_decimal } from "../../../function/as-decimal.ts";
import Utils, { type Util } from "./utils.ts";

export type RateInfo = {
  base: bigint;
  rate: bigint;
  spread: bigint;
  util: bigint;
};
export function format(
  info: RateInfo,
  digits: number,
) {
  const { base, rate, spread, util } = retype(info);
  return {
    u: util.toExponential(digits),
    r: rate.toExponential(digits),
    Δ: spread.toExponential(digits),
    b: base.toExponential(digits),
  };
}
export function retype(
  info: RateInfo,
) {
  return {
    base: as_decimal(info.base),
    rate: as_decimal(info.rate),
    spread: as_decimal(info.spread),
    util: as_decimal(info.util),
  };
}
export function* of(
  utils: Util[],
  info: RateInfo,
  digits: number,
) {
  for (let i = 0; i < utils.length; i++) {
    yield usbt(utils[i], info, digits);
  }
}
export type USBT = {
  u: string;
  s: string;
  b: string;
  t: string;
};
function usbt(
  util: Util,
  info: RateInfo,
  digits: number,
): USBT {
  const sura_dec = supply_rate_by(util, info); // sura = supply-rate
  const sura_exp = sura_dec.toExponential(digits);
  const bora_dec = borrow_rate_by(util, info); // bora = borrow-rate
  const bora_exp = bora_dec.toExponential(digits);
  const util_fmt = Utils.format(util, digits);
  const util_exp = util_fmt.meanValue;
  const date_iso = util_fmt.timestamp;
  return {
    u: util_exp, // [u]tilization
    s: sura_exp, // [s]upply-rate
    b: bora_exp, // [b]orrow-rate
    t: date_iso, // [t]imestamp
  };
}
function supply_rate_by(
  util: Util,
  info: RateInfo,
): Decimal {
  const rate = rate_by(
    util.meanValue,
    info.base,
    info.util,
    info.rate,
  );
  const less = UNIT_BIG - info.spread;
  const sura = (rate * less) / UNIT_BIG;
  return as_decimal(sura);
}
function borrow_rate_by(
  util: Util,
  info: RateInfo,
): Decimal {
  const rate = rate_by(
    util.meanValue,
    info.base,
    info.util,
    info.rate,
  );
  const less = UNIT_BIG + info.spread;
  const bora = (rate * less) / UNIT_BIG;
  return as_decimal(bora);
}
export function rate_by(
  util: bigint,
  base: bigint,
  util_optimal: bigint,
  rate_optimal: bigint,
): bigint {
  if (util === 0n) {
    return 0n;
  }
  let rate: bigint;
  if (util <= util_optimal && util_optimal > 0) {
    rate = (util * rate_optimal) / util_optimal;
  } else {
    const d1U = UNIT_BIG - util_optimal; // d1U = 1 - U_optimal
    const d1R = UNIT_BIG - rate_optimal; // d1R = 1 - R_optimal
    const dUR = util_optimal - rate_optimal; // dUR = U_optimal - R_optimal
    // u×(1-R) >= 1×(U-R) because 0 < u > U
    rate = (util * d1R - UNIT_BIG * dUR) / d1U;
  }
  if (rate > UNIT_TWO - base) {
    return UNIT_TWO;
  }
  return rate + base;
}
export default {
  format,
  retype,
  of,
  rate_by,
};
