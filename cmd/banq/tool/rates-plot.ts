import { Decimal } from "decimal.js";
import process from "node:process";

import * as chart from "./asciichart.ts";
import { power_set } from "./power-set.ts";
import type { USBT } from "./rates.ts";
import type { TokenInfo } from "./token.ts";
import Token from "./token.ts";

const UT_WORDS = ["utilization", "util"];
const SU_WORDS = ["supply"];
const BO_WORDS = ["borrow"];
const TS_WORDS = ["timestamp", "time"];

const LOG = (n: number) => Math.log10(n === 0 ? EPS : n);
const EXP = (n: number) => n === EPS ? 0 : 10 ** n;
const EPS = 10e-9;

export type PlotOptions = {
  /// The subplot(s) to plot: "log", "usbt", "usbt-log",
  /// "util,supply,borrow,time", "util-log,time" etc.
  subplot: string | boolean;
  /// The token symbol in the heading(s).
  symbol: string;
  /// The number of decimal digits of the y-axis.
  digits: number;
};
/**
 * Plots the rates in the terminal.
 *
 * @param rates The rates to plot.
 * @param sp_info The supply token information.
 * @param bp_info The borrow token information.
 * @param options The plot options.
 */
export function plot(
  rates: USBT[],
  sp_info: TokenInfo,
  bp_info: TokenInfo,
  options: PlotOptions,
) {
  if (use_plot(options, UT_WORDS)) {
    const title = title_of({
      lhs: `> Pool Utilization Rates`,
      rhs: `${options.symbol}`,
    });
    plot_("u")(rates, options, UT_WORDS, title, "lightblue");
  }
  if (use_plot(options, SU_WORDS)) {
    const sp = Token.format(sp_info, options.digits, "decimal");
    const title = title_of({
      lhs: `> Supply Interest Rates`,
      rhs: `${sp.supply} s${options.symbol}`,
    });
    plot_("s")(rates, options, SU_WORDS, title, "lightgreen");
  }
  if (use_plot(options, BO_WORDS)) {
    const bp = Token.format(bp_info, options.digits, "decimal");
    const title = title_of({
      lhs: `> Borrow Interest Rates`,
      rhs: `${bp.supply} b${options.symbol}`,
    });
    plot_("b")(rates, options, BO_WORDS, title, "lightred");
  }
  if (use_plot(options, TS_WORDS)) {
    plot_t(rates, options, TS_WORDS);
  }
}
function title_of({ lhs, rhs }: {
  lhs: string;
  rhs: string;
}) {
  const cols = process.stdout.columns;
  const count = cols - lhs.length - rhs.length - 4;
  const padding = " ".repeat(count);
  return `${lhs}${padding}${rhs}`;
}
/**
 * Plots the utilization, supply, or borrow rates.
 */
const plot_ = (field: Exclude<keyof USBT, "t">) =>
(
  rates: USBT[],
  options: PlotOptions,
  words: string[],
  title: string,
  color: string,
) => {
  const cols = process.stdout.columns;
  const conf = configure(options, words);
  const left = conf.format(0).length; // offset
  const usbt = resample(rates, cols - left - 2);
  //
  let value = usbt.map((item) => Number(item[field]));
  if (use_log(options, words)) value = value.map(LOG);
  const count = clamp(cols - title.length - 4, 0);
  const space = " ".repeat(count);
  console.log([
    `╔${"═".repeat(clamp(cols - 2))}╗`,
    `║ ${chart.colored(title, "bold")}${space} ║`,
    `╟${"─".repeat(clamp(cols - 2))}╢`,
  ].join("\n"));
  console.log(
    chart.plot(value, { colors: [color], ...conf }),
  );
};
/**
 * Plots the timestamps.
 */
function plot_t(
  rates: USBT[],
  options: PlotOptions,
  words: string[],
) {
  const cols = process.stdout.columns;
  const conf = configure(options, words);
  const left = conf.format(0).length; // offset
  const usbt = resample(rates, cols - left - 2);
  //
  const time = usbt.map(({ t }) => t);
  const tmin = time[0];
  const tmax = time[Math.max(0, time.length - 1)];
  const count = clamp(cols - 2 * tmin.length - 6);
  const title = `${tmin}|${":".repeat(count)}|${tmax}`;
  console.log([
    `╔${"═".repeat(clamp(cols - 2))}╗`,
    `║ ${chart.colored(title)} ║`,
    `╚${"═".repeat(clamp(cols - 2))}╝`,
  ].join("\n"));
}
/**
 * Prepares subplot configuration.
 */
function configure(
  options: Pick<PlotOptions, "subplot" | "digits">,
  words: string[] = [],
) {
  const padding = use_log(options, words)
    ? " ".repeat(options.digits + 6)
    : " ".repeat(options.digits + 3);
  const symbols = [...chart.SYMBOLS];
  symbols[11] = "║";
  return {
    digits: options.digits,
    height: 10,
    offset: 3,
    padding,
    symbols,
    format: (n: number) => {
      if (use_log(options, words)) {
        const dec = new Decimal(EXP(n)).toExponential(options.digits);
        return `║${(padding + dec).slice(-padding.length)}`;
      } else {
        const dec = new Decimal(100 * n).toFixed(options.digits);
        return `║${(padding + dec).slice(-padding.length)}%`;
      }
    },
  };
}
/**
 * Checks if the given subplot should be plotted in log-scale.
 */
function use_log(
  { subplot: subplots }: Pick<PlotOptions, "subplot">,
  selector: string[] = [],
): boolean {
  if (typeof subplots === "string") {
    const usbt = power_set("usbt", true);
    for (const subplot of subplots.split(",")) {
      const plot = subplot.replace(/-log$/i, "");
      const usbt_like = usbt.some(
        (s) => eq_i(s, plot),
      );
      const in_words = power_set(plot).some(
        (s) => s && is_prefix(s, selector),
      );
      //
      // plot ~ "usbt" *and* context relevant
      //
      if (usbt_like && in_words) {
        return Boolean(subplot.match(/-log$/i));
      }
      //
      // ends-with '-log' *and* plot ~ words (or is 'log')
      //
      if (
        subplot.match(/-log$/i) &&
          is_prefix(plot, selector) || eq_i(subplot, "log")
      ) {
        return true;
      }
    }
    return false;
  }
  return false;
}
/**
 * Checks if the given subplot should be plotted.
 */
function use_plot(
  { subplot: subplots }: Pick<PlotOptions, "subplot">,
  selector: string[] = [],
): boolean {
  if (typeof subplots === "string") {
    const usbt = power_set("usbt", true);
    for (const subplot of subplots.split(",")) {
      const plot = subplot.replace(/-log$/i, "");
      const usbt_like = usbt.some(
        (s) => eq_i(s, plot),
      );
      const in_words = power_set(plot).some(
        (s) => s && is_prefix(s, selector),
      );
      //
      // plot ~ "usbt" *and* context relevant
      //
      if (usbt_like && in_words) {
        return true;
      }
      //
      // plot ~ words (or is 'log')
      //
      if (
        is_prefix(plot, selector) || eq_i(subplot, "log")
      ) {
        return true;
      }
    }
    return false;
  }
  return subplots;
}
/**
 * Returns the clamped value between the given min and max.
 */
function clamp(n: number, min: number = 0, max: number = Infinity) {
  return Math.min(Math.max(n, min), max);
}
/**
 * Checks if the given string is a prefix of any of the given strings.
 */
function is_prefix(prefix: string, texts: string[]) {
  for (const text of texts) {
    const sub = prefix.substring(0, text.length);
    const rx = new RegExp(`^${sub}`, "i");
    if (rx.test(text)) return true;
  }
  return false;
}
/**
 * Checks if the given strings are equal ignoring case.
 */
function eq_i(lhs: string, rhs: string) {
  return new RegExp(`^${lhs}$`, "i").test(rhs);
}
/**
 * Resamples the rates to a given size w.r.t. timestamps.
 *
 * @param rates The rates to resample from.
 * @param size The size of the resampled rates.
 * @returns The resampled rates.
 */
function resample(rates: USBT[], size: number): USBT[] {
  if (rates.length === 0 || size === 0) {
    return [];
  }
  const times = rates.map(({ t }) => new Date(t).getTime());
  const [t_min, t_max] = [times[0], times[times.length - 1]];
  const interval = (t_max - t_min) / (size - 1);
  const samples = [] as USBT[];
  ///
  let sample_index = 0;
  for (let i = 0; i < size; i++) {
    const tick = t_min + i * interval;
    while (
      sample_index < times.length - 1 &&
      times[sample_index + 1] <= tick
    ) {
      sample_index++;
    }
    samples.push(rates[sample_index]);
  }
  return samples;
}
export default {
  plot,
};
