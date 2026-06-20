import { assertEquals } from "@std/assert";
import { format, retype, type TokenInfo } from "./token.ts";

const UNIT = 10n ** 18n;

/**
 * @group retype
 */
Deno.test("token retype: supply Decimal conversion", () => {
  const info: TokenInfo = { supply: UNIT };
  const result = retype(info);
  assertEquals(result.supply.toNumber(), 1);
});
/**
 * @group format
 */
Deno.test("token format: exponential (default)", () => {
  const info: TokenInfo = { supply: UNIT * 100n };
  const result = format(info, 2);
  assertEquals(result.supply.includes("e"), true);
});
Deno.test("token format: fixed", () => {
  const info: TokenInfo = { supply: UNIT };
  const result = format(info, 4, "fixed");
  assertEquals(result.supply, "1.0000");
});
Deno.test("token format: decimal", () => {
  const info: TokenInfo = { supply: UNIT * 1234n };
  const result = format(info, 0, "decimal");
  assertEquals(result.supply, "1,234");
});
