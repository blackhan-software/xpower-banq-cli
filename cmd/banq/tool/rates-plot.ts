import { Decimal } from "decimal.js";
import * as chart from "./asciichart.ts";
import { power_set } from "./power-set.ts";
import type { USBT } from "./rates.ts";

const UT_WORDS = ["utilization", "util"];
const SU_WORDS = ["supply"];
const BO_WORDS = ["borrow"];
const TS_WORDS = ["timestamp", "time"];

const LOG = (n: number) => Math.log10(n === 0 ? EPS : n);
const EXP = (n: number) => n === EPS ? 0 : 10 ** n;
const EPS = 10e-9;

/**
 * Plot options.
 */
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
 * @param options The plot options.
 */
export async function plot(
  rates: USBT[],
  options: PlotOptions,
) {
  const process = await import("node:process");
  const terminal_cols = process.stdout.columns;
  //
  // plot utilization-rates: heading and chart
  //
  if (use_plot(options, UT_WORDS)) {
    const config = configure(options, UT_WORDS);
    const length = config.format(0).length;
    const size = terminal_cols - length - 2;
    const usbt = resample(rates, size);
    //
    let us = usbt.map(({ u }) => Number(u));
    if (use_log(options, UT_WORDS)) {
      us = us.map(LOG);
    }
    const title = "Pool [U]tilization Rates:";
    console.log([
      "#",
      `# ${chart.colored(`${options.symbol} ${title}`, "bold")}`,
      "#",
    ].join("\n"));
    console.log(
      chart.plot(us, { colors: ["lightblue"], ...config }),
    );
  }
  //
  // plot supply-rates: heading and chart
  //
  if (use_plot(options, SU_WORDS)) {
    const config = configure(options, SU_WORDS);
    const offset = config.format(0).length;
    const size = terminal_cols - offset - 2;
    const usbt = resample(rates, size);
    //
    let ss = usbt.map(({ s }) => Number(s));
    if (use_log(options, SU_WORDS)) {
      ss = ss.map(LOG);
    }
    const title = "[S]upply Interest Rates:";
    console.log([
      "#",
      `# ${chart.colored(`${options.symbol} ${title}`, "bold")}`,
      "#",
    ].join("\n"));
    console.log(
      chart.plot(ss, { colors: ["lightgreen"], ...config }),
    );
  }
  //
  // plot borrow-rates: heading and chart
  //
  if (use_plot(options, BO_WORDS)) {
    const config = configure(options, BO_WORDS);
    const offset = config.format(0).length;
    const size = terminal_cols - offset - 2;
    const usbt = resample(rates, size);
    //
    let bs = usbt.map(({ b }) => Number(b));
    if (use_log(options, BO_WORDS)) {
      bs = bs.map(LOG);
    }
    const title = "[B]orrow Interest Rates:";
    console.log([
      "#",
      `# ${chart.colored(`${options.symbol} ${title}`, "bold")}`,
      "#",
    ].join("\n"));
    console.log(
      chart.plot(bs, { colors: ["lightred"], ...config }),
    );
  }
  //
  // plot timestamps i.e. "x-axis"
  //
  if (use_plot(options, TS_WORDS)) {
    const config = configure(options, TS_WORDS);
    const offset = config.format(0).length;
    const size = terminal_cols - offset - 2;
    const usbt = resample(rates, size);
    //
    const ts = usbt.map(({ t }) => t);
    const [lhs, rhs] = [ts[0], ts[Math.max(0, ts.length - 1)]];
    const count = offset + usbt.length - 2 * lhs.length - 5;
    const title = `[${lhs}|${"═".repeat(count)}|${rhs}]`;
    console.log([
      `#`,
      `# ${chart.colored(title)}`,
      `#`,
    ].join("\n"));
  }
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
  return {
    digits: options.digits,
    height: 8,
    offset: 3,
    padding,
    format: (n: number) => {
      if (use_log(options, words)) {
        const dec = new Decimal(EXP(n)).toExponential(options.digits);
        return `>${(padding + dec).slice(-padding.length)}`;
      } else {
        const dec = new Decimal(100 * n).toFixed(options.digits);
        return `>${(padding + dec).slice(-padding.length)}%`;
      }
    },
  };
}
/**
 * Checks if the given subplot should be plotted in log scale.
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
