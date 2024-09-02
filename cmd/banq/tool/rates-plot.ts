import type { USBT } from "./rates.ts";

export type PlotOptions = {
  subplot: string | boolean;
  symbol: string;
  digits: number;
};
export async function plot(
  rates: USBT[],
  { subplot, digits, symbol }: PlotOptions,
) {
  const [asciichart, process] = await Promise.all([
    import("../../../lib/asciichart.ts"),
    import("node:process"),
  ]);
  ///
  /// get terminal width and init data
  ///
  const cols = process.stdout.columns;
  const usbt = rates.slice(-cols);
  const data = new Array(4);
  ///
  /// init all USBT data rows
  ///
  const us = usbt.map(({ u }) => Number(u));
  data[0] = Array.from(us);
  const ss = usbt.map(({ s }) => Number(s));
  data[1] = Array.from(ss);
  const bs = usbt.map(({ b }) => Number(b));
  data[2] = Array.from(bs);
  const ts = usbt.map(({ t }) => t);
  data[3] = Array.from(ts);
  ///
  /// plot all data rows
  ///
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
  const do_plot = (s: PlotOptions["subplot"], rx: RegExp) => {
    return typeof s === "string" && s.match(rx) || s === true;
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
      asciichart.plot(data[0], { colors: ["red"], ...cfg }),
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
      asciichart.plot(data[2], { colors: ["blue"], ...cfg }),
    );
  }
  ///
  /// plot timestamps
  ///
  if (do_plot(subplot, /t|timestamp/i)) {
    const time = `[${ts[0]}…${ts[Math.max(0, ts.length - 1)]}]`;
    console.log([
      `>`,
      `> ${asciichart.colored(time, "bold")}`,
      `>`,
    ].join("\n"));
  }
}
export default {
  plot,
};
