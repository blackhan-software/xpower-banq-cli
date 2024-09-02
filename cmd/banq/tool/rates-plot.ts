import { assert } from "@std/assert/assert";
import type { USBT } from "./rates.ts";
import { Decimal } from "decimal.js";

export type PlotOptions = {
  subplot: string | boolean;
  symbol: string;
  digits: number;
};

function if_log(subplot: PlotOptions["subplot"]) {
  return typeof subplot === "string" && subplot.match(/-?log$/i);
}

const log = (n: number) => Math.log10(n === 0 ? eps : n);
const exp = (n: number) => n === eps ? 0 : 10 ** n;
const eps = 10e-9;

export async function plot(
  rates: USBT[],
  { subplot, digits, symbol }: PlotOptions,
) {
  const [asciichart, process] = await Promise.all([
    import("../../../lib/asciichart.ts"),
    import("node:process"),
  ]);
  ///
  /// plot all data rows
  ///
  const cfg = {
    padding: " ".repeat(digits + 4),
    digits: digits,
    offset: 3,
    height: 8,
    format: (n: number) => {
      if (if_log(subplot)) {
        const dec = new Decimal(exp(n)).toExponential(digits);
        return `>${(cfg.padding + dec).slice(-cfg.padding.length - 2)}`;
      } else {
        const dec = new Decimal(100 * n).toFixed(digits);
        return `>${(cfg.padding + dec).slice(-cfg.padding.length)}%`;
      }
    },
  };
  ///
  /// get terminal width and resample USBT rates
  ///
  const cols = process.stdout.columns;
  const size = cols - cfg.format(0).length - 2;
  const usbt = re_sample(rates, size);
  ///
  /// init all USBT data rows
  ///
  const data = new Array(4);
  const us = usbt.map(({ u }) => Number(u));
  data[0] = Array.from(if_log(subplot) ? us.map(log) : us);
  const ss = usbt.map(({ s }) => Number(s));
  data[1] = Array.from(if_log(subplot) ? ss.map(log) : ss);
  const bs = usbt.map(({ b }) => Number(b));
  data[2] = Array.from(if_log(subplot) ? bs.map(log) : bs);
  const ts = usbt.map(({ t }) => t);
  data[3] = Array.from(ts);
  ///
  const do_plot = (s: PlotOptions["subplot"], rx: RegExp) => {
    if (typeof s === "string") {
      return s.match(rx) || s.match(/^log$/i);
    }
    return s === true;
  };
  ///
  /// plot utilization rates
  ///
  if (do_plot(subplot, /u|util|utilization/i)) {
    const title_0 = symbol + " [U]tilization Rates:";
    console.log([
      "#",
      `# ${asciichart.colored(title_0, "bold")}`,
      "#",
    ].join("\n"));
    console.log(
      asciichart.plot(data[0], { colors: ["blue"], ...cfg }),
    );
  }
  ///
  /// plot supply rates
  ///
  if (do_plot(subplot, /s|supply/i)) {
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
  /// plot borrow rates
  ///
  if (do_plot(subplot, /b|borrow/i)) {
    const title_2 = symbol + " [B]orrow Interest Rates:";
    console.log([
      "#",
      `# ${asciichart.colored(title_2, "bold")}`,
      "#",
    ].join("\n"));
    console.log(
      asciichart.plot(data[2], { colors: ["red"], ...cfg }),
    );
  }
  ///
  /// plot timestamps
  ///
  if (do_plot(subplot, /t|timestamp/i)) {
    const time = `[${ts[0]}…${ts[Math.max(0, ts.length - 1)]}]`;
    console.log([
      `=`,
      `= ${asciichart.colored(time, "bold")}`,
      `=`,
    ].join("\n"));
  }
}
function re_sample(rates: USBT[], size: number): USBT[] {
  if (rates.length <= size) {
    return sup_sample(rates, size);
  } else {
    return sub_sample(rates, size);
  }
}
function sup_sample(rates: USBT[], size: number): USBT[] {
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
function sub_sample(rates: USBT[], size: number): USBT[] {
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
export default {
  plot,
};
