export function bimin(...args: bigint[]): bigint {
  return args.reduce((min, bi) => (bi < min ? bi : min));
}
export default bimin;
