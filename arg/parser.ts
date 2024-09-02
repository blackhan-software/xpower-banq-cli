/**
 * Denote hex-literals as bigint with a trailing `n` suffix.
 */
export function suffix_n(
  strings: string[],
): string[] {
  return strings.map(
    (s) => s.match(/^0x([0-9a-f]+)$/i) ? s + "n" : s,
  );
}
/**
 * Convert hex-literals with a trailing `n` suffix to bigints.
 */
export function hex2bigint(
  args: (string | number)[],
) {
  return args.map((a) => {
    if (typeof a === "string") {
      if (a.match(/^0x[0-9a-f]+n$/i)) {
        return BigInt(a.substring(0, a.length - 1));
      }
    }
    return a;
  });
}
/**
 * Convert bigint to hex-literal (with a leading `0x`).
 */
export function bigint2hex(
  args: (bigint | number)[],
  length = 0,
): string[] {
  return args.map((a) => {
    return "0x" + a.toString(16).padStart(length, "0");
  });
}
/**
 * Normalize `argv` by converting hyphenated keys
 * to underscored keys (including aliases).
 */
export function underscore<
  R1 extends Record<string, unknown>,
  R2 extends Record<string, string>,
>(argv: R1, alias: R2) {
  const map = <
    K1 extends keyof R1,
  >(argv: R1, src: K1, tgt: K1, alt: K1) => {
    if (alt) {
      argv[alt] = argv[src];
    }
    argv[tgt] = argv[src];
    delete argv[src];
  };
  const args = Object.keys(argv).filter(
    (k) => k.includes("-"),
  );
  for (const src of args) {
    const tgt = src.replace(/-/g, "_");
    map(argv, src, tgt, alias[tgt]);
  }
  return argv;
}
