/**
 * Maps an array of objects into a record using a specified key from
 * each object. The key is omitted from the resulting objects.
 *
 * @param records - Array of records to map.
 * @param key - The key to use as the index for the resulting record.
 * @param init - Optional initial record to merge with.
 * @returns A record where each key is the value of the specified key
 *          in the objects, and the values are the objects with that
 *          key omitted.
 */
export function mapBy<
  R extends Record<string, unknown>,
  K extends keyof R,
  T = Omit<R, K>,
>(
  records: R[],
  key: K,
  init = {} as Record<string, T>,
) {
  return records.reduce((acc, item) => {
    const { [key]: _, ...rest } = item;
    return { [`${item[key]}`]: rest as T, ...acc };
  }, init);
}
export default mapBy;
