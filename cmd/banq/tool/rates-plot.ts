import { assert } from "@std/assert/assert";
import { power_set } from "./power-set.ts";
import type { USBT } from "./rates.ts";
import { Decimal } from "decimal.js";

const UT_WORDS = ["utilization", "util"];
const SU_WORDS = ["supply"];
const BO_WORDS = ["borrow"];
const TS_WORDS = ["timestamp", "time"];

const LOG = (n: number) => Math.log10(n === 0 ? EPS : n);
const EXP = (n: number) => n === EPS ? 0 : 10 ** n;
const EPS = 10e-9;

export type PlotOptions = {
  subplot: string | boolean;
  symbol: string;
  digits: number;
};
export async function plot(
  rates: USBT[],
  { subplot, digits, symbol }: PlotOptions,
) {
  const [chart, process] = await Promise.all([
    import("../../../lib/asciichart.ts"),
    import("node:process"),
  ]);
  //
  // set-up plot configuration
  //
  const conf = (
    words: string[] = [],
    padding = " ".repeat(digits + 4),
  ) => ({
    padding,
    digits,
    offset: 3,
    height: 8,
    format: (n: number) => {
      if (if_log(subplot, words)) {
        const dec = new Decimal(EXP(n)).toExponential(digits);
        return `>${(padding + dec).slice(-padding.length - 2)}`;
      } else {
        const dec = new Decimal(100 * n).toFixed(digits);
        return `>${(padding + dec).slice(-padding.length)}%`;
      }
    },
  });
  //
  // get terminal width and resample rates
  //
  const terminal_cols = process.stdout.columns;
  const horz_offset = conf().format(0).length;
  const size = terminal_cols - horz_offset - 2;
  const usbt = resample(rates, size);
  //
  // init all data usbt-rows
  //
  const data = new Array(4);
  const us = usbt.map(({ u }) => Number(u));
  data[0] = Array.from(if_log(subplot, UT_WORDS) ? us.map(LOG) : us);
  const ss = usbt.map(({ s }) => Number(s));
  data[1] = Array.from(if_log(subplot, SU_WORDS) ? ss.map(LOG) : ss);
  const bs = usbt.map(({ b }) => Number(b));
  data[2] = Array.from(if_log(subplot, BO_WORDS) ? bs.map(LOG) : bs);
  const ts = usbt.map(({ t }) => t);
  data[3] = Array.from(ts);
  //
  // plot utilization rates
  //
  if (do_plot(subplot, UT_WORDS)) {
    const title_0 = symbol + " Pool [U]tilization Rates:";
    console.log([
      "#",
      `# ${chart.colored(title_0, "bold")}`,
      "#",
    ].join("\n"));
    console.log(
      chart.plot(data[0], { colors: ["blue"], ...conf(UT_WORDS) }),
    );
  }
  //
  // plot supply rates
  //
  if (do_plot(subplot, SU_WORDS)) {
    const title_1 = symbol + " [S]upply Interest Rates:";
    console.log([
      "#",
      `# ${chart.colored(title_1, "bold")}`,
      "#",
    ].join("\n"));
    console.log(
      chart.plot(data[1], { colors: ["green"], ...conf(SU_WORDS) }),
    );
  }
  //
  // plot borrow rates
  //
  if (do_plot(subplot, BO_WORDS)) {
    const title_2 = symbol + " [B]orrow Interest Rates:";
    console.log([
      "#",
      `# ${chart.colored(title_2, "bold")}`,
      "#",
    ].join("\n"));
    console.log(
      chart.plot(data[2], { colors: ["red"], ...conf(BO_WORDS) }),
    );
  }
  //
  // plot timestamps
  //
  if (do_plot(subplot, TS_WORDS)) {
    const [lhs, rhs] = [ts[0], ts[Math.max(0, ts.length - 1)]];
    const count = horz_offset + usbt.length - 2 * lhs.length - 4;
    const time = `[${lhs}|${"=".repeat(count)}|${rhs}]`;
    console.log([
      `#`,
      `# ${chart.colored(time, "bold")}`,
      `#`,
    ].join("\n"));
  }
}
function if_log(
  subplots: PlotOptions["subplot"],
  words: string[] = [],
): boolean {
  if (typeof subplots === "string") {
    const usbt = power_set("usbt", true);
    for (const subplot of subplots.split(",")) {
      const plot = subplot.replace(/-log$/i, "");
      const usbt_like = usbt.some(
        (s) => eq_i(s, plot),
      );
      const in_words = power_set(plot).some(
        (s) => s && is_prefix(s, words),
      );
      //
      // plot ~ "usbt" *and* context relevant
      //
      if (usbt_like && in_words) {
        return Boolean(subplot.match(/-log$/i));
      }
      //
      // plot ~ words *and* ends-with '[-]log'
      //
      if (
        is_prefix(plot, words) &&
        subplot.match(/-?log$/i)
      ) {
        return true;
      }
    }
    return false;
  }
  return false;
}
function do_plot(
  subplots: PlotOptions["subplot"],
  words: string[] = [],
): boolean {
  if (typeof subplots === "string") {
    const usbt = power_set("usbt", true);
    for (const subplot of subplots.split(",")) {
      const plot = subplot.replace(/-log$/i, "");
      const usbt_like = usbt.some(
        (s) => eq_i(s, plot),
      );
      const in_words = power_set(plot).some(
        (s) => s && is_prefix(s, words),
      );
      //
      // plot ~ "usbt" *and* context relevant
      //
      if (usbt_like && in_words) {
        return true;
      }
      //
      // plot ~ words *or* equals-to 'log'
      //
      if (
        is_prefix(plot, words) ||
        eq_i(subplot, "log")
      ) {
        return true;
      }
    }
    return false;
  }
  return subplots;
}
function is_prefix(prefix: string, texts: string[]) {
  for (const text of texts) {
    const sub = prefix.substring(0, text.length);
    const rx = new RegExp(`^${sub}`, "i");
    if (rx.test(text)) return true;
  }
  return false;
}
function eq_i(lhs: string, rhs: string) {
  return new RegExp(`^${lhs}$`, "i").test(rhs);
}
function resample(rates: USBT[], size: number): USBT[] {
  if (rates.length <= size) {
    return sup(rates, size);
  } else {
    return sub(rates, size);
  }
  function sup(rates: USBT[], size: number): USBT[] {
    if (size === 0 || rates.length === 0) {
      return [];
    }
    const ratio = Math.floor(size / rates.length);
    assert(ratio >= 1, "impossible super-sampling");
    const usbt = [] as USBT[];
    for (let i = 0; i < rates.length; i++) {
      for (let j = 0; j < ratio; j++) {
        usbt.push(rates[i]);
      }
    }
    return usbt;
  }
  function sub(rates: USBT[], size: number): USBT[] {
    if (size === 0 || rates.length === 0) {
      return [];
    }
    const ratio = Math.floor(rates.length / size);
    assert(ratio >= 1, "impossible sub-sampling");
    const usbt = [] as USBT[];
    for (let i = 0; i < rates.length; i += ratio) {
      usbt.push(rates[i]);
    }
    return usbt;
  }
}
export default {
  plot,
};
