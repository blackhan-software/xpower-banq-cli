export type Pairs = Array<[key: unknown, value: unknown]>;

export function zip(
  pairs: Pairs,
  eq = "=",
  sep = " ",
) {
  return pairs.map(([k, v]) => `${k}${eq}${v}`).join(sep);
}
export default zip;
