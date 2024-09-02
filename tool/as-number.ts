/**
 * @returns number from the given string
 */
export function as_number(text: string): number | undefined {
  const value = Number(text);
  if (Number.isNaN(value)) {
    return undefined;
  }
  return value;
}
