/**
 * @see https://github.com/kroitor/asciichart
 */

/**
 * Configuration object for the plot function.
 */
export type Config = Partial<{
  colors: Color[];
  digits: number;
  height: number;
  max: number;
  min: number;
  offset: number;
  padding: string;
  symbols: string[];
  format: (n: number, i?: number) => string;
}>;
/**
 * Return a chart for the given data and configuration.
 *
 * @param data The data of 1D- or 2D-numbers to plot
 * @param conf The configuration of the chart
 * @returns ASCII chart
 */
export const plot = (
  data: number[] | number[][],
  conf: Config = {},
): string => {
  if (typeof data[0] == "number") {
    data = [data as number[]];
  } else {
    data = data as number[][];
  }
  //
  // Configuration and defaults
  //
  const min = conf.min ?? Math.min(
    ...data.map((row) => Math.min(...row)),
  );
  const max = conf.max ?? Math.max(
    ...data.map((row) => Math.max(...row)),
  );
  const range = Math.abs(max - min);
  const offset = conf.offset ?? 3;
  const padding = conf.padding ?? " ".repeat(6);
  const height = conf.height ?? range;
  const colors = conf.colors ?? [];
  const digits = conf.digits ?? 2;
  const ratio = range !== 0 ? height / range : 1;
  const min2 = Math.round(min * ratio);
  const max2 = Math.round(max * ratio);
  const rows = Math.abs(max2 - min2);
  const width = offset + data.reduce((m, s) => Math.max(m, s.length), 0);
  const symbols = conf.symbols ?? SYMBOLS;
  const format = conf.format ?? ((n: number) => {
    return (padding + n.toFixed(digits)).slice(-padding.length);
  });
  //
  // Fill the chart with empty spaces
  //
  const chart: string[][] = new Array(rows + 1);
  for (let i = 0; i <= rows; i++) {
    chart[i] = new Array(width);
    for (let j = 0; j < width; j++) {
      chart[i][j] = " ";
    }
    chart[i][width - 1] = symbols[11];
  }
  //
  // Draw the chart's y-axis and labels
  //
  for (let y = min2; y <= max2; ++y) {
    const label = format(
      rows > 0 ? max - ((y - min2) * range) / rows : y,
      y - min2,
    );
    chart[y - min2][Math.max(offset - label.length, 0)] = label;
    chart[y - min2][offset - 1] = symbols[y === 0 ? 0 : 1];
  }
  //
  // Plot all chart lines for the data
  //
  for (let j = 0; j < data.length; j++) {
    const color = colors[j % colors.length];
    const y0 = Math.round(data[j][0] * ratio) - min2;
    chart[rows - y0][offset - 1] = colored(symbols[0], color); // 1st value
    //
    // Plot the line
    //
    for (let x = 0; x < data[j].length - 1; x++) {
      const y0 = Math.round(data[j][x + 0] * ratio) - min2;
      const y1 = Math.round(data[j][x + 1] * ratio) - min2;
      if (y0 == y1) { // without slope
        chart[rows - y0][x + offset] = colored(symbols[4], color);
      } else { // with slope
        chart[rows - y1][x + offset] = colored(
          y0 > y1 ? symbols[5] : symbols[6],
          color,
        );
        chart[rows - y0][x + offset] = colored(
          y0 > y1 ? symbols[7] : symbols[8],
          color,
        );
        const lhs = Math.min(y0, y1);
        const rhs = Math.max(y0, y1);
        for (let y = lhs + 1; y < rhs; y++) {
          chart[rows - y][x + offset] = colored(symbols[9], color);
        }
      }
    }
    //
    // Plot the area below the line
    //
    for (let x = 0; x < data[j].length - 1; x++) {
      const y0 = Math.round(data[j][x] * ratio) - min2;
      for (let y = 0; y < y0; y++) {
        if (chart[rows - y][x + offset] === " ") {
          chart[rows - y][x + offset] = colored(symbols[10], color);
        }
      }
    }
  }
  return chart.map((row) => row.join("")).join("\n");
};
export const SYMBOLS = [
  "┼", // 0
  "┤", // 1
  "╶", // 2
  "╴", // 3
  "─", // 4
  "╰", // 5
  "╭", // 6
  "╮", // 7
  "╯", // 8
  "│", // 9
  "┈", // 10
  " ", // 11
];
export const colored = (text: string, color?: Color) => {
  if (typeof color === "string" && color in COLORS) {
    return COLORS[color] + text + COLORS.reset;
  }
  return text;
};
export type Color = keyof typeof COLORS;
const COLORS: Record<string, string> = {
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  // light colors
  lightblue: "\x1b[94m",
  lightcyan: "\x1b[96m",
  lightgray: "\x1b[37m",
  lightgreen: "\x1b[92m",
  lightmagenta: "\x1b[95m",
  lightred: "\x1b[91m",
  lightyellow: "\x1b[93m",
  // other colors
  base: "\x1b[39m",
  black: "\x1b[30m",
  white: "\x1b[97m",
  // reset color
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};
export default { plot };
