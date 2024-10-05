import * as process from "node:process";
import * as readline from "node:readline";

/**
 * The arguments for the spinner.
 */
export type SpinnerArgs = string | SpinnerOpts;
/**
 * The options for the spinner.
 */
export type SpinnerOpts = Partial<{
  /// The delay in milliseconds.
  delay: number;
  /// The list of spinners.
  spinners: string[];
  /// The output stream.
  stream: NodeJS.WriteStream;
  /// The text to display.
  text: string;
  /// True to display the lhs-spinner.
  with_lhs: boolean;
  /// True to display the rhs-spinner.
  with_rhs: boolean;
  /// Called on each tick of the spinner.
  onTick: (t: string) => void;
}>;
/**
 * A simple spinner for the command line.
 */
export class Spinner {
  /**
   * Create a new spinner (default: 60ms delay).
   * @param args for the spinner.
   */
  constructor(args: SpinnerArgs = "%s") {
    if (typeof args === "string") {
      args = { text: args };
    }
    this._text = args.text ?? "%s";
    this._spins = args.spinners ?? spinners(args);
    this._delay = args.delay ?? 60; // milliseconds
    this._output = args.stream ?? process.stdout;
    if (args.onTick) this.onTick = args.onTick;
  }
  /**
   * Clear the spinner.
   */
  clear() {
    readline.clearLine(this._output, 0);
    readline.cursorTo(this._output, 0);
  }
  /**
   * Start the spinner.
   * @param index of the spinner to start at.
   */
  start(index = 0) {
    this._id = setInterval(() => {
      this.onTick(
        this._text.indexOf("%s") > -1
          ? this._text.replace("%s", this._spins[index])
          : this._spins[index] + " " + this._text,
      );
      index = ++index % this._spins.length;
    }, this._delay);
  }
  /**
   * Stop the spinner.
   * @param clear True to clear the spinner.
   */
  stop(clear: boolean) {
    clearInterval(this._id);
    this._id = undefined;
    if (clear) this.clear();
  }
  /**
   * Called on each tick of the spinner.
   * @param text to display.
   */
  onTick(text: string) {
    this.clear();
    this._output.write(text);
  }
  private _delay: number;
  private _id: number | undefined;
  private _output: NodeJS.WriteStream;
  private _spins: string[];
  private _text: string;
}
/**
 * Create a list of spinners (default: braille without bar).
 *
 * @param options for the spinners.
 * @returns list of spinners.
 */
function spinners({
  /// The spinner function (default: braille).
  spinner = (t: number) => ["⣷", "⣯", "⣟", "⡿", "⢿", "⣻", "⣽", "⣾"][t % 8],
  /// True to display a lhs-spinner (default: false, i.e. without bar).
  with_lhs = false,
  /// True to display a rhs-spinner (default: true, i.e. with braille).
  with_rhs = true,
}) {
  const l2r_bar = (i: number) => { // left-to-right bar
    return `[[37m${"█".repeat(i)}[30m${".".repeat(18 - i)}[37m]`;
  };
  const r2l_bar = (j: number) => { // right-to-left bar
    return `[[30m${".".repeat(j - 18)}[37m${"█".repeat(36 - j)}]`;
  };
  const list: string[] = [];
  for (let i = 0; i < 19; i++) {
    const lhs = with_lhs ? l2r_bar(i) : "";
    const rhs = with_rhs ? spinner(i) : "";
    list.push(lhs + rhs);
  }
  for (let j = 19; j < 36; j++) {
    const lhs = with_lhs ? r2l_bar(j) : "";
    const rhs = with_rhs ? spinner(j) : "";
    list.push(lhs + rhs);
  }
  return list;
}
export default Spinner;
