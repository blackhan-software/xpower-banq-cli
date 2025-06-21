export function bimax(...args: bigint[]): bigint {
  return args.reduce((max, bi) => (bi > max ? bi : max));
}
export default bimax;
