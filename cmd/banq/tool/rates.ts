import { Decimal } from "decimal.js";
import Utils, { type Util } from "./utils.ts";
import { UNIT_BIG, UNIT_DEC } from "../../../constant/index.ts";

export type RateInfo = {
  rate: bigint;
  spread: bigint;
  util: bigint;
};
export function format(
  info: RateInfo,
  digits: number,
) {
  const { rate, spread, util } = retype(info);
  return {
    u: util.toExponential(digits),
    r: rate.toExponential(digits),
    Δ: spread.toExponential(digits),
  };
}
export type PlotOptions = {
  plot: boolean | string;
  digits: number;
  symbol: string;
};
export async function plot(
  rates: USBT[],
  { plot, digits, symbol }: PlotOptions,
) {
  const [asciichart, process] = await Promise.all([
    import("../../../lib/asciichart.ts"),
    import("node:process"),
  ]);
  /// get terminal width and init data
  const size = process.stdout.columns;
  const data = new Array(4);
  /// initialize all data rows
  const us = rates.map(({ u }) => Number(u)).slice(-size);
  data[0] = Array.from(us);
  const ss = rates.map(({ s }) => Number(s)).slice(-size);
  data[1] = Array.from(ss);
  const bs = rates.map(({ b }) => Number(b)).slice(-size);
  data[2] = Array.from(bs);
  const ts = rates.map(({ t }) => t).slice(-size);
  data[3] = Array.from(ts);
  /// plot all data rows
  const cfg = {
    padding: " ".repeat(digits + 4),
    digits: digits,
    height: 10,
    format: (n: number) => {
      return ">" + (cfg.padding + (100 * n).toFixed(cfg.digits)).slice(
        -cfg.padding.length,
      ) + "%";
    },
  };
  const do_plot = (plot: PlotOptions["plot"], rx: RegExp) => {
    return typeof plot === "string" && plot.match(rx) || plot === true;
  };
  ///
  /// plot utilization rates
  ///
  if (do_plot(plot, /U|util|utilization/i)) {
    const title_0 = symbol + " [U]tilization Rates:";
    console.log([
      "#",
      `# ${asciichart.colored(title_0, "bold")}`,
      "#",
    ].join("\n"));
    console.log(
      asciichart.plot(data[0], { colors: ["red"], ...cfg }),
    );
  }
  ///
  /// plot supply rates:
  ///
  if (do_plot(plot, /S|supply/i)) {
    const title_1 = symbol + " [S]upply Interest Rates:";
    console.log([
      "#",
      `# ${asciichart.colored(title_1, "bold")}`,
      "#",
    ].join("\n"));
    console.log(
      asciichart.plot(data[1], { colors: ["green"], ...cfg }),
    );
  }
  ///
  /// plot borrow rates:
  ///
  if (do_plot(plot, /B|borrow/i)) {
    const title_2 = symbol + " [B]orrow Interest Rates:";
    console.log([
      "#",
      `# ${asciichart.colored(title_2, "bold")}`,
      "#",
    ].join("\n"));
    console.log(
      asciichart.plot(data[2], { colors: ["blue"], ...cfg }),
    );
  }
  ///
  /// plot timestamps:
  ///
  if (do_plot(plot, /T|timestamp/i)) {
    const time = `[${ts[0]}…${ts[Math.max(0, ts.length - 1)]}]`;
    console.log([
      `>`,
      `> ${asciichart.colored(time, "bold")}`,
      `>`,
    ].join("\n"));
  }
}
export function retype(
  info: RateInfo,
) {
  return {
    rate: new Decimal(info.rate.toString()).div(UNIT_DEC),
    spread: new Decimal(info.spread.toString()).div(UNIT_DEC),
    util: new Decimal(info.util.toString()).div(UNIT_DEC),
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
type USBT = {
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
  const sura_dec = supply_rate_by(util, info);
  const sura_exp = sura_dec.toExponential(digits);
  const bora_dec = borrow_rate_by(util, info);
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
    info.util,
    info.rate,
  );
  const less = UNIT_BIG - info.spread;
  const sura = (rate * less) / UNIT_BIG;
  return new Decimal(sura.toString()).div(UNIT_DEC);
}
function borrow_rate_by(
  util: Util,
  info: RateInfo,
): Decimal {
  const rate = rate_by(
    util.meanValue,
    info.util,
    info.rate,
  );
  const less = UNIT_BIG + info.spread;
  const bora = (rate * less) / UNIT_BIG;
  return new Decimal(bora.toString()).div(UNIT_DEC);
}
function rate_by(
  util: bigint,
  util_optimal: bigint,
  rate_optimal: bigint,
): bigint {
  if (util <= util_optimal && util_optimal > 0) {
    return (util * rate_optimal) / util_optimal;
  }
  const d1U = UNIT_BIG - util_optimal;
  const d1R = UNIT_BIG - rate_optimal;
  const dUR = util_optimal - rate_optimal;
  // u×(1-R) >= 1×(U-R) because 0 < u > U
  return (util * d1R - UNIT_BIG * dUR) / d1U;
}
export default {
  format,
  plot,
  retype,
  of,
};
