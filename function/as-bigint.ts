/**
 * @returns big-integer from the given string
 */
export function as_bigint(text: string): bigint | undefined {
  try {
    return BigInt(text);
  } catch (_) {
    return undefined;
  }
}
