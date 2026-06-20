const COMMON = [
  "--help",
  "-h",
  "--version",
  "-v",
];
const BROADCAST = [
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
];
/**
 * Print shell completion options and exit.
 */
export function list_options(
  tokens: string[],
  ...options: string[][]
): never {
  if (tokens.length) {
    console.log(tokens.join(" "));
  }
  console.log(COMMON.join(" "));
  console.log(BROADCAST.join(" "));
  for (const opts of options) {
    if (opts.length) console.log(opts.join(" "));
  }
  Deno.exit(0);
}
/**
 * Print common-only shell completion options and exit (no broadcast flags).
 */
export function list_common_options(): never {
  console.log(COMMON.join(" "));
  Deno.exit(0);
}
