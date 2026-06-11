import { Decimal } from "decimal.js";

export const UNIT_BIG = 10n ** 18n;
export const UNIT_DEC = new Decimal(UNIT_BIG.toString());
