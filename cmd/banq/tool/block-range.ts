/**
 * @returns [lhs_block, rhs_block] for scanning event logs
 */
export function blockRange(
  block_number: number,
  range: [number, number?],
): [number, number] {
  if (typeof range[1] !== "number") {
    // --watch=DLT     => scan in [BLK-DLT*(1.000),BLK-DLT*(0.0)]
    return [block_number - range[0], block_number];
  } else {
    // --watch=DLT@IDX => scan in [BLK-DLT*(1+IDX),BLK-DLT*(IDX)]
    return [
      block_number - range[0] * (range[1] + 1),
      block_number - range[0] * (range[1]),
    ];
  }
}
export default blockRange;
