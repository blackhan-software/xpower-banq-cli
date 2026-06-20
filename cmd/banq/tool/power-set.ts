/**
 * The powerset of a string (default: without all combinations).
 */
export function power_set(text: string, combine = false): string[] {
  if (combine) {
    return power_set2(text);
  } else {
    return power_set1(text);
  }
}
/**
 * The powerset of a string with all combinations.
 */
export function power_set2(text: string): string[] {
  const result: string[] = [];
  const set = power_set1(text);
  for (const subset of set) {
    result.push(...combine(subset));
  }
  return unique(result);
}
/**
 * The powerset of a string.
 */
export function power_set1(text: string): string[] {
  const result: string[][] = [[]];
  const chars = text.split("");
  for (const char of chars) {
    const length = result.length;
    for (let i = 0; i < length; i++) {
      result.push([...result[i], char]);
    }
  }
  return unique(result.map((el) => el.join("")));
}
/**
 * Combine the characters of a string.
 */
export function combine(text: string): string[] {
  const result: string[] = [];
  const length = text.length;
  for (let l = 1; l <= length; l++) {
    const generate = (start: number, combination: string[]) => {
      if (combination.length === l) {
        result.push(...permute(combination.join("")));
        return;
      }
      for (let i = start; i < length; i++) {
        generate(i + 1, [...combination, text[i]]);
      }
    };
    generate(0, []);
  }
  return unique(result);
}
/**
 * Permute the characters of a string.
 */
export function permute(text: string): string[] {
  const result: string[] = [];
  const generate = (a: string[], curr: string[] = []): void => {
    if (a.length === 0) {
      result.push(curr.join(""));
      return;
    }
    for (let i = 0; i < a.length; i++) {
      const remaining = [...a.slice(0, i), ...a.slice(i + 1)];
      generate(remaining, [...curr, a[i]]);
    }
  };
  generate(text.split(""));
  return unique(result);
}
/**
 * Remove duplicates from an array.
 */
function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}
export default {
  power_set,
  combine,
  permute,
};
